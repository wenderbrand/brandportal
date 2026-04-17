-- ═══════════════════════════════════════════════════
--  BRAND PORTAL — Supabase Schema
--  Execute no SQL Editor do Supabase Dashboard
-- ═══════════════════════════════════════════════════

-- ── 1. PROJECTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  logo_url     TEXT,
  is_published BOOLEAN DEFAULT FALSE NOT NULL,
  slug         TEXT UNIQUE,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index para queries por user
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
-- Index para lookup por slug (portal público)
CREATE INDEX IF NOT EXISTS projects_slug_idx ON public.projects(slug) WHERE slug IS NOT NULL;

-- ── 2. PROJECT CONTENT ───────────────────────────────
-- Armazena o conteúdo JSON de cada seção do portal
CREATE TABLE IF NOT EXISTS public.project_content (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  section    TEXT NOT NULL CHECK (section IN ('capa','logotipo','cores','tipografia','textos','arquivos')),
  content    JSONB DEFAULT '{}'::jsonb NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (project_id, section)  -- upsert por (project_id, section)
);

CREATE INDEX IF NOT EXISTS project_content_project_id_idx ON public.project_content(project_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_content_updated_at ON public.project_content;
CREATE TRIGGER project_content_updated_at
  BEFORE UPDATE ON public.project_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 3. ASSETS ────────────────────────────────────────
-- Arquivos para download no portal
CREATE TABLE IF NOT EXISTS public.assets (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_url   TEXT NOT NULL,
  file_name  TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS assets_project_id_idx ON public.assets(project_id);

-- ════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════

ALTER TABLE public.projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets          ENABLE ROW LEVEL SECURITY;

-- ── projects: dono pode tudo, público pode ler publicados ──
CREATE POLICY "owner_all_projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "public_read_published" ON public.projects
  FOR SELECT USING (is_published = TRUE);

-- ── project_content: dono pode tudo, público lê se projeto publicado ──
CREATE POLICY "owner_all_content" ON public.project_content
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );

CREATE POLICY "public_read_published_content" ON public.project_content
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.is_published = TRUE)
  );

-- ── assets: dono pode tudo, público lê se projeto publicado ──
CREATE POLICY "owner_all_assets" ON public.assets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );

CREATE POLICY "public_read_published_assets" ON public.assets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.is_published = TRUE)
  );

-- ════════════════════════════════════════════════════
--  STORAGE BUCKETS
-- ════════════════════════════════════════════════════

-- Crie o bucket 'assets' no Supabase Dashboard → Storage → New Bucket
-- Nome: assets
-- Public: SIM (para URLs públicas de logos e arquivos)

-- Políticas de Storage (execute via Dashboard → Storage → Policies):
-- Ou use o SQL abaixo:

INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Usuários autenticados podem fazer upload na pasta deles
CREATE POLICY "auth_upload_assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assets');

-- Usuários autenticados podem atualizar seus arquivos
CREATE POLICY "auth_update_assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Leitura pública de todos os arquivos do bucket
CREATE POLICY "public_read_assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'assets');

-- ════════════════════════════════════════════════════
--  VERIFICAÇÃO (opcional — rode para confirmar)
-- ════════════════════════════════════════════════════
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

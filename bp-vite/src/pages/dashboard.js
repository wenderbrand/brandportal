import { mount, toast } from '../lib/utils.js'
import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'
import { renderNavbar } from '../components/navbar.js'

export async function renderDashboard() {
  const user = supabase.auth.getUser()
  if (!user) { navigate('/login'); return }

  mount(`
    ${renderNavbar(user)}
    <main class="dash">
      <div class="container">

        <div class="dash-top">
          <div>
            <p class="dash-eyebrow">Workspace</p>
            <h1 class="dash-heading">Meus Portais</h1>
          </div>
          <button class="dash-new-btn" id="new-project-btn">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo Portal
          </button>
        </div>

        <div id="projects-area">
          <div class="skel-grid">
            ${[1,2,3].map(() => `
              <div class="skel-card">
                <div class="skel-top">
                  <div class="skel-avatar"></div>
                  <div class="skel-badge"></div>
                </div>
                <div class="skel-line" style="width:58%;height:17px;margin-bottom:8px"></div>
                <div class="skel-line" style="width:32%;height:11px"></div>
              </div>`).join('')}
          </div>
        </div>

      </div>
    </main>

    <div id="new-modal" class="overlay" style="display:none">
      <div class="modal">
        <div class="modal-hd">
          <h2 class="modal-title">Novo Portal</h2>
          <button id="close-modal" class="btn-icon" aria-label="Fechar">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <p class="modal-sub">Você poderá editar todos os detalhes no editor.</p>
        <form id="new-form" novalidate>
          <div class="field" style="margin-bottom:16px">
            <label class="label" for="brand-name">Nome da Marca</label>
            <input class="input" id="brand-name" type="text" placeholder="Ex: Studio Nova" required autocomplete="off">
          </div>
          <div class="field" style="margin-bottom:24px">
            <label class="label">Logo (opcional)</label>
            <div class="upload-zone" id="logo-zone">
              <input type="file" id="logo-file" accept="image/*" hidden>
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span id="upload-label">Clique ou arraste sua logo</span>
              <span style="font-size:11px;color:var(--text-3)">PNG, SVG, JPG</span>
            </div>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button type="button" id="cancel-modal" class="btn btn-ghost">Cancelar</button>
            <button type="submit" id="create-btn" class="dash-new-btn" style="padding:10px 20px;font-size:13px">
              Criar Portal
            </button>
          </div>
        </form>
      </div>
    </div>
  `)

  await loadProjects(user.id)
  bindModal(user)
}

function bindModal(user) {
  const modal  = document.getElementById('new-modal')
  const form   = document.getElementById('new-form')
  const zone   = document.getElementById('logo-zone')
  const fi     = document.getElementById('logo-file')
  const lbl    = document.getElementById('upload-label')

  const open  = () => { modal.style.display = 'flex'; setTimeout(() => document.getElementById('brand-name')?.focus(), 40) }
  const close = () => { modal.style.display = 'none'; form.reset(); lbl.textContent = 'Clique ou arraste sua logo' }

  document.getElementById('new-project-btn').addEventListener('click', open)
  document.getElementById('close-modal').addEventListener('click', close)
  document.getElementById('cancel-modal').addEventListener('click', close)
  modal.addEventListener('click', e => { if (e.target === modal) close() })

  zone.addEventListener('click', () => fi.click())
  fi.addEventListener('change', () => { if (fi.files[0]) lbl.textContent = fi.files[0].name })
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover') })
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'))
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragover')
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) {
      const dt = new DataTransfer(); dt.items.add(f); fi.files = dt.files
      lbl.textContent = f.name
    }
  })

  form.addEventListener('submit', async e => {
    e.preventDefault()
    const name = document.getElementById('brand-name').value.trim()
    if (!name) { toast('Informe o nome da marca', 'error'); return }

    const btn = document.getElementById('create-btn')
    btn.disabled = true; btn.textContent = 'Criando...'

    try {
      let logo_url = null
      if (fi.files[0]) {
        const f    = fi.files[0]
        const path = `logos/${user.id}/${Date.now()}.${f.name.split('.').pop()}`
        await supabase.storage.from('assets').upload(path, f, { upsert: true })
        logo_url = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({ user_id: user.id, name, logo_url, is_published: false, slug: null })

      if (error) throw error
      const project = Array.isArray(data) ? data[0] : data
      toast('Portal criado!', 'success')
      close()
      navigate(`/editor/${project.id}`)
    } catch (err) {
      toast(err.message || 'Erro ao criar', 'error')
      btn.disabled = false; btn.textContent = 'Criar Portal'
    }
  })
}

async function loadProjects(userId) {
  const area = document.getElementById('projects-area')
  const { data, error } = await supabase
    .from('projects').select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) { toast('Erro ao carregar projetos', 'error'); return }

  if (!data?.length) {
    area.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h3 class="empty-title">Nenhum portal ainda</h3>
        <p class="empty-desc">Crie seu primeiro portal e entregue identidades visuais de outro nível.</p>
        <button class="dash-new-btn" id="empty-new">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Criar primeiro portal
        </button>
      </div>`
    document.getElementById('empty-new')?.addEventListener('click', () =>
      document.getElementById('new-project-btn').click()
    )
    return
  }

  area.innerHTML = `<div class="cards-grid">${data.map(p => projectCard(p)).join('')}</div>`

  // ✅ Event delegation — não depende de IDs dinâmicos
  area.addEventListener('click', e => {
    const edit = e.target.closest('[data-action="edit"]')
    const open = e.target.closest('[data-action="open"]')
    if (edit) navigate(`/editor/${edit.dataset.id}`)
    if (open) window.open(`/p/${open.dataset.slug}`, '_blank')
  })
}

function projectCard(p) {
  const date    = new Date(p.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })
  const initial = p.name.charAt(0).toUpperCase()
  const live    = p.is_published

  return `
    <article class="p-card">
      <div class="p-card__top">
        <div class="p-logo">
          ${p.logo_url
            ? `<img src="${p.logo_url}" alt="${p.name}" loading="lazy">`
            : `<span class="p-logo__letter">${initial}</span>`}
        </div>
        <span class="p-status ${live ? 'p-status--live' : 'p-status--draft'}">
          <i class="p-dot"></i>${live ? 'Publicado' : 'Rascunho'}
        </span>
      </div>

      <div class="p-card__body">
        <h3 class="p-name">${p.name}</h3>
        <time class="p-date">${date}</time>
      </div>

      <div class="p-card__foot">
        ${live
          ? `<button class="p-btn-ghost" data-action="open" data-slug="${p.slug}">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Ver portal
            </button>`
          : `<span></span>`}
        <button class="p-btn-solid" data-action="edit" data-id="${p.id}">
          Editar
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </article>`
}

// ── CSS ──────────────────────────────────────────────────────
const style = document.createElement('style')
style.textContent = `

/* Layout */
.dash { padding: 56px 0 100px; min-height: calc(100dvh - 60px); }

.dash-top {
  display: flex; align-items: flex-end;
  justify-content: space-between;
  gap: 24px; flex-wrap: wrap;
  margin-bottom: 40px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--border);
}

.dash-eyebrow {
  font-family: var(--font-display);
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--accent); margin-bottom: 10px;
}

.dash-heading {
  font-family: var(--font-brand);
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  font-weight: 400; line-height: 1;
  letter-spacing: -0.02em; color: var(--text-1);
}

/* New btn */
.dash-new-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 22px;
  background: var(--accent); color: #fff;
  border: none; border-radius: 10px; cursor: pointer;
  font-family: var(--font-display); font-size: 13px; font-weight: 600;
  letter-spacing: 0.01em; white-space: nowrap; min-height: 44px;
  transition: background 150ms, box-shadow 150ms, transform 150ms;
}
.dash-new-btn:hover { background: var(--accent-2); box-shadow: 0 0 24px rgba(200,132,58,0.35); transform: translateY(-1px); }
.dash-new-btn:active { transform: scale(0.97); }
.dash-new-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* Grid */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

/* Card */
.p-card {
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
  transition: border-color 200ms, box-shadow 200ms, transform 200ms;
}
.p-card:hover {
  border-color: rgba(255,255,255,0.14);
  box-shadow: 0 8px 32px rgba(0,0,0,0.45);
  transform: translateY(-2px);
}

.p-card__top { display: flex; align-items: center; justify-content: space-between; }

.p-logo {
  width: 48px; height: 48px; border-radius: 12px;
  background: var(--bg-3); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; flex-shrink: 0;
}
.p-logo img { width: 100%; height: 100%; object-fit: contain; }
.p-logo__letter { font-family: var(--font-brand); font-size: 22px; color: var(--accent); line-height: 1; }

.p-status {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 999px;
  font-family: var(--font-display); font-size: 11px; font-weight: 600;
}
.p-status--draft { background: rgba(255,255,255,0.04); color: var(--text-3); border: 1px solid var(--border); }
.p-status--live  { background: rgba(61,153,112,0.12); color: #5dba8e; border: 1px solid rgba(61,153,112,0.2); }
.p-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; display: block; }
.p-status--live .p-dot { animation: dotPulse 2s infinite; }
@keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }

.p-card__body { flex: 1; }
.p-name { font-family: var(--font-display); font-size: 15px; font-weight: 600; color: var(--text-1); margin-bottom: 4px; letter-spacing: -0.01em; }
.p-date { font-size: 11px; color: var(--text-3); }

.p-card__foot {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding-top: 16px; border-top: 1px solid var(--border);
}

.p-btn-solid {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  background: var(--text-1); color: var(--bg);
  border: none; border-radius: 8px; cursor: pointer;
  font-family: var(--font-display); font-size: 12px; font-weight: 600;
  transition: background 120ms, transform 120ms;
  min-height: 36px;
}
.p-btn-solid:hover { background: #fff; }
.p-btn-solid:active { transform: scale(0.96); }

.p-btn-ghost {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 8px 14px;
  background: transparent; color: var(--text-2);
  border: 1px solid var(--border); border-radius: 8px; cursor: pointer;
  font-family: var(--font-display); font-size: 12px; font-weight: 500;
  transition: background 120ms, border-color 120ms, color 120ms;
  min-height: 36px;
}
.p-btn-ghost:hover { background: var(--bg-2); border-color: var(--border-md); color: var(--text-1); }

/* Skeleton */
.skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: 14px; }
.skel-card { background: var(--bg-1); border: 1px solid var(--border); border-radius: 16px; padding: 20px; min-height: 180px; }
.skel-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.skel-avatar { width:48px; height:48px; border-radius:12px; background:var(--bg-3); animation:skelP 1.5s ease-in-out infinite; }
.skel-badge  { width:72px; height:22px; border-radius:999px; background:var(--bg-3); animation:skelP 1.5s ease-in-out infinite; }
.skel-line   { display:block; background:var(--bg-3); border-radius:6px; animation:skelP 1.5s ease-in-out infinite; }
@keyframes skelP { 0%,100%{opacity:1} 50%{opacity:0.35} }

/* Empty */
.empty-state { display:flex; flex-direction:column; align-items:center; text-align:center; padding:80px 24px; gap:14px; }
.empty-icon { width:70px; height:70px; background:var(--bg-2); border:1px solid var(--border); border-radius:20px; display:flex; align-items:center; justify-content:center; color:var(--text-3); margin-bottom:8px; }
.empty-title { font-family:var(--font-display); font-size:17px; font-weight:600; color:var(--text-1); }
.empty-desc  { font-size:13px; color:var(--text-2); line-height:1.7; max-width:360px; margin-bottom:8px; }

/* Modal */
.modal-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
.modal-title { font-family:var(--font-brand); font-size:22px; color:var(--text-1); font-weight:400; }
.modal-sub { font-size:13px; color:var(--text-2); margin-bottom:22px; line-height:1.6; }

@media (max-width:640px) {
  .dash-top { flex-direction:column; align-items:flex-start; }
  .cards-grid { grid-template-columns:1fr; }
}
`
document.head.appendChild(style)

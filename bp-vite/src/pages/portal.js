// ─────────────────────────────────────────────────────
//  pages/portal.js  —  Public brand portal (/p/:slug)
// ─────────────────────────────────────────────────────
import { mount, toast, copyToClipboard } from '../lib/utils.js'
import { supabase } from '../lib/supabase.js'

export async function renderPortal({ slug }) {
  mount(`
    <div class="portal-loading">
      <div class="portal-spinner"></div>
    </div>
  `)

  // Fetch project by slug
  const { data: project, error } = await supabase
    .from('projects').select('*').eq('slug', slug).eq('is_published', true).single()

  if (error || !project) {
    mount(`
      <div class="portal-404">
        <h1>Portal não encontrado</h1>
        <p>Este link pode ter expirado ou o portal não está publicado.</p>
        <a data-link="/" class="btn btn-primary">Ir para o início</a>
      </div>
    `)
    return
  }

  // Fetch content
  const { data: contentRows } = await supabase
    .from('project_content').select('*').eq('project_id', project.id)

  const content = {}
  contentRows?.forEach(r => { content[r.section] = r.content })

  // Fetch assets
  const { data: assets } = await supabase
    .from('assets').select('*').eq('project_id', project.id).order('created_at', { ascending: false })

  const capa = content['capa'] || {}
  const logo = content['logotipo'] || {}
  const cores = content['cores'] || {}
  const tipo = content['tipografia'] || {}
  const textos = content['textos'] || {}
  const brandName = capa.brand_name || project.name

  mount(`
    <div class="public-portal">

      <!-- Header -->
      <header class="public-header">
        <div class="public-header__inner">
          ${logo.logo_main
            ? `<img src="${logo.logo_main}" alt="Logo ${brandName}" class="public-logo-img">`
            : `<div class="public-logo-placeholder">${brandName.charAt(0).toUpperCase()}</div>`}
          <div class="public-header__text">
            <h1 class="public-brand-name">${brandName}</h1>
            ${capa.description ? `<p class="public-brand-desc">${capa.description}</p>` : ''}
          </div>
        </div>
        <div class="public-header__badge">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
          Brand Portal
        </div>
      </header>

      <!-- Nav anchors -->
      <nav class="public-nav">
        <div class="container">
          <div class="public-nav__inner">
            ${logo.logo_main || logo.logo_variants?.length ? `<a href="#logotipo" class="public-nav__link">Logotipo</a>` : ''}
            ${(cores.colors || []).length > 0 ? `<a href="#cores" class="public-nav__link">Cores</a>` : ''}
            ${(tipo.fonts || []).filter(f => f.name).length > 0 ? `<a href="#tipografia" class="public-nav__link">Tipografia</a>` : ''}
            ${textos.content ? `<a href="#textos" class="public-nav__link">Textos</a>` : ''}
            ${assets?.length > 0 ? `<a href="#arquivos" class="public-nav__link">Arquivos</a>` : ''}
          </div>
        </div>
      </nav>

      <main class="public-main container--narrow">

        <!-- Logotipo -->
        ${logo.logo_main || (logo.logo_variants || []).length > 0 ? `
          <section class="public-section" id="logotipo">
            <h2 class="public-section__title">Logotipo</h2>
            ${logo.logo_main ? `
              <div class="logo-display">
                <div class="logo-display__light">
                  <img src="${logo.logo_main}" alt="Logo principal" class="logo-display__img">
                </div>
                <div class="logo-display__dark">
                  <img src="${logo.logo_main}" alt="Logo principal dark" class="logo-display__img">
                </div>
              </div>
            ` : ''}
            ${(logo.logo_variants || []).length > 0 ? `
              <div class="logo-variants-section">
                <div class="public-label">Variações</div>
                <div class="logo-variants-grid">
                  ${logo.logo_variants.map(v => `
                    <div class="logo-variant-card">
                      <img src="${v}" alt="Variação" class="logo-variant-img">
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </section>
        ` : ''}

        <!-- Cores -->
        ${(cores.colors || []).length > 0 ? `
          <section class="public-section" id="cores">
            <h2 class="public-section__title">Paleta de Cores</h2>
            <div class="colors-grid">
              ${cores.colors.map(c => `
                <div class="color-card">
                  <div class="color-card__swatch" style="background:${c.hex}"></div>
                  <div class="color-card__info">
                    <div class="color-card__name">${c.name || 'Cor'}</div>
                    <div class="color-card__hex-row">
                      <span class="color-card__hex">${c.hex}</span>
                      <button class="copy-hex-btn" data-hex="${c.hex}" aria-label="Copiar ${c.hex}">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- Tipografia -->
        ${(tipo.fonts || []).filter(f => f.name).length > 0 ? `
          <section class="public-section" id="tipografia">
            <h2 class="public-section__title">Tipografia</h2>
            <div class="fonts-list">
              ${tipo.fonts.filter(f => f.name).map(f => `
                <div class="font-card">
                  <div class="font-card__sample" style="font-family:'${f.name}',sans-serif">
                    ${f.name}
                  </div>
                  <div class="font-card__info">
                    <div class="font-card__name">${f.name}</div>
                    ${f.description ? `<div class="font-card__desc">${f.description}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- Textos -->
        ${textos.content ? `
          <section class="public-section" id="textos">
            <h2 class="public-section__title">Textos da Marca</h2>
            <div class="texts-content">${textos.content.replace(/\n/g, '<br>')}</div>
          </section>
        ` : ''}

        <!-- Arquivos -->
        ${assets?.length > 0 ? `
          <section class="public-section" id="arquivos">
            <h2 class="public-section__title">Arquivos para Download</h2>
            <div class="files-list">
              ${assets.map(a => `
                <a href="${a.file_url}" target="_blank" download class="file-card">
                  <div class="file-card__icon">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  </div>
                  <span class="file-card__name">${a.file_name}</span>
                  <div class="file-card__download">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download
                  </div>
                </a>
              `).join('')}
            </div>
          </section>
        ` : ''}

      </main>

      <!-- Footer -->
      <footer class="public-footer">
        <div class="container public-footer__inner">
          <span>Criado com <span class="landing-logo" style="font-size:inherit">Brand<span>Portal</span></span></span>
        </div>
      </footer>
    </div>
  `)

  // Copy HEX buttons
  document.querySelectorAll('.copy-hex-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const hex = btn.dataset.hex
      await copyToClipboard(hex)
      toast(`${hex} copiado!`, 'success')
    })
  })
}

// ── CSS ──────────────────────────────────────────────
const style = document.createElement('style')
style.textContent = `
/* Loading */
.portal-loading {
  min-height: 100dvh; display: flex; align-items: center; justify-content: center;
}
.portal-spinner {
  width: 32px; height: 32px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 404 */
.portal-404 {
  min-height: 100dvh; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: var(--sp-4); text-align: center; padding: var(--sp-8);
}
.portal-404 h1 { font-family: var(--font-brand); font-size: var(--text-3xl); }
.portal-404 p  { color: var(--text-secondary); margin-bottom: var(--sp-4); }

/* Portal */
.public-portal { min-height: 100dvh; }

/* Header */
.public-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: var(--sp-4); flex-wrap: wrap;
  padding: var(--sp-8) var(--sp-8);
  max-width: 760px; margin: 0 auto;
  border-bottom: 1px solid var(--border);
}
.public-header__inner { display: flex; align-items: center; gap: var(--sp-5); }
.public-logo-img { height: 56px; width: auto; object-fit: contain; }
.public-logo-placeholder {
  width: 56px; height: 56px; border-radius: var(--radius-lg);
  background: var(--text-primary); color: var(--bg);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-brand); font-size: var(--text-2xl); flex-shrink: 0;
}
.public-brand-name { font-family: var(--font-brand); font-size: var(--text-3xl); line-height: 1.2; }
.public-brand-desc { font-size: var(--text-md); color: var(--text-secondary); margin-top: 4px; }
.public-header__badge {
  display: flex; align-items: center; gap: 6px;
  font-size: var(--text-xs); color: var(--text-muted);
  border: 1px solid var(--border); padding: 4px 10px;
  border-radius: var(--radius-full);
}

/* Nav */
.public-nav {
  position: sticky; top: 0; z-index: var(--z-raised);
  background: rgba(247,246,243,0.94); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.public-nav__inner {
  display: flex; gap: 2px;
  overflow-x: auto; padding: var(--sp-2) 0;
  max-width: 760px; margin: 0 auto; padding-inline: var(--sp-4);
}
.public-nav__link {
  padding: 6px 14px; border-radius: var(--radius-full);
  font-size: var(--text-sm); font-weight: 500; color: var(--text-secondary);
  white-space: nowrap; transition: background var(--t-fast), color var(--t-fast);
}
.public-nav__link:hover { background: var(--bg-elevated); color: var(--text-primary); }

/* Main */
.public-main { padding: var(--sp-12) var(--sp-6); }
.public-section { margin-bottom: var(--sp-16); animation: fadeInUp var(--t-mid) var(--ease-out) both; }
.public-section__title {
  font-family: var(--font-brand); font-size: var(--text-2xl);
  margin-bottom: var(--sp-6); padding-bottom: var(--sp-4);
  border-bottom: 1px solid var(--border);
}
.public-label { font-size: var(--text-xs); color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: var(--sp-4); font-weight: 600; }

/* Logo display */
.logo-display { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-4); margin-bottom: var(--sp-6); }
.logo-display__light, .logo-display__dark {
  border-radius: var(--radius-lg); padding: var(--sp-8);
  display: flex; align-items: center; justify-content: center;
  min-height: 160px; border: 1px solid var(--border);
}
.logo-display__light { background: var(--bg-card); }
.logo-display__dark  { background: #0D0D0D; }
.logo-display__img { max-width: 100%; max-height: 80px; object-fit: contain; }

/* Logo variants */
.logo-variants-grid { display: flex; flex-wrap: wrap; gap: var(--sp-4); }
.logo-variant-card {
  border: 1px solid var(--border); border-radius: var(--radius-md);
  padding: var(--sp-5); background: var(--bg-card);
  display: flex; align-items: center; justify-content: center;
  min-width: 140px; min-height: 100px;
}
.logo-variant-img { max-width: 120px; max-height: 80px; object-fit: contain; }

/* Colors */
.colors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--sp-4); }
.color-card {
  border: 1px solid var(--border); border-radius: var(--radius-lg);
  overflow: hidden; background: var(--bg-card);
  transition: box-shadow var(--t-fast);
}
.color-card:hover { box-shadow: var(--shadow-md); }
.color-card__swatch { height: 88px; }
.color-card__info { padding: var(--sp-3); }
.color-card__name { font-size: var(--text-sm); font-weight: 500; margin-bottom: 4px; }
.color-card__hex-row { display: flex; align-items: center; justify-content: space-between; }
.color-card__hex { font-family: monospace; font-size: var(--text-xs); color: var(--text-secondary); }
.copy-hex-btn {
  width: 28px; height: 28px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-muted); cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast);
}
.copy-hex-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }

/* Fonts */
.fonts-list { display: flex; flex-direction: column; gap: var(--sp-4); }
.font-card {
  border: 1px solid var(--border); border-radius: var(--radius-lg);
  padding: var(--sp-6); background: var(--bg-card);
}
.font-card__sample {
  font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 400;
  letter-spacing: -0.02em; color: var(--text-primary);
  margin-bottom: var(--sp-4);
  line-height: 1;
}
.font-card__name { font-weight: 600; font-size: var(--text-sm); margin-bottom: 2px; }
.font-card__desc { font-size: var(--text-sm); color: var(--text-secondary); }

/* Texts */
.texts-content { font-size: var(--text-md); color: var(--text-secondary); line-height: 1.8; max-width: 65ch; }

/* Files */
.files-list { display: flex; flex-direction: column; gap: var(--sp-2); }
.file-card {
  display: flex; align-items: center; gap: var(--sp-4);
  padding: var(--sp-4) var(--sp-5);
  border: 1px solid var(--border); border-radius: var(--radius-md);
  background: var(--bg-card);
  transition: background var(--t-fast), border-color var(--t-fast), box-shadow var(--t-fast);
  color: var(--text-primary);
}
.file-card:hover { background: var(--bg-elevated); border-color: var(--border-dark); box-shadow: var(--shadow-xs); }
.file-card__icon { color: var(--accent); flex-shrink: 0; }
.file-card__name { flex: 1; font-size: var(--text-sm); font-weight: 500; }
.file-card__download {
  display: flex; align-items: center; gap: var(--sp-1);
  font-size: var(--text-xs); color: var(--text-muted);
  flex-shrink: 0;
}

/* Footer */
.public-footer {
  border-top: 1px solid var(--border); padding: var(--sp-8) 0;
  margin-top: var(--sp-8);
}
.public-footer__inner {
  display: flex; justify-content: center;
  font-size: var(--text-sm); color: var(--text-muted);
}

@media (max-width: 600px) {
  .public-header { padding: var(--sp-6); }
  .logo-display { grid-template-columns: 1fr; }
  .colors-grid { grid-template-columns: repeat(2, 1fr); }
}
`
document.head.appendChild(style)

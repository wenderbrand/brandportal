// ─────────────────────────────────────────────────────
//  pages/landing.js
// ─────────────────────────────────────────────────────
import { mount } from '../lib/utils.js'
import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'

export function renderLanding() {
  // If user already logged in → go to dashboard
  if (supabase.auth.getUser()) { navigate('/dashboard'); return }

  mount(`
    <div class="landing">

      <!-- NAV -->
      <nav class="landing-nav">
        <div class="container landing-nav__inner">
          <span class="landing-logo">Brand<span>Portal</span></span>
          <div class="landing-nav__actions">
            <a data-link="/login" class="btn btn-ghost btn-sm">Entrar</a>
            <a data-link="/register" class="btn btn-primary btn-sm">Começar grátis</a>
          </div>
        </div>
      </nav>

      <!-- HERO -->
      <section class="hero">
        <div class="container hero__inner">
          <div class="hero__badge">
            <span class="badge-dot"></span>
            Para designers de identidade visual
          </div>
          <h1 class="hero__title">
            Transforme seu brand book<br>
            <em>em uma plataforma profissional</em>
          </h1>
          <p class="hero__sub">
            Crie, organize e compartilhe sua marca em um link.<br>
            Sem PDF. Sem e-mail. Sem confusão.
          </p>
          <div class="hero__cta">
            <a data-link="/register" class="btn btn-accent btn-lg">
              Começar grátis
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
            <span class="hero__note">Sem cartão de crédito</span>
          </div>
        </div>
      </section>

      <!-- MOCK PREVIEW -->
      <section class="preview-section">
        <div class="container">
          <div class="preview-frame">
            <div class="preview-topbar">
              <div class="preview-dots">
                <span></span><span></span><span></span>
              </div>
              <div class="preview-url">brandportal.app/p/acme-brand</div>
            </div>
            <div class="preview-body">
              <!-- Sidebar mock -->
              <div class="mock-sidebar">
                <div class="mock-logo-area">
                  <div class="mock-logo-box"></div>
                  <div class="mock-lines">
                    <div class="mock-line" style="width:80%"></div>
                    <div class="mock-line" style="width:50%;height:8px;margin-top:4px"></div>
                  </div>
                </div>
                <div class="mock-nav">
                  ${['Capa','Logotipo','Cores','Tipografia','Textos','Arquivos'].map((s,i) =>
                    `<div class="mock-nav-item${i===2?' active':''}">${s}</div>`
                  ).join('')}
                </div>
              </div>
              <!-- Content mock -->
              <div class="mock-content">
                <div class="mock-section-title">Paleta de Cores</div>
                <div class="mock-colors">
                  ${['#0D0D0D','#C97A1E','#F7F6F3','#6B6A64','#E2E1DC'].map(c =>
                    `<div class="mock-color-card">
                      <div class="mock-swatch" style="background:${c}"></div>
                      <div class="mock-hex">${c}</div>
                    </div>`
                  ).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURES -->
      <section class="features">
        <div class="container">
          <div class="features__grid">
            ${[
              { icon: `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`, title: 'Portal de marca completo', desc: 'Logo, cores, tipografia, textos e arquivos organizados num único link.' },
              { icon: `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`, title: 'Compartilhe com um link', desc: 'Seu cliente acessa direto no navegador, sem login e sem instalação.' },
              { icon: `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`, title: 'Editor visual em tempo real', desc: 'Edite seções e veja o preview do portal atualizar instantaneamente.' }
            ].map(f => `
              <div class="feature-card">
                <div class="feature-icon">${f.icon}</div>
                <h3>${f.title}</h3>
                <p>${f.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="landing-footer">
        <div class="container landing-footer__inner">
          <span class="landing-logo">Brand<span>Portal</span></span>
          <p>Feito para designers que prezam pela entrega.</p>
        </div>
      </footer>

    </div>
  `)
}

// ── CSS ──────────────────────────────────────────────
const style = document.createElement('style')
style.textContent = `
/* Landing Nav */
.landing-nav {
  position: sticky; top: 0; z-index: var(--z-raised);
  background: rgba(247,246,243,0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.landing-nav__inner {
  display: flex; align-items: center;
  justify-content: space-between;
  height: 60px;
}
.landing-logo { font-size: var(--text-lg); font-weight: 600; letter-spacing: -0.02em; }
.landing-logo span { color: var(--accent); }
.landing-nav__actions { display: flex; gap: var(--sp-2); }

/* Hero */
.hero { padding: 96px 0 72px; text-align: center; }
.hero__badge {
  display: inline-flex; align-items: center; gap: var(--sp-2);
  background: var(--accent-light); color: var(--accent);
  font-size: var(--text-xs); font-weight: 500;
  padding: 6px 14px; border-radius: var(--radius-full);
  margin-bottom: var(--sp-6); letter-spacing: 0.02em;
}
.badge-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
.hero__title {
  font-family: var(--font-brand);
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin-bottom: var(--sp-5);
  max-width: 720px; margin-inline: auto;
}
.hero__title em { font-style: italic; color: var(--accent); }
.hero__sub {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  line-height: 1.7;
  max-width: 480px; margin-inline: auto;
  margin-bottom: var(--sp-8);
}
.hero__cta { display: flex; align-items: center; justify-content: center; gap: var(--sp-4); flex-wrap: wrap; }
.hero__note { font-size: var(--text-sm); color: var(--text-muted); }

/* Preview */
.preview-section { padding: 0 0 var(--sp-16); }
.preview-frame {
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  background: var(--bg-card);
}
.preview-topbar {
  display: flex; align-items: center; gap: var(--sp-4);
  background: var(--bg-elevated);
  padding: 10px var(--sp-4);
  border-bottom: 1px solid var(--border);
}
.preview-dots { display: flex; gap: 6px; }
.preview-dots span { width: 10px; height: 10px; border-radius: 50%; background: var(--border-dark); }
.preview-url {
  font-size: var(--text-xs); color: var(--text-muted);
  font-family: monospace;
}
.preview-body { display: flex; min-height: 320px; }
.mock-sidebar {
  width: 200px; border-right: 1px solid var(--border);
  padding: var(--sp-5); flex-shrink: 0;
}
.mock-logo-area { display: flex; align-items: center; gap: var(--sp-3); margin-bottom: var(--sp-5); }
.mock-logo-box { width: 36px; height: 36px; background: var(--text-primary); border-radius: var(--radius-sm); flex-shrink: 0; }
.mock-line { height: 10px; background: var(--border); border-radius: 4px; }
.mock-nav { display: flex; flex-direction: column; gap: 2px; }
.mock-nav-item {
  padding: 7px 10px; border-radius: var(--radius-sm);
  font-size: var(--text-sm); color: var(--text-secondary);
}
.mock-nav-item.active { background: var(--accent-light); color: var(--accent); font-weight: 500; }
.mock-content { flex: 1; padding: var(--sp-6); }
.mock-section-title {
  font-family: var(--font-brand); font-size: var(--text-xl);
  margin-bottom: var(--sp-5); color: var(--text-primary);
}
.mock-colors { display: flex; gap: var(--sp-3); flex-wrap: wrap; }
.mock-color-card {
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-2);
  border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--sp-3);
  min-width: 72px;
}
.mock-swatch { width: 48px; height: 48px; border-radius: var(--radius-sm); }
.mock-hex { font-family: monospace; font-size: 10px; color: var(--text-secondary); }

/* Features */
.features { padding: var(--sp-16) 0; border-top: 1px solid var(--border); }
.features__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--sp-6); }
.feature-card {
  padding: var(--sp-6);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.feature-icon {
  width: 44px; height: 44px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: var(--sp-4);
  color: var(--accent);
}
.feature-card h3 { font-size: var(--text-md); font-weight: 600; margin-bottom: var(--sp-2); }
.feature-card p  { font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.6; }

/* Footer */
.landing-footer { border-top: 1px solid var(--border); padding: var(--sp-8) 0; }
.landing-footer__inner { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-4); flex-wrap: wrap; }
.landing-footer p { font-size: var(--text-sm); color: var(--text-muted); }

@media (max-width: 768px) {
  .mock-sidebar { display: none; }
  .preview-body { min-height: 240px; }
}
`
document.head.appendChild(style)

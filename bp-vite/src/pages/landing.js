import { mount } from '../lib/utils.js'
import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'

export function renderLanding() {
  if (supabase.auth.getUser()) { navigate('/dashboard'); return }

  mount(`
    <div class="landing">

      <!-- NAV -->
      <nav class="l-nav">
        <div class="container l-nav__inner">
          <span class="logotype">Brand<em>Portal</em></span>
          <div class="l-nav__actions">
            <a data-link="/login" class="btn btn-ghost btn-sm">Entrar</a>
            <a data-link="/register" class="btn btn-accent btn-sm">Começar grátis</a>
          </div>
        </div>
      </nav>

      <!-- HERO -->
      <section class="hero">
        <div class="hero__glow"></div>
        <div class="container hero__inner">
          <div class="hero__eyebrow">
            <span class="eyebrow-dot"></span>
            Para designers de identidade visual
          </div>
          <h1 class="hero__title">
            Seu brand book<br>
            <span class="hero__title-accent">merece um portal.</span>
          </h1>
          <p class="hero__desc">
            Crie um espaço digital elegante para sua marca.<br>
            Compartilhe com clientes via link. Sem PDF. Sem e-mail.
          </p>
          <div class="hero__cta">
            <a data-link="/register" class="btn btn-accent btn-xl">
              Criar meu portal
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
            <a data-link="/login" class="btn btn-ghost btn-lg">Já tenho conta</a>
          </div>
          <div class="hero__proof">
            <span>✦ Sem cartão de crédito</span>
            <span>✦ Pronto em minutos</span>
            <span>✦ Link profissional</span>
          </div>
        </div>
      </section>

      <!-- MOCK BROWSER -->
      <section class="mock-section">
        <div class="container">
          <div class="browser-frame">
            <div class="browser-bar">
              <div class="browser-dots"><span></span><span></span><span></span></div>
              <div class="browser-url">
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                brandportal.app/p/studio-nova
              </div>
              <div style="width:60px"></div>
            </div>
            <div class="browser-content">
              <!-- Portal mock sidebar -->
              <div class="mock-portal-sidebar">
                <div class="mock-brand-logo"></div>
                <div class="mock-brand-name">Studio Nova</div>
                <div class="mock-nav-items">
                  ${['Capa','Logotipo','Cores','Tipografia','Textos','Arquivos'].map((s,i)=>
                    `<div class="mock-nav-item${i===2?' --active':''}">${s}</div>`
                  ).join('')}
                </div>
              </div>
              <!-- Portal mock content -->
              <div class="mock-portal-content">
                <div class="mock-content-title">Paleta de Cores</div>
                <div class="mock-color-grid">
                  ${[
                    {c:'#0A0A0A',n:'Obsidian'},
                    {c:'#C8843A',n:'Cobre'},
                    {c:'#F2F0EB',n:'Creme'},
                    {c:'#3D9970',n:'Sage'},
                    {c:'#616059',n:'Stone'},
                  ].map(({c,n})=>`
                    <div class="mock-color-card">
                      <div class="mock-swatch" style="background:${c}"></div>
                      <div class="mock-color-info">
                        <div class="mock-color-name">${n}</div>
                        <div class="mock-color-hex">${c}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURES -->
      <section class="features">
        <div class="container">
          <div class="features__header">
            <div class="section-eyebrow">Por que usar</div>
            <h2 class="section-title">Tudo que sua entrega<br>precisa ter</h2>
          </div>
          <div class="features__grid">
            ${[
              {
                n:'01',
                title:'Portal completo de marca',
                desc:'Logo, cores, tipografia, textos e arquivos organizados numa experiência visual única para seu cliente.',
                icon:`<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M3 13l4-4 4 4 4-6 4 6"/></svg>`
              },
              {
                n:'02',
                title:'Link profissional',
                desc:'Compartilhe via um link elegante. Seu cliente acessa no navegador, sem login e sem fricção.',
                icon:`<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`
              },
              {
                n:'03',
                title:'PDF de marca gerado',
                desc:'Exporte um PDF visual e profissional do portal para entregar ao cliente como documento oficial.',
                icon:`<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
              },
            ].map(f=>`
              <div class="feature-card">
                <div class="feature-card__num">${f.n}</div>
                <div class="feature-card__icon">${f.icon}</div>
                <h3 class="feature-card__title">${f.title}</h3>
                <p class="feature-card__desc">${f.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- CTA FINAL -->
      <section class="cta-section">
        <div class="container">
          <div class="cta-card">
            <div class="cta-glow"></div>
            <div class="section-eyebrow" style="color:var(--accent)">Comece agora</div>
            <h2 class="cta-title">Eleve o nível<br>da sua entrega</h2>
            <p class="cta-desc">Crie seu primeiro portal em menos de 5 minutos.</p>
            <a data-link="/register" class="btn btn-accent btn-xl">
              Criar conta grátis
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="l-footer">
        <div class="container l-footer__inner">
          <span class="logotype" style="font-size:var(--text-md)">Brand<em>Portal</em></span>
          <p>Feito para designers que prezam pela entrega.</p>
        </div>
      </footer>
    </div>
  `)
}

const style = document.createElement('style')
style.textContent = `
/* ── Logotype ── */
.logotype { font-family: var(--font-display); font-weight: 700; font-size: var(--text-xl); letter-spacing: -0.02em; color: var(--text-1); }
.logotype em { font-style: normal; color: var(--accent); }

/* ── Nav ── */
.l-nav { position: sticky; top: 0; z-index: var(--z-raised); background: rgba(10,10,10,0.85); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); }
.l-nav__inner { display: flex; align-items: center; justify-content: space-between; height: 60px; }
.l-nav__actions { display: flex; gap: var(--sp-2); }

/* ── Hero ── */
.hero { position: relative; padding: 120px 0 80px; overflow: hidden; }
.hero__glow { position: absolute; top: -100px; left: 50%; transform: translateX(-50%); width: 600px; height: 400px; background: radial-gradient(ellipse at center, rgba(200,132,58,0.12) 0%, transparent 70%); pointer-events: none; }
.hero__inner { position: relative; text-align: center; }
.hero__eyebrow { display: inline-flex; align-items: center; gap: var(--sp-2); background: var(--bg-2); border: 1px solid var(--border-md); color: var(--text-2); font-family: var(--font-display); font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; padding: 6px 14px; border-radius: var(--r-full); margin-bottom: var(--sp-8); }
.eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 2s infinite; }
.hero__title { font-family: var(--font-brand); font-size: clamp(2.5rem, 6vw, 5rem); line-height: 1.1; letter-spacing: -0.02em; color: var(--text-1); margin-bottom: var(--sp-6); }
.hero__title-accent { color: var(--accent); font-style: italic; }
.hero__desc { font-size: clamp(var(--text-md), 2vw, var(--text-lg)); color: var(--text-2); line-height: 1.7; max-width: 500px; margin: 0 auto var(--sp-10); }
.hero__cta { display: flex; align-items: center; justify-content: center; gap: var(--sp-4); flex-wrap: wrap; margin-bottom: var(--sp-8); }
.hero__proof { display: flex; align-items: center; justify-content: center; gap: var(--sp-6); flex-wrap: wrap; font-size: var(--text-xs); color: var(--text-3); letter-spacing: 0.04em; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }

/* ── Browser mock ── */
.mock-section { padding: 0 0 var(--sp-20); }
.browser-frame { border: 1px solid var(--border-md); border-radius: var(--r-2xl); overflow: hidden; box-shadow: var(--shadow-lg), 0 0 80px rgba(200,132,58,0.08); background: var(--bg-1); }
.browser-bar { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-4); background: var(--bg-2); padding: 12px var(--sp-5); border-bottom: 1px solid var(--border); }
.browser-dots { display: flex; gap: 6px; }
.browser-dots span { width: 10px; height: 10px; border-radius: 50%; background: var(--bg-4); }
.browser-url { display: flex; align-items: center; gap: 6px; background: var(--bg-3); border: 1px solid var(--border); border-radius: var(--r-full); padding: 5px 14px; font-family: monospace; font-size: var(--text-xs); color: var(--text-3); }
.browser-content { display: flex; min-height: 340px; }

/* Portal sidebar mock */
.mock-portal-sidebar { width: 180px; border-right: 1px solid var(--border); padding: var(--sp-5); flex-shrink: 0; background: var(--bg-2); display: flex; flex-direction: column; gap: var(--sp-4); }
.mock-brand-logo { width: 36px; height: 36px; background: var(--accent); border-radius: var(--r-md); opacity: 0.9; }
.mock-brand-name { font-family: var(--font-display); font-weight: 700; font-size: var(--text-sm); color: var(--text-1); }
.mock-nav-items { display: flex; flex-direction: column; gap: 2px; margin-top: var(--sp-2); }
.mock-nav-item { padding: 7px 10px; border-radius: var(--r-sm); font-size: var(--text-xs); color: var(--text-3); }
.mock-nav-item.--active { background: var(--accent-dim); color: var(--accent-2); font-weight: 600; }

/* Portal content mock */
.mock-portal-content { flex: 1; padding: var(--sp-6); }
.mock-content-title { font-family: var(--font-brand); font-size: var(--text-2xl); color: var(--text-1); margin-bottom: var(--sp-5); }
.mock-color-grid { display: flex; flex-wrap: wrap; gap: var(--sp-3); }
.mock-color-card { display: flex; align-items: center; gap: var(--sp-3); background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r-lg); padding: var(--sp-3) var(--sp-4); }
.mock-swatch { width: 40px; height: 40px; border-radius: var(--r-md); flex-shrink: 0; }
.mock-color-name { font-family: var(--font-display); font-size: var(--text-xs); font-weight: 600; color: var(--text-1); margin-bottom: 2px; }
.mock-color-hex { font-family: monospace; font-size: 10px; color: var(--text-3); }

/* ── Features ── */
.features { padding: var(--sp-20) 0; border-top: 1px solid var(--border); }
.features__header { text-align: center; margin-bottom: var(--sp-16); }
.section-eyebrow { font-family: var(--font-display); font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); margin-bottom: var(--sp-4); }
.section-title { font-family: var(--font-brand); font-size: clamp(var(--text-3xl), 4vw, var(--text-4xl)); line-height: 1.2; color: var(--text-1); }
.features__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--sp-5); }
.feature-card { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--r-xl); padding: var(--sp-8); position: relative; overflow: hidden; transition: border-color var(--t-mid), box-shadow var(--t-mid); }
.feature-card:hover { border-color: var(--border-md); box-shadow: var(--shadow-md); }
.feature-card__num { font-family: var(--font-display); font-size: var(--text-xs); font-weight: 700; color: var(--text-3); letter-spacing: 0.1em; margin-bottom: var(--sp-5); }
.feature-card__icon { width: 48px; height: 48px; background: var(--bg-3); border: 1px solid var(--border); border-radius: var(--r-lg); display: flex; align-items: center; justify-content: center; color: var(--accent); margin-bottom: var(--sp-5); }
.feature-card__title { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 600; color: var(--text-1); margin-bottom: var(--sp-3); }
.feature-card__desc { font-size: var(--text-sm); color: var(--text-2); line-height: 1.7; }

/* ── CTA ── */
.cta-section { padding: var(--sp-20) 0; }
.cta-card { position: relative; background: var(--bg-1); border: 1px solid var(--border-md); border-radius: var(--r-2xl); padding: var(--sp-20) var(--sp-8); text-align: center; overflow: hidden; }
.cta-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 500px; height: 300px; background: radial-gradient(ellipse at center, rgba(200,132,58,0.15) 0%, transparent 70%); pointer-events: none; }
.cta-title { font-family: var(--font-brand); font-size: clamp(var(--text-3xl), 4vw, var(--text-4xl)); line-height: 1.2; color: var(--text-1); margin: var(--sp-4) 0; position: relative; }
.cta-desc { font-size: var(--text-md); color: var(--text-2); margin-bottom: var(--sp-8); position: relative; }
.cta-card .btn { position: relative; }

/* ── Footer ── */
.l-footer { border-top: 1px solid var(--border); padding: var(--sp-8) 0; }
.l-footer__inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--sp-4); }
.l-footer p { font-size: var(--text-sm); color: var(--text-3); }

@media (max-width: 768px) {
  .mock-portal-sidebar { display: none; }
  .browser-content { min-height: 240px; }
  .hero { padding: 80px 0 60px; }
}
`
document.head.appendChild(style)

import { mount, toast, copyToClipboard } from '../lib/utils.js'
import { supabase } from '../lib/supabase.js'

export async function renderPortal({ slug }) {
  mount(`<div class="portal-loading"><div class="portal-spinner"></div></div>`)

  const { data: project, error } = await supabase
    .from('projects').select('*').eq('slug', slug).eq('is_published', true).single()

  if (error || !project) {
    mount(`<div class="portal-404"><h1>Portal não encontrado</h1><p>Este link pode ter expirado ou o portal não está publicado.</p><a data-link="/" class="btn btn-accent">Ir para o início</a></div>`)
    return
  }

  const { data: contentRows } = await supabase.from('project_content').select('*').eq('project_id', project.id)
  const { data: assets } = await supabase.from('assets').select('*').eq('project_id', project.id).order('created_at', { ascending: false })

  const content = {}
  contentRows?.forEach(r => { content[r.section] = r.content })

  const capa = content['capa'] || {}
  const logo = content['logotipo'] || {}
  const cores = content['cores'] || {}
  const tipo = content['tipografia'] || {}
  const textos = content['textos'] || {}
  const brandName = capa.brand_name || project.name

  mount(`
    <div class="pub-portal" id="pub-portal">

      <!-- HERO HEADER -->
      <div class="pub-hero">
        <div class="pub-hero__glow"></div>
        <div class="pub-hero__inner container--narrow">
          <div class="pub-hero__logo">
            ${logo.logo_main
              ? `<img src="${logo.logo_main}" alt="Logo ${brandName}" class="pub-logo-img">`
              : `<div class="pub-logo-placeholder">${brandName.charAt(0).toUpperCase()}</div>`}
          </div>
          <div class="pub-hero__text">
            <h1 class="pub-brand-name">${brandName}</h1>
            ${capa.description ? `<p class="pub-brand-desc">${capa.description}</p>` : ''}
          </div>
          <div class="pub-hero__actions">
            <button class="btn btn-accent btn-sm" id="download-pdf-btn">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Baixar PDF
            </button>
          </div>
        </div>
      </div>

      <!-- NAV ANCHORS -->
      <nav class="pub-nav">
        <div class="pub-nav__inner container--narrow">
          ${(cores.colors||[]).length > 0 ? `<a href="#cores" class="pub-nav__link">Cores</a>` : ''}
          ${logo.logo_main ? `<a href="#logotipo" class="pub-nav__link">Logotipo</a>` : ''}
          ${(tipo.fonts||[]).filter(f=>f.name).length > 0 ? `<a href="#tipografia" class="pub-nav__link">Tipografia</a>` : ''}
          ${textos.content ? `<a href="#textos" class="pub-nav__link">Textos</a>` : ''}
          ${assets?.length > 0 ? `<a href="#arquivos" class="pub-nav__link">Arquivos</a>` : ''}
        </div>
      </nav>

      <!-- CONTENT -->
      <main class="pub-main container--narrow">

        <!-- CORES -->
        ${(cores.colors||[]).length > 0 ? `
          <section class="pub-section" id="cores">
            <div class="pub-section__label">Paleta de Cores</div>
            <h2 class="pub-section__title">Cores da Marca</h2>
            <div class="pub-colors">
              ${cores.colors.map(c => `
                <div class="pub-color-card">
                  <div class="pub-color-swatch" style="background:${c.hex}"></div>
                  <div class="pub-color-info">
                    ${c.name ? `<div class="pub-color-name">${c.name}</div>` : ''}
                    <div class="pub-color-hex-row">
                      <span class="pub-color-hex">${c.hex}</span>
                      <button class="copy-btn" data-hex="${c.hex}" title="Copiar">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- LOGOTIPO -->
        ${logo.logo_main || (logo.logo_variants||[]).length > 0 ? `
          <section class="pub-section" id="logotipo">
            <div class="pub-section__label">Identidade Visual</div>
            <h2 class="pub-section__title">Logotipo</h2>
            ${logo.logo_main ? `
              <div class="pub-logo-display">
                <div class="pub-logo-bg --light">
                  <img src="${logo.logo_main}" alt="Logo em fundo claro">
                </div>
                <div class="pub-logo-bg --dark">
                  <img src="${logo.logo_main}" alt="Logo em fundo escuro">
                </div>
              </div>
            ` : ''}
            ${(logo.logo_variants||[]).length > 0 ? `
              <div class="pub-variants">
                <div class="pub-variants__label">Variações</div>
                <div class="pub-variants__grid">
                  ${logo.logo_variants.map(v=>`<div class="pub-variant-card"><img src="${v}" alt="Variação"></div>`).join('')}
                </div>
              </div>
            ` : ''}
          </section>
        ` : ''}

        <!-- TIPOGRAFIA -->
        ${(tipo.fonts||[]).filter(f=>f.name).length > 0 ? `
          <section class="pub-section" id="tipografia">
            <div class="pub-section__label">Sistema Tipográfico</div>
            <h2 class="pub-section__title">Tipografia</h2>
            <div class="pub-fonts">
              ${tipo.fonts.filter(f=>f.name).map((f,i)=>`
                <div class="pub-font-card">
                  <div class="pub-font-index">${String(i+1).padStart(2,'0')}</div>
                  <div class="pub-font-sample" style="font-family:'${f.name}',sans-serif">${f.name}</div>
                  <div class="pub-font-meta">
                    <div class="pub-font-name">${f.name}</div>
                    ${f.description ? `<div class="pub-font-desc">${f.description}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- TEXTOS -->
        ${textos.content ? `
          <section class="pub-section" id="textos">
            <div class="pub-section__label">Voz da Marca</div>
            <h2 class="pub-section__title">Textos</h2>
            <div class="pub-text-block">${textos.content.replace(/\n/g,'<br>')}</div>
          </section>
        ` : ''}

        <!-- ARQUIVOS -->
        ${assets?.length > 0 ? `
          <section class="pub-section" id="arquivos">
            <div class="pub-section__label">Materiais</div>
            <h2 class="pub-section__title">Arquivos</h2>
            <div class="pub-files">
              ${assets.map(a=>`
                <a href="${a.file_url}" target="_blank" download class="pub-file">
                  <div class="pub-file__icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  </div>
                  <span class="pub-file__name">${a.file_name}</span>
                  <div class="pub-file__dl">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download
                  </div>
                </a>
              `).join('')}
            </div>
          </section>
        ` : ''}

      </main>

      <!-- FOOTER -->
      <footer class="pub-footer">
        <div class="container pub-footer__inner">
          <span class="logotype" style="font-size:var(--text-md)">Brand<em>Portal</em></span>
          <span style="font-size:var(--text-xs);color:var(--text-3)">Criado com Brand Portal</span>
        </div>
      </footer>
    </div>
  `)

  // Copy HEX
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await copyToClipboard(btn.dataset.hex)
      toast(`${btn.dataset.hex} copiado!`, 'success')
    })
  })

  // PDF Download
  document.getElementById('download-pdf-btn').addEventListener('click', () => {
    generateBrandPDF({ project, brandName, logo, cores, tipo, textos, assets })
  })
}

// ════════════════════════════════════════════════════
//  PDF GENERATOR — Brand Book profissional via HTML print
// ════════════════════════════════════════════════════
async function generateBrandPDF({ project, brandName, logo, cores, tipo, textos, assets }) {
  const btn = document.getElementById('download-pdf-btn')
  btn.disabled = true; btn.textContent = 'Gerando PDF...'

  try {
    const win = window.open('', '_blank')
    const colors = cores.colors || []
    const fonts = (tipo.fonts || []).filter(f => f.name)

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Brand Book — ${brandName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  @page { size: A4; margin: 0; }

  body { font-family: 'Inter', sans-serif; background: #fff; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* ── CAPA ── */
  .cover {
    width: 210mm; height: 297mm;
    background: #0A0A0A;
    display: flex; flex-direction: column;
    justify-content: flex-end;
    padding: 18mm;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }
  .cover__accent {
    position: absolute; top: -60mm; right: -40mm;
    width: 160mm; height: 160mm;
    border-radius: 50%;
    background: radial-gradient(ellipse, rgba(200,132,58,0.25) 0%, transparent 70%);
  }
  .cover__accent2 {
    position: absolute; bottom: 40mm; left: -30mm;
    width: 100mm; height: 100mm;
    border-radius: 50%;
    background: radial-gradient(ellipse, rgba(200,132,58,0.10) 0%, transparent 70%);
  }
  .cover__logo-wrap {
    margin-bottom: 10mm;
    position: relative;
  }
  .cover__logo { max-height: 24mm; max-width: 80mm; object-fit: contain; }
  .cover__logo-placeholder {
    width: 20mm; height: 20mm;
    background: #C8843A;
    border-radius: 4mm;
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Serif Display', serif;
    font-size: 40pt;
    color: #fff;
  }
  .cover__label {
    font-size: 7pt; letter-spacing: 0.15em; text-transform: uppercase;
    color: rgba(255,255,255,0.35); margin-bottom: 4mm; position: relative;
  }
  .cover__name {
    font-family: 'DM Serif Display', serif;
    font-size: 40pt; line-height: 1.1; color: #F2F0EB;
    margin-bottom: 3mm; position: relative;
  }
  .cover__subtitle {
    font-size: 11pt; color: rgba(255,255,255,0.45); position: relative;
  }
  .cover__meta {
    position: absolute; top: 18mm; right: 18mm;
    font-size: 7pt; color: rgba(255,255,255,0.2);
    letter-spacing: 0.1em; text-transform: uppercase;
    writing-mode: vertical-lr; text-orientation: mixed;
  }
  .cover__line {
    position: absolute; bottom: 0; left: 18mm; right: 18mm;
    height: 0.5px; background: rgba(255,255,255,0.1);
  }

  /* ── PAGES ── */
  .page {
    width: 210mm; min-height: 297mm;
    padding: 16mm 18mm;
    page-break-before: always;
    position: relative;
  }
  .page--light { background: #F8F7F4; }
  .page--white { background: #FFFFFF; }
  .page--dark  { background: #0A0A0A; color: #F2F0EB; }

  /* Page header */
  .page-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 12mm; padding-bottom: 4mm;
    border-bottom: 0.5px solid rgba(0,0,0,0.12);
  }
  .page-header--dark { border-bottom-color: rgba(255,255,255,0.1); }
  .page-section-label {
    font-size: 7pt; letter-spacing: 0.12em; text-transform: uppercase;
    color: #C8843A; font-weight: 600; margin-bottom: 2mm;
  }
  .page-title {
    font-family: 'DM Serif Display', serif;
    font-size: 28pt; line-height: 1.15; color: #0A0A0A;
  }
  .page-title--light { color: #F2F0EB; }
  .page-num {
    font-size: 8pt; color: rgba(0,0,0,0.2); font-weight: 300;
    margin-top: 4mm;
  }
  .page-num--dark { color: rgba(255,255,255,0.2); }

  /* ── COLORS ── */
  .colors-grid {
    display: grid;
    grid-template-columns: repeat(${Math.min(colors.length, 3)}, 1fr);
    gap: 5mm;
    margin-top: 6mm;
  }
  .color-item { border-radius: 3mm; overflow: hidden; }
  .color-swatch {
    height: 36mm;
    width: 100%;
  }
  .color-meta {
    padding: 3mm 4mm;
    background: #fff;
    border: 0.5px solid rgba(0,0,0,0.08);
    border-top: none;
    border-radius: 0 0 3mm 3mm;
  }
  .color-name { font-size: 8pt; font-weight: 600; color: #111; margin-bottom: 1mm; }
  .color-hex  { font-family: monospace; font-size: 8pt; color: #777; }

  /* ── TYPOGRAPHY ── */
  .font-item {
    padding: 8mm 0;
    border-bottom: 0.5px solid rgba(0,0,0,0.08);
  }
  .font-item:last-child { border-bottom: none; }
  .font-sample {
    font-size: 36pt; line-height: 1;
    color: #0A0A0A; margin-bottom: 3mm;
    font-weight: 400;
  }
  .font-meta-row { display: flex; align-items: baseline; gap: 4mm; }
  .font-family-name { font-size: 9pt; font-weight: 600; color: #111; }
  .font-description { font-size: 8pt; color: #777; }

  /* ── TEXTS ── */
  .text-block {
    font-size: 10pt; line-height: 1.9; color: #333;
    max-width: 160mm;
  }

  /* ── LOGO DISPLAY ── */
  .logo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-top: 6mm; }
  .logo-bg {
    border-radius: 3mm; padding: 10mm;
    display: flex; align-items: center; justify-content: center;
    min-height: 50mm;
  }
  .logo-bg--light { background: #F8F7F4; border: 0.5px solid rgba(0,0,0,0.08); }
  .logo-bg--dark  { background: #0A0A0A; }
  .logo-bg img { max-height: 28mm; max-width: 100%; object-fit: contain; }
  .logo-bg-label { font-size: 7pt; color: rgba(0,0,0,0.3); text-align: center; margin-top: 2mm; }
  .logo-bg-label--dark { color: rgba(255,255,255,0.2); }

  /* ── FOOTER BAR ── */
  .page-footer {
    position: fixed; bottom: 10mm; left: 18mm; right: 18mm;
    display: flex; align-items: center; justify-content: space-between;
    font-size: 7pt; color: rgba(0,0,0,0.18);
    border-top: 0.5px solid rgba(0,0,0,0.08);
    padding-top: 2mm;
  }

  /* ── DIVIDER ── */
  .divider { height: 0.5px; background: rgba(0,0,0,0.08); margin: 6mm 0; }
  .divider--light { background: rgba(255,255,255,0.1); }

  @media print {
    html,body { width: 210mm; }
    .page { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- CAPA -->
<div class="cover">
  <div class="cover__accent"></div>
  <div class="cover__accent2"></div>
  <div class="cover__meta">Brand Book</div>
  <div class="cover__logo-wrap">
    ${logo.logo_main
      ? `<img src="${logo.logo_main}" class="cover__logo" alt="Logo">`
      : `<div class="cover__logo-placeholder">${brandName.charAt(0)}</div>`}
  </div>
  <div class="cover__label">Brand Book</div>
  <div class="cover__name">${brandName}</div>
  <div class="cover__subtitle">${new Date().getFullYear()} — Identidade Visual</div>
  <div class="cover__line"></div>
</div>

${colors.length > 0 ? `
<!-- CORES -->
<div class="page page--white">
  <div class="page-header">
    <div>
      <div class="page-section-label">01 — Identidade</div>
      <div class="page-title">Paleta de Cores</div>
    </div>
    <div class="page-num">02</div>
  </div>
  <div class="colors-grid">
    ${colors.map(c => `
      <div class="color-item">
        <div class="color-swatch" style="background:${c.hex}"></div>
        <div class="color-meta">
          ${c.name ? `<div class="color-name">${c.name}</div>` : ''}
          <div class="color-hex">${c.hex}</div>
        </div>
      </div>
    `).join('')}
  </div>
</div>
` : ''}

${logo.logo_main ? `
<!-- LOGOTIPO -->
<div class="page page--light">
  <div class="page-header">
    <div>
      <div class="page-section-label">02 — Logotipo</div>
      <div class="page-title">Aplicações</div>
    </div>
    <div class="page-num">${colors.length > 0 ? '03' : '02'}</div>
  </div>
  <div class="logo-grid">
    <div>
      <div class="logo-bg logo-bg--light">
        <img src="${logo.logo_main}" alt="Logo fundo claro">
      </div>
      <div class="logo-bg-label">Fundo Claro</div>
    </div>
    <div>
      <div class="logo-bg logo-bg--dark">
        <img src="${logo.logo_main}" alt="Logo fundo escuro">
      </div>
      <div class="logo-bg-label logo-bg-label--dark" style="color:rgba(0,0,0,0.3)">Fundo Escuro</div>
    </div>
  </div>
  ${(logo.logo_variants||[]).length > 0 ? `
  <div class="divider" style="margin-top:10mm"></div>
  <div class="page-section-label" style="margin-bottom:4mm">Variações</div>
  <div style="display:flex;flex-wrap:wrap;gap:4mm">
    ${logo.logo_variants.map(v=>`
      <div class="logo-bg logo-bg--light" style="min-height:30mm;padding:6mm;flex:0 0 auto">
        <img src="${v}" style="max-height:20mm;max-width:50mm;object-fit:contain">
      </div>`).join('')}
  </div>` : ''}
</div>
` : ''}

${fonts.length > 0 ? `
<!-- TIPOGRAFIA -->
<div class="page page--white">
  <div class="page-header">
    <div>
      <div class="page-section-label">03 — Tipografia</div>
      <div class="page-title">Sistema de Fontes</div>
    </div>
    <div class="page-num">${2 + (colors.length>0?1:0) + (logo.logo_main?1:0)}</div>
  </div>
  ${fonts.map(f => `
    <div class="font-item">
      <div class="font-sample" style="font-family:'${f.name}',sans-serif">${f.name}</div>
      <div class="font-meta-row">
        <div class="font-family-name">${f.name}</div>
        ${f.description ? `<div class="font-description">${f.description}</div>` : ''}
      </div>
    </div>
  `).join('')}
</div>
` : ''}

${textos.content ? `
<!-- TEXTOS -->
<div class="page page--dark">
  <div class="page-header page-header--dark">
    <div>
      <div class="page-section-label">04 — Voz</div>
      <div class="page-title page-title--light">Textos da Marca</div>
    </div>
    <div class="page-num page-num--dark">${2 + (colors.length>0?1:0) + (logo.logo_main?1:0) + (fonts.length>0?1:0)}</div>
  </div>
  <div class="text-block" style="color:rgba(242,240,235,0.7)">${textos.content.replace(/\n/g,'<br>')}</div>
</div>
` : ''}

<!-- CONTRACAPA -->
<div class="cover" style="justify-content:center;align-items:center;text-align:center">
  <div class="cover__accent"></div>
  ${logo.logo_main ? `<img src="${logo.logo_main}" style="max-height:18mm;max-width:60mm;object-fit:contain;margin-bottom:8mm;position:relative">` : `<div class="cover__logo-placeholder" style="margin:0 auto 8mm;position:relative">${brandName.charAt(0)}</div>`}
  <div style="font-family:'DM Serif Display',serif;font-size:22pt;color:#F2F0EB;position:relative;margin-bottom:3mm">${brandName}</div>
  <div style="font-size:8pt;color:rgba(255,255,255,0.3);position:relative;letter-spacing:0.1em;text-transform:uppercase">Brand Book ${new Date().getFullYear()}</div>
  <div style="position:absolute;bottom:18mm;left:0;right:0;text-align:center;font-size:7pt;color:rgba(255,255,255,0.15)">Criado com Brand Portal</div>
</div>

<script>
  document.fonts.ready.then(() => {
    setTimeout(() => { window.print(); window.close(); }, 600)
  })
</script>
</body>
</html>`

    win.document.write(html)
    win.document.close()

  } catch (err) {
    toast('Erro ao gerar PDF: ' + err.message, 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Baixar PDF`
  }
}

const style = document.createElement('style')
style.textContent = `
.portal-loading{min-height:100dvh;display:flex;align-items:center;justify-content:center}
.portal-spinner{width:32px;height:32px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
.portal-404{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--sp-5);text-align:center;padding:var(--sp-8)}
.portal-404 h1{font-family:var(--font-brand);font-size:var(--text-3xl)}
.portal-404 p{color:var(--text-2);margin-bottom:var(--sp-4)}

/* Hero */
.pub-hero{padding:var(--sp-16) 0 var(--sp-10);border-bottom:1px solid var(--border);position:relative;overflow:hidden}
.pub-hero__glow{position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:500px;height:400px;background:radial-gradient(ellipse,rgba(200,132,58,0.08) 0%,transparent 70%);pointer-events:none}
.pub-hero__inner{position:relative;display:flex;flex-direction:column;gap:var(--sp-5)}
.pub-hero__logo{}
.pub-logo-img{height:64px;width:auto;object-fit:contain}
.pub-logo-placeholder{width:64px;height:64px;border-radius:var(--r-xl);background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--font-brand);font-size:var(--text-3xl)}
.pub-brand-name{font-family:var(--font-brand);font-size:clamp(var(--text-3xl),5vw,var(--text-5xl));line-height:1.1;color:var(--text-1)}
.pub-brand-desc{font-size:var(--text-lg);color:var(--text-2);margin-top:var(--sp-2);line-height:1.6;max-width:55ch}
.pub-hero__actions{margin-top:var(--sp-2)}

/* Nav */
.pub-nav{position:sticky;top:0;z-index:var(--z-raised);background:rgba(10,10,10,0.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}
.pub-nav__inner{display:flex;gap:2px;padding:var(--sp-2) 0;overflow-x:auto}
.pub-nav__link{padding:6px 14px;border-radius:var(--r-full);font-family:var(--font-display);font-size:var(--text-xs);font-weight:600;letter-spacing:0.04em;color:var(--text-3);white-space:nowrap;transition:background var(--t-fast),color var(--t-fast)}
.pub-nav__link:hover{background:var(--bg-2);color:var(--text-1)}

/* Main */
.pub-main{padding:var(--sp-16) var(--sp-6) var(--sp-20)}
.pub-section{margin-bottom:var(--sp-20);animation:fadeInUp var(--t-mid) var(--ease-out) both}
.pub-section__label{font-family:var(--font-display);font-size:var(--text-xs);font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);margin-bottom:var(--sp-3)}
.pub-section__title{font-family:var(--font-brand);font-size:var(--text-4xl);color:var(--text-1);margin-bottom:var(--sp-8);line-height:1.15}

/* Colors */
.pub-colors{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:var(--sp-4)}
.pub-color-card{background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;transition:box-shadow var(--t-fast),border-color var(--t-fast)}
.pub-color-card:hover{border-color:var(--border-md);box-shadow:var(--shadow-md)}
.pub-color-swatch{height:100px}
.pub-color-info{padding:var(--sp-4)}
.pub-color-name{font-family:var(--font-display);font-size:var(--text-sm);font-weight:600;color:var(--text-1);margin-bottom:4px}
.pub-color-hex-row{display:flex;align-items:center;justify-content:space-between}
.pub-color-hex{font-family:monospace;font-size:var(--text-xs);color:var(--text-3)}
.copy-btn{width:28px;height:28px;border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;color:var(--text-3);cursor:pointer;transition:background var(--t-fast),color var(--t-fast)}
.copy-btn:hover{background:var(--bg-3);color:var(--accent)}

/* Logo */
.pub-logo-display{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)}
.pub-logo-bg{border-radius:var(--r-xl);padding:var(--sp-8);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--sp-3);min-height:180px}
.pub-logo-bg.--light{background:var(--bg-3);border:1px solid var(--border)}
.pub-logo-bg.--dark{background:#fff}
.pub-logo-bg img{max-height:80px;max-width:100%;object-fit:contain}
.pub-logo-bg span{font-size:var(--text-xs);color:var(--text-3)}
.pub-variants{margin-top:var(--sp-8)}
.pub-variants__label{font-size:var(--text-xs);font-family:var(--font-display);font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-3);margin-bottom:var(--sp-4)}
.pub-variants__grid{display:flex;flex-wrap:wrap;gap:var(--sp-3)}
.pub-variant-card{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r-lg);padding:var(--sp-5);display:flex;align-items:center;justify-content:center}
.pub-variant-card img{max-height:56px;max-width:100px;object-fit:contain}

/* Fonts */
.pub-fonts{display:flex;flex-direction:column}
.pub-font-card{display:flex;align-items:center;gap:var(--sp-6);padding:var(--sp-6) 0;border-bottom:1px solid var(--border)}
.pub-font-card:last-child{border-bottom:none}
.pub-font-index{font-family:var(--font-display);font-size:var(--text-xs);font-weight:700;color:var(--text-3);width:30px;flex-shrink:0}
.pub-font-sample{font-size:clamp(2.5rem,5vw,4rem);line-height:1;color:var(--text-1);flex:1;letter-spacing:-0.02em}
.pub-font-meta{}
.pub-font-name{font-family:var(--font-display);font-size:var(--text-sm);font-weight:600;color:var(--text-1);margin-bottom:2px}
.pub-font-desc{font-size:var(--text-sm);color:var(--text-2)}

/* Texts */
.pub-text-block{font-size:var(--text-lg);line-height:1.9;color:var(--text-2);max-width:60ch}

/* Files */
.pub-files{display:flex;flex-direction:column;gap:var(--sp-2)}
.pub-file{display:flex;align-items:center;gap:var(--sp-4);padding:var(--sp-4) var(--sp-5);background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-1);transition:background var(--t-fast),border-color var(--t-fast)}
.pub-file:hover{background:var(--bg-2);border-color:var(--border-md)}
.pub-file__icon{color:var(--accent);flex-shrink:0}
.pub-file__name{flex:1;font-size:var(--text-sm);font-weight:500}
.pub-file__dl{display:flex;align-items:center;gap:4px;font-size:var(--text-xs);color:var(--text-3);flex-shrink:0}

/* Footer */
.pub-footer{border-top:1px solid var(--border);padding:var(--sp-8) 0}
.pub-footer__inner{display:flex;align-items:center;justify-content:space-between}

@media(max-width:600px){
  .pub-logo-display{grid-template-columns:1fr}
  .pub-colors{grid-template-columns:repeat(2,1fr)}
  .pub-font-card{flex-direction:column;align-items:flex-start;gap:var(--sp-3)}
}
`
document.head.appendChild(style)

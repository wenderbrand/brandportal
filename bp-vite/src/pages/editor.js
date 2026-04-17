// ─────────────────────────────────────────────────────
//  pages/editor.js  —  Core editor (3-column layout)
// ─────────────────────────────────────────────────────
import { mount, toast, copyToClipboard, isValidHex, debounce, generateSlug } from '../lib/utils.js'
import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'
import { renderNavbar } from '../components/navbar.js'

const SECTIONS = ['capa', 'logotipo', 'cores', 'tipografia', 'textos', 'arquivos']
const SECTION_LABELS = {
  capa: 'Capa', logotipo: 'Logotipo', cores: 'Cores',
  tipografia: 'Tipografia', textos: 'Textos', arquivos: 'Arquivos'
}
const SECTION_ICONS = {
  capa: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M3 13l4-4 4 4 4-6 4 6"/></svg>`,
  logotipo: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><path d="M12 13v8"/></svg>`,
  cores: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>`,
  tipografia: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  textos: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/></svg>`,
  arquivos: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>`
}

let state = { project: null, content: {}, activeSection: 'capa', dirty: false }

export async function renderEditor({ id }) {
  const user = supabase.auth.getUser()
  if (!user) { navigate('/login'); return }

  // Load project
  const { data: project, error: pErr } = await supabase
    .from('projects').select('*').eq('id', id).eq('user_id', user.id).single()
  if (pErr || !project) { toast('Projeto não encontrado', 'error'); navigate('/dashboard'); return }

  // Load content
  const { data: contentRows } = await supabase
    .from('project_content').select('*').eq('project_id', id)

  state.project = project
  state.content = {}
  contentRows?.forEach(row => { state.content[row.section] = row.content })
  state.activeSection = 'capa'

  mount(`
    ${renderNavbar(user)}
    <div class="editor-layout">

      <!-- LEFT: Sections -->
      <aside class="editor-sidebar">
        <div class="sidebar-header">
          <a data-link="/dashboard" class="sidebar-back">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </a>
          <div class="sidebar-project">
            <div class="sidebar-project__name">${project.name}</div>
            <span class="badge ${project.is_published ? 'badge-published' : 'badge-draft'}">
              ${project.is_published ? 'Publicado' : 'Rascunho'}
            </span>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${SECTIONS.map(s => `
            <button class="sidebar-nav__item ${s === 'capa' ? 'active' : ''}" data-section="${s}">
              <span class="sidebar-nav__icon">${SECTION_ICONS[s]}</span>
              ${SECTION_LABELS[s]}
            </button>
          `).join('')}
        </nav>
      </aside>

      <!-- CENTER: Preview -->
      <div class="editor-preview-wrap">
        <div class="editor-preview-label">Preview do Portal</div>
        <div class="editor-preview" id="portal-preview">
          ${renderPreview(project, state.content)}
        </div>
      </div>

      <!-- RIGHT: Editor panel -->
      <aside class="editor-panel">
        <div class="editor-panel__head">
          <div>
            <span class="panel-section-icon">${SECTION_ICONS['capa']}</span>
            <span class="panel-section-name" id="panel-section-name">Capa</span>
          </div>
          <div class="editor-actions">
            <button class="btn btn-ghost btn-sm" id="save-btn">Salvar</button>
            <button class="btn ${project.is_published ? 'btn-ghost' : 'btn-accent'} btn-sm" id="publish-btn">
              ${project.is_published ? 'Publicado ✓' : 'Publicar'}
            </button>
          </div>
        </div>
        <div class="editor-panel__body" id="editor-panel-body">
          ${renderSectionForm('capa', state.content['capa'] || {})}
        </div>
      </aside>
    </div>
  `)

  // ── Event: section nav ───────────────────────────
  document.querySelectorAll('.sidebar-nav__item').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.dataset.section
      document.querySelectorAll('.sidebar-nav__item').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.activeSection = sec
      document.getElementById('panel-section-name').textContent = SECTION_LABELS[sec]
      document.querySelectorAll('.panel-section-icon')[0].innerHTML = SECTION_ICONS[sec]
      document.getElementById('editor-panel-body').innerHTML = renderSectionForm(sec, state.content[sec] || {})
      bindSectionEvents(sec)
    })
  })

  // ── Event: save ──────────────────────────────────
  document.getElementById('save-btn').addEventListener('click', saveContent)

  // ── Event: publish ───────────────────────────────
  document.getElementById('publish-btn').addEventListener('click', publishPortal)

  // Bind initial section events
  bindSectionEvents('capa')
}

// ── Section Forms ────────────────────────────────────
function renderSectionForm(section, data = {}) {
  switch (section) {
    case 'capa': return `
      <div class="form-section">
        <div class="field">
          <label class="label">Nome da Marca</label>
          <input class="input" id="f-brand-name" value="${data.brand_name || state.project?.name || ''}" placeholder="Nome da marca">
        </div>
        <div class="field">
          <label class="label">Descrição / Tagline</label>
          <textarea class="textarea" id="f-description" rows="3" placeholder="Uma breve descrição da marca...">${data.description || ''}</textarea>
        </div>
      </div>
    `
    case 'logotipo': return `
      <div class="form-section">
        <div class="field">
          <label class="label">Logo Principal</label>
          <div class="upload-zone" id="logo-main-zone">
            <input type="file" id="f-logo-main" accept="image/*" hidden>
            ${data.logo_main ? `<img src="${data.logo_main}" style="max-height:60px;object-fit:contain">` : `
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Clique para upload</span>
            `}
          </div>
        </div>
        <div class="field">
          <label class="label">Variações (opcionais)</label>
          <div class="upload-zone" id="logo-alt-zone">
            <input type="file" id="f-logo-alt" accept="image/*" multiple hidden>
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>Múltiplos arquivos</span>
          </div>
          ${(data.logo_variants || []).length > 0 ? `
            <div class="logo-variants-list">
              ${data.logo_variants.map(v => `<img src="${v}" class="logo-variant-thumb">`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `
    case 'cores': return `
      <div class="form-section">
        <div id="colors-list">
          ${(data.colors || []).map((c, i) => colorRow(c, i)).join('')}
        </div>
        <button class="btn btn-ghost btn-sm" id="add-color-btn" style="margin-top:var(--sp-3)">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Adicionar Cor
        </button>
      </div>
    `
    case 'tipografia': return `
      <div class="form-section">
        ${(data.fonts || [{ name: '', description: '' }]).map((f, i) => `
          <div class="font-row" style="margin-bottom:var(--sp-5)">
            <div class="field">
              <label class="label">Fonte ${i + 1}</label>
              <input class="input font-name" value="${f.name || ''}" placeholder="Ex: Geist, DM Sans, Lora" data-index="${i}">
            </div>
            <div class="field" style="margin-top:var(--sp-3)">
              <label class="label">Descrição</label>
              <input class="input font-desc" value="${f.description || ''}" placeholder="Ex: Usada em títulos, peso 700" data-index="${i}">
            </div>
          </div>
        `).join('')}
        <button class="btn btn-ghost btn-sm" id="add-font-btn">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Adicionar Fonte
        </button>
      </div>
    `
    case 'textos': return `
      <div class="form-section">
        <div class="field">
          <label class="label">Conteúdo Livre</label>
          <textarea class="textarea" id="f-texts" rows="8" placeholder="Missão, visão, valores, voz da marca...">${data.content || ''}</textarea>
        </div>
      </div>
    `
    case 'arquivos': return `
      <div class="form-section">
        <div class="field">
          <label class="label">Upload de Arquivos</label>
          <div class="upload-zone" id="files-upload-zone">
            <input type="file" id="f-files" multiple hidden>
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>Arraste ou clique para adicionar arquivos</span>
          </div>
        </div>
        <div id="assets-list" class="assets-list">
          <p style="font-size:var(--text-sm);color:var(--text-muted)">Carregando...</p>
        </div>
      </div>
    `
    default: return '<p style="color:var(--text-muted);padding:var(--sp-4)">Selecione uma seção.</p>'
  }
}

function colorRow(c = { hex: '#000000', name: '' }, index) {
  return `
    <div class="color-row" data-index="${index}">
      <div class="color-swatch-preview" style="background:${c.hex || '#000'}" id="preview-${index}"></div>
      <input class="input color-hex-input" value="${c.hex || '#000000'}" placeholder="#000000" data-index="${index}" style="font-family:monospace;flex:1">
      <input class="input color-name-input" value="${c.name || ''}" placeholder="Nome (opcional)" data-index="${index}" style="flex:1.5">
      <button class="btn-icon color-remove-btn" data-index="${index}" title="Remover">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `
}

// ── Bind section-specific events ─────────────────────
function bindSectionEvents(section) {
  const data = state.content[section] || {}

  if (section === 'capa') {
    const autoSave = debounce(() => collectAndSave('capa'), 1000)
    document.getElementById('f-brand-name')?.addEventListener('input', autoSave)
    document.getElementById('f-description')?.addEventListener('input', autoSave)
  }

  if (section === 'logotipo') {
    const logoMain = document.getElementById('logo-main-zone')
    const logoFile = document.getElementById('f-logo-main')
    logoMain?.addEventListener('click', () => logoFile.click())
    logoFile?.addEventListener('change', async () => {
      if (!logoFile.files[0]) return
      await uploadAndSaveLogo('logo_main', logoFile.files[0])
    })

    const logoAltZone = document.getElementById('logo-alt-zone')
    const logoAltFile = document.getElementById('f-logo-alt')
    logoAltZone?.addEventListener('click', () => logoAltFile.click())
    logoAltFile?.addEventListener('change', async () => {
      if (!logoAltFile.files.length) return
      await uploadLogoVariants(Array.from(logoAltFile.files))
    })
  }

  if (section === 'cores') {
    bindColorEvents()
  }

  if (section === 'tipografia') {
    bindFontEvents()
  }

  if (section === 'textos') {
    const autoSave = debounce(() => collectAndSave('textos'), 1000)
    document.getElementById('f-texts')?.addEventListener('input', autoSave)
  }

  if (section === 'arquivos') {
    renderAssetsList().then(html => {
      const el = document.getElementById('assets-list')
      if (el) el.innerHTML = html
    })
    const fileZone = document.getElementById('files-upload-zone')
    const fileInput = document.getElementById('f-files')
    fileZone?.addEventListener('click', () => fileInput.click())
    fileInput?.addEventListener('change', async () => {
      if (!fileInput.files.length) return
      await uploadAssets(Array.from(fileInput.files))
    })
    fileZone?.addEventListener('dragover', e => { e.preventDefault(); fileZone.classList.add('dragover') })
    fileZone?.addEventListener('dragleave', () => fileZone.classList.remove('dragover'))
    fileZone?.addEventListener('drop', async e => {
      e.preventDefault(); fileZone.classList.remove('dragover')
      await uploadAssets(Array.from(e.dataTransfer.files))
    })
  }
}

function bindColorEvents() {
  const list = document.getElementById('colors-list')
  const addBtn = document.getElementById('add-color-btn')

  const refresh = () => {
    const colors = state.content['cores']?.colors || []
    list.innerHTML = colors.map((c, i) => colorRow(c, i)).join('')
    attachColorListeners()
  }

  const attachColorListeners = () => {
    list.querySelectorAll('.color-hex-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const i = inp.dataset.index
        const hex = inp.value
        state.content['cores'] = state.content['cores'] || { colors: [] }
        state.content['cores'].colors[i].hex = hex
        if (isValidHex(hex)) document.getElementById(`preview-${i}`).style.background = hex
      })
      inp.addEventListener('change', () => collectAndSave('cores'))
    })
    list.querySelectorAll('.color-name-input').forEach(inp => {
      inp.addEventListener('input', debounce(() => {
        const i = inp.dataset.index
        state.content['cores'] = state.content['cores'] || { colors: [] }
        state.content['cores'].colors[i].name = inp.value
        collectAndSave('cores')
      }, 600))
    })
    list.querySelectorAll('.color-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.index)
        state.content['cores'].colors.splice(i, 1)
        refresh()
        collectAndSave('cores')
      })
    })
  }

  attachColorListeners()

  addBtn?.addEventListener('click', () => {
    state.content['cores'] = state.content['cores'] || { colors: [] }
    state.content['cores'].colors.push({ hex: '#000000', name: '' })
    refresh()
  })
}

function bindFontEvents() {
  const addBtn = document.getElementById('add-font-btn')
  const autoSave = debounce(() => collectAndSave('tipografia'), 800)

  document.querySelectorAll('.font-name, .font-desc').forEach(inp => {
    inp.addEventListener('input', () => {
      const i = inp.dataset.index
      state.content['tipografia'] = state.content['tipografia'] || { fonts: [] }
      while (state.content['tipografia'].fonts.length <= i)
        state.content['tipografia'].fonts.push({ name: '', description: '' })
      if (inp.classList.contains('font-name')) state.content['tipografia'].fonts[i].name = inp.value
      else state.content['tipografia'].fonts[i].description = inp.value
      autoSave()
    })
  })

  addBtn?.addEventListener('click', () => {
    state.content['tipografia'] = state.content['tipografia'] || { fonts: [] }
    state.content['tipografia'].fonts.push({ name: '', description: '' })
    document.getElementById('editor-panel-body').innerHTML = renderSectionForm('tipografia', state.content['tipografia'])
    bindSectionEvents('tipografia')
  })
}

// ── Collect current form data & save ─────────────────
function collectAndSave(section) {
  let data = state.content[section] || {}

  if (section === 'capa') {
    data = {
      ...data,
      brand_name: document.getElementById('f-brand-name')?.value || '',
      description: document.getElementById('f-description')?.value || ''
    }
  } else if (section === 'textos') {
    data = { ...data, content: document.getElementById('f-texts')?.value || '' }
  } else if (section === 'tipografia') {
    const names = [...document.querySelectorAll('.font-name')].map(i => i.value)
    const descs = [...document.querySelectorAll('.font-desc')].map(i => i.value)
    data = { fonts: names.map((n, i) => ({ name: n, description: descs[i] || '' })) }
  }
  // cores handled directly on state.content

  state.content[section] = data
  updatePreview()
}

async function saveContent() {
  const btn = document.getElementById('save-btn')
  btn.disabled = true; btn.textContent = 'Salvando...'

  try {
    for (const section of SECTIONS) {
      const content = state.content[section]
      if (content === undefined) continue
      await supabase.from('project_content').upsert({
        project_id: state.project.id,
        section,
        content
      })
    }
    toast('Salvo!', 'success')
  } catch (err) {
    toast('Erro ao salvar: ' + err.message, 'error')
  } finally {
    btn.disabled = false; btn.textContent = 'Salvar'
  }
}

async function publishPortal() {
  const btn = document.getElementById('publish-btn')
  btn.disabled = true; btn.textContent = 'Publicando...'

  try {
    await saveContent()
    let slug = state.project.slug
    if (!slug) slug = generateSlug(state.project.name)

    const { data, error } = await supabase.from('projects')
      .update({ is_published: true, slug })
      .eq('id', state.project.id)

    if (error) throw error
    state.project.slug = slug
    state.project.is_published = true

    btn.textContent = 'Publicado ✓'
    btn.className = 'btn btn-ghost btn-sm'

    // Update badge
    const badge = document.querySelector('.sidebar-project .badge')
    if (badge) { badge.className = 'badge badge-published'; badge.textContent = 'Publicado' }

    toast(`Portal publicado! /p/${slug}`, 'success', 5000)

    // Show share link
    showShareLink(slug)
  } catch (err) {
    toast('Erro ao publicar: ' + err.message, 'error')
    btn.disabled = false; btn.textContent = 'Publicar'
  }
}

function showShareLink(slug) {
  const url = `${location.origin}/p/${slug}`
  const existing = document.getElementById('share-bar')
  if (existing) return

  const bar = document.createElement('div')
  bar.id = 'share-bar'
  bar.className = 'share-bar'
  bar.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
    <span class="share-url">${url}</span>
    <button class="btn btn-primary btn-sm" id="copy-share-btn">Copiar link</button>
    <a href="${url}" target="_blank" class="btn btn-ghost btn-sm">Abrir</a>
  `
  document.querySelector('.editor-panel__head').appendChild(bar)
  document.getElementById('copy-share-btn').addEventListener('click', async () => {
    await copyToClipboard(url)
    toast('Link copiado!', 'success')
  })
}

// ── File uploads ──────────────────────────────────────
async function uploadAndSaveLogo(field, file) {
  const btn = document.querySelector('.sidebar-nav__item.active')
  btn.style.opacity = '0.6'
  try {
    const ext = file.name.split('.').pop()
    const path = `logos/${state.project.id}/${field}_${Date.now()}.${ext}`
    await supabase.storage.from('assets').upload(path, file, { upsert: true })
    const url = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl
    state.content['logotipo'] = state.content['logotipo'] || {}
    state.content['logotipo'][field] = url
    await saveContent()
    toast('Logo salva!', 'success')
    document.getElementById('editor-panel-body').innerHTML = renderSectionForm('logotipo', state.content['logotipo'])
    bindSectionEvents('logotipo')
    updatePreview()
  } catch (err) { toast('Erro no upload: ' + err.message, 'error') }
  finally { btn.style.opacity = '' }
}

async function uploadLogoVariants(files) {
  state.content['logotipo'] = state.content['logotipo'] || {}
  state.content['logotipo'].logo_variants = state.content['logotipo'].logo_variants || []
  for (const file of files) {
    const ext = file.name.split('.').pop()
    const path = `logos/${state.project.id}/variant_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    await supabase.storage.from('assets').upload(path, file, { upsert: true })
    const url = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl
    state.content['logotipo'].logo_variants.push(url)
  }
  await saveContent()
  toast(`${files.length} variação(ões) adicionada(s)`, 'success')
  document.getElementById('editor-panel-body').innerHTML = renderSectionForm('logotipo', state.content['logotipo'])
  bindSectionEvents('logotipo')
}

async function uploadAssets(files) {
  const zone = document.getElementById('files-upload-zone')
  zone.querySelector('span').textContent = 'Fazendo upload...'
  try {
    for (const file of files) {
      const path = `files/${state.project.id}/${Date.now()}_${file.name}`
      await supabase.storage.from('assets').upload(path, file, { upsert: true })
      const url = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl
      await supabase.from('assets').insert({
        project_id: state.project.id,
        file_url: url,
        file_name: file.name
      })
    }
    toast(`${files.length} arquivo(s) enviado(s)`, 'success')
    document.getElementById('assets-list').innerHTML = await renderAssetsList()
    bindAssetEvents()
  } catch (err) { toast('Erro: ' + err.message, 'error') }
  finally { zone.querySelector('span').textContent = 'Arraste ou clique para adicionar arquivos' }
}

async function renderAssetsList() {
  if (!state.project) return ''
  const { data } = await supabase.from('assets')
    .select('*').eq('project_id', state.project.id).order('created_at', { ascending: false })
  if (!data?.length) return '<p style="font-size:var(--text-sm);color:var(--text-muted);padding:var(--sp-4) 0">Nenhum arquivo ainda.</p>'
  return `
    <div class="assets-items">
      ${data.map(a => `
        <div class="asset-row" data-id="${a.id}">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
          <span class="asset-name">${a.file_name}</span>
          <a href="${a.file_url}" target="_blank" class="btn-icon" title="Download">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </a>
        </div>
      `).join('')}
    </div>
  `
}

function bindAssetEvents() { /* placeholder for delete actions */ }

// ── Preview renderer ──────────────────────────────────
function renderPreview(project, content) {
  const capa = content['capa'] || {}
  const logo = content['logotipo'] || {}
  const cores = content['cores'] || {}
  const tipo = content['tipografia'] || {}
  const textos = content['textos'] || {}

  return `
    <div class="preview-portal">
      <div class="preview-portal__header">
        ${logo.logo_main
          ? `<img src="${logo.logo_main}" class="preview-logo-img" alt="Logo">`
          : `<div class="preview-logo-placeholder">${(capa.brand_name || project.name || 'M').charAt(0)}</div>`}
        <div>
          <div class="preview-brand-name">${capa.brand_name || project.name || 'Nome da Marca'}</div>
          ${capa.description ? `<div class="preview-brand-desc">${capa.description}</div>` : ''}
        </div>
      </div>

      ${(cores.colors || []).length > 0 ? `
        <div class="preview-section-block">
          <div class="preview-section-title">Cores</div>
          <div class="preview-colors">
            ${cores.colors.map(c => `
              <div class="preview-color-chip">
                <div class="preview-swatch" style="background:${c.hex}"></div>
                <div class="preview-hex">${c.hex}</div>
                ${c.name ? `<div class="preview-color-name">${c.name}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${(tipo.fonts || []).filter(f => f.name).length > 0 ? `
        <div class="preview-section-block">
          <div class="preview-section-title">Tipografia</div>
          ${tipo.fonts.filter(f => f.name).map(f => `
            <div class="preview-font-row">
              <span class="preview-font-name">${f.name}</span>
              ${f.description ? `<span class="preview-font-desc">${f.description}</span>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${textos.content ? `
        <div class="preview-section-block">
          <div class="preview-section-title">Textos</div>
          <p class="preview-text-content">${textos.content}</p>
        </div>
      ` : ''}
    </div>
  `
}

function updatePreview() {
  const preview = document.getElementById('portal-preview')
  if (preview) preview.innerHTML = renderPreview(state.project, state.content)
}

// ── CSS ──────────────────────────────────────────────
const style = document.createElement('style')
style.textContent = `
.editor-layout {
  display: grid;
  grid-template-columns: 224px 1fr 320px;
  height: calc(100dvh - 60px);
  overflow: hidden;
}

/* Sidebar */
.editor-sidebar {
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  overflow-y: auto;
  background: var(--bg-1);
}
.sidebar-header {
  display: flex; align-items: center; gap: var(--sp-3);
  padding: var(--sp-4);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.sidebar-back {
  width: 32px; height: 32px; border-radius: var(--r-md);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-3); flex-shrink: 0;
  transition: background var(--t-fast), color var(--t-fast);
}
.sidebar-back:hover { background: var(--bg-3); color: var(--text-1); }
.sidebar-project { min-width: 0; }
.sidebar-project__name {
  font-family: var(--font-display); font-weight: 600; font-size: var(--text-sm);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: var(--text-1); margin-bottom: 4px;
}
.sidebar-nav { padding: var(--sp-3); display: flex; flex-direction: column; gap: 2px; }
.sidebar-nav__item {
  display: flex; align-items: center; gap: var(--sp-2);
  width: 100%; padding: 9px 12px;
  border-radius: var(--r-md);
  font-family: var(--font-display); font-size: var(--text-sm); color: var(--text-3);
  text-align: left; cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast);
}
.sidebar-nav__item:hover { background: var(--bg-2); color: var(--text-1); }
.sidebar-nav__item.active { background: var(--accent-dim); color: var(--accent-2); font-weight: 600; }
.sidebar-nav__icon { flex-shrink: 0; }

/* Preview */
.editor-preview-wrap {
  display: flex; flex-direction: column;
  background: var(--bg);
  border-right: 1px solid var(--border);
  overflow: hidden;
}
.editor-preview-label {
  font-family: var(--font-display); font-size: var(--text-xs); color: var(--text-3);
  text-align: center; letter-spacing: 0.08em; text-transform: uppercase;
  padding: var(--sp-3); border-bottom: 1px solid var(--border);
  flex-shrink: 0; font-weight: 600;
}
.editor-preview { flex: 1; overflow-y: auto; padding: var(--sp-5); display: flex; justify-content: center; }
.preview-portal {
  width: 100%; max-width: 460px;
  background: var(--bg-1); border: 1px solid var(--border-md);
  border-radius: var(--r-xl); overflow: hidden; box-shadow: var(--shadow-lg);
}
.preview-portal__header {
  display: flex; align-items: center; gap: var(--sp-4);
  padding: var(--sp-5); border-bottom: 1px solid var(--border);
}
.preview-logo-img { width: 40px; height: 40px; object-fit: contain; flex-shrink: 0; }
.preview-logo-placeholder {
  width: 40px; height: 40px; border-radius: var(--r-md);
  background: var(--accent); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-brand); font-size: var(--text-lg); flex-shrink: 0;
}
.preview-brand-name { font-family: var(--font-brand); font-size: var(--text-xl); color: var(--text-1); }
.preview-brand-desc { font-size: var(--text-xs); color: var(--text-2); margin-top: 3px; }
.preview-section-block { padding: var(--sp-5); border-bottom: 1px solid var(--border); }
.preview-section-block:last-child { border-bottom: none; }
.preview-section-title { font-family: var(--font-display); font-size: var(--text-xs); letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-3); margin-bottom: var(--sp-3); font-weight: 700; }
.preview-colors { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.preview-color-chip { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.preview-swatch { width: 40px; height: 40px; border-radius: var(--r-md); border: 1px solid var(--border); }
.preview-hex { font-family: monospace; font-size: 9px; color: var(--text-3); }
.preview-color-name { font-size: 9px; color: var(--text-3); }
.preview-font-row { display: flex; align-items: baseline; gap: var(--sp-3); margin-bottom: 5px; }
.preview-font-name { font-weight: 600; font-size: var(--text-sm); color: var(--text-1); }
.preview-font-desc { font-size: var(--text-xs); color: var(--text-2); }
.preview-text-content { font-size: var(--text-sm); color: var(--text-2); line-height: 1.7; }

/* Right Panel */
.editor-panel { display: flex; flex-direction: column; overflow: hidden; background: var(--bg-1); }
.editor-panel__head {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: var(--sp-2);
  padding: var(--sp-4) var(--sp-5);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.editor-panel__head > div:first-child { display: flex; align-items: center; gap: var(--sp-2); color: var(--text-3); }
.panel-section-name { font-family: var(--font-display); font-weight: 600; font-size: var(--text-sm); color: var(--text-1); }
.editor-actions { display: flex; gap: var(--sp-2); }
.editor-panel__body { flex: 1; overflow-y: auto; padding: var(--sp-5); }
.form-section { display: flex; flex-direction: column; gap: var(--sp-4); }

/* Color rows */
.color-row { display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-3) 0; border-bottom: 1px solid var(--border); }
.color-row:last-child { border-bottom: none; }
.color-swatch-preview { width: 32px; height: 32px; border-radius: var(--r-sm); border: 1px solid var(--border); flex-shrink: 0; }

/* Logo variants */
.logo-variants-list { display: flex; flex-wrap: wrap; gap: var(--sp-2); margin-top: var(--sp-3); }
.logo-variant-thumb { width: 64px; height: 40px; object-fit: contain; border: 1px solid var(--border); border-radius: var(--r-sm); }

/* Assets list */
.assets-items { display: flex; flex-direction: column; gap: 2px; margin-top: var(--sp-3); }
.asset-row { display: flex; align-items: center; gap: var(--sp-2); padding: 8px 10px; border-radius: var(--r-md); font-size: var(--text-sm); color: var(--text-2); transition: background var(--t-fast); }
.asset-row:hover { background: var(--bg-2); }
.asset-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Share bar */
.share-bar { margin-top: var(--sp-3); padding: var(--sp-3); background: var(--accent-dim); border: 1px solid rgba(200,132,58,0.25); border-radius: var(--r-md); display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; width: 100%; font-size: var(--text-xs); color: var(--accent-2); }
.share-url { flex: 1; font-family: monospace; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

@media (max-width: 900px) {
  .editor-layout { grid-template-columns: 52px 1fr; grid-template-rows: 1fr auto; }
  .editor-panel { grid-column: 1 / -1; height: 45vh; border-right: none; border-top: 1px solid var(--border); }
  .editor-preview-wrap { border-right: none; }
  .sidebar-project { display: none; }
  .sidebar-nav__item span:not(.sidebar-nav__icon) { display: none; }
  .sidebar-nav__item { justify-content: center; padding: 10px; }
  .sidebar-header { padding: var(--sp-3) var(--sp-2); justify-content: center; }
  .sidebar-back { display: none; }
}
`
document.head.appendChild(style)

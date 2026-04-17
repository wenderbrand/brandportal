// ─────────────────────────────────────────────────────
//  pages/dashboard.js
// ─────────────────────────────────────────────────────
import { mount, toast } from '../lib/utils.js'
import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'
import { renderNavbar } from '../components/navbar.js'

export async function renderDashboard() {
  const user = supabase.auth.getUser()
  if (!user) { navigate('/login'); return }

  mount(`
    ${renderNavbar(user)}
    <main class="dashboard">
      <div class="container">
        <div class="dash-header">
          <div>
            <h1 class="dash-title">Meus Portais</h1>
            <p class="dash-sub">Gerencie e compartilhe suas identidades visuais</p>
          </div>
          <button class="btn btn-primary" id="new-project-btn">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Portal
          </button>
        </div>

        <div id="projects-grid" class="projects-grid">
          <div class="skeleton-grid">
            ${[1,2,3].map(() => `
              <div class="project-card skeleton-card">
                <div class="sk-line" style="height:20px;width:60%;margin-bottom:8px"></div>
                <div class="sk-line" style="height:14px;width:30%"></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </main>

    <!-- Modal: Novo Projeto -->
    <div id="new-project-modal" class="overlay" style="display:none">
      <div class="modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-6)">
          <h2 style="font-family:var(--font-brand);font-size:var(--text-xl)">Novo Portal</h2>
          <button id="close-modal-btn" class="btn-icon" aria-label="Fechar">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form id="new-project-form" novalidate>
          <div class="field" style="margin-bottom:var(--sp-4)">
            <label class="label" for="brand-name">Nome da Marca</label>
            <input class="input" type="text" id="brand-name" placeholder="Ex: Acme Studio" required>
          </div>
          <div class="field" style="margin-bottom:var(--sp-6)">
            <label class="label">Logo (opcional)</label>
            <div class="upload-zone" id="logo-upload-zone">
              <input type="file" id="logo-file" accept="image/*" hidden>
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span id="upload-label">Clique ou arraste sua logo</span>
            </div>
          </div>
          <div style="display:flex;gap:var(--sp-3);justify-content:flex-end">
            <button type="button" id="cancel-modal-btn" class="btn btn-ghost">Cancelar</button>
            <button type="submit" id="create-btn" class="btn btn-primary">Criar Portal</button>
          </div>
        </form>
      </div>
    </div>
  `)

  // Load projects
  await loadProjects(user.id)

  // Events
  document.getElementById('new-project-btn').onclick = () => showModal(true)
  document.getElementById('close-modal-btn').onclick  = () => showModal(false)
  document.getElementById('cancel-modal-btn').onclick = () => showModal(false)

  // Logo upload zone
  const zone = document.getElementById('logo-upload-zone')
  const fileInput = document.getElementById('logo-file')
  zone.onclick = () => fileInput.click()
  fileInput.onchange = () => {
    if (fileInput.files[0]) {
      document.getElementById('upload-label').textContent = fileInput.files[0].name
      zone.style.borderColor = 'var(--accent)'
    }
  }
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover') })
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'))
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragover')
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) {
      const dt = new DataTransfer(); dt.items.add(f); fileInput.files = dt.files
      document.getElementById('upload-label').textContent = f.name
      zone.style.borderColor = 'var(--accent)'
    }
  })

  // Create project form
  document.getElementById('new-project-form').onsubmit = async e => {
    e.preventDefault()
    const name = document.getElementById('brand-name').value.trim()
    if (!name) { toast('Informe o nome da marca', 'error'); return }

    const btn = document.getElementById('create-btn')
    btn.disabled = true; btn.textContent = 'Criando...'

    try {
      let logo_url = null
      const logoFile = document.getElementById('logo-file').files[0]
      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        const path = `logos/${user.id}/${Date.now()}.${ext}`
        const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path)
        await supabase.storage.from('assets').upload(path, logoFile, { upsert: true })
        logo_url = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl
      }

      const { data, error } = await supabase.from('projects').insert({
        user_id: user.id, name, logo_url, is_published: false, slug: null
      })
      if (error) throw error

      const project = Array.isArray(data) ? data[0] : data
      toast('Portal criado!', 'success')
      showModal(false)
      navigate(`/editor/${project.id}`)
    } catch (err) {
      toast(err.message || 'Erro ao criar projeto', 'error')
      btn.disabled = false; btn.textContent = 'Criar Portal'
    }
  }
}

async function loadProjects(userId) {
  const grid = document.getElementById('projects-grid')
  const { data, error } = await supabase.from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) { toast('Erro ao carregar projetos', 'error'); return }

  if (!data || data.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24" opacity=".3"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        <p>Você ainda não tem portais.<br>Crie o primeiro agora!</p>
        <button class="btn btn-primary" id="empty-new-btn">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Portal
        </button>
      </div>
    `
    document.getElementById('empty-new-btn')?.addEventListener('click', () => showModal(true))
    return
  }

  grid.innerHTML = `<div class="projects-list">${data.map(p => projectCard(p)).join('')}</div>`

  // Attach events
  data.forEach(p => {
    document.getElementById(`edit-${p.id}`)?.addEventListener('click', () => navigate(`/editor/${p.id}`))
    document.getElementById(`open-${p.id}`)?.addEventListener('click', () => window.open(`/p/${p.slug}`, '_blank'))
  })
}

function projectCard(p) {
  const date = new Date(p.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })
  return `
    <div class="project-card">
      <div class="project-card__top">
        <div class="project-logo-wrap">
          ${p.logo_url
            ? `<img src="${p.logo_url}" alt="Logo" class="project-logo-img">`
            : `<div class="project-logo-placeholder">${p.name.charAt(0).toUpperCase()}</div>`}
        </div>
        <div class="project-info">
          <h3 class="project-name">${p.name}</h3>
          <span class="badge ${p.is_published ? 'badge-published' : 'badge-draft'}">
            <span class="badge-dot-sm"></span>
            ${p.is_published ? 'Publicado' : 'Rascunho'}
          </span>
        </div>
      </div>
      <div class="project-card__foot">
        <span class="project-date">${date}</span>
        <div class="project-actions">
          ${p.is_published ? `
            <button class="btn btn-ghost btn-sm" id="open-${p.id}">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Abrir
            </button>
          ` : ''}
          <button class="btn btn-primary btn-sm" id="edit-${p.id}">Editar</button>
        </div>
      </div>
    </div>
  `
}

function showModal(show) {
  const m = document.getElementById('new-project-modal')
  m.style.display = show ? 'flex' : 'none'
  if (!show) {
    document.getElementById('new-project-form').reset()
    document.getElementById('upload-label').textContent = 'Clique ou arraste sua logo'
    document.getElementById('logo-upload-zone').style.borderColor = ''
  }
}

// ── CSS ──────────────────────────────────────────────
const style = document.createElement('style')
style.textContent = `
.dashboard { padding: var(--sp-10) 0 var(--sp-16); }
.dash-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: var(--sp-4); flex-wrap: wrap; margin-bottom: var(--sp-8);
}
.dash-title {
  font-family: var(--font-brand);
  font-size: var(--text-2xl); margin-bottom: 4px;
}
.dash-sub { font-size: var(--text-sm); color: var(--text-secondary); }

/* Projects grid */
.projects-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--sp-5);
}
.project-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--sp-5);
  display: flex; flex-direction: column; gap: var(--sp-4);
  transition: box-shadow var(--t-fast), border-color var(--t-fast);
}
.project-card:hover { box-shadow: var(--shadow-md); border-color: var(--border-dark); }
.project-card__top { display: flex; align-items: center; gap: var(--sp-3); }
.project-logo-wrap { flex-shrink: 0; }
.project-logo-img { width: 44px; height: 44px; object-fit: contain; border-radius: var(--radius-sm); border: 1px solid var(--border); }
.project-logo-placeholder {
  width: 44px; height: 44px; border-radius: var(--radius-md);
  background: var(--text-primary); color: var(--bg);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-brand); font-size: var(--text-lg);
}
.project-info { display: flex; flex-direction: column; gap: 6px; }
.project-name { font-size: var(--text-md); font-weight: 600; }
.badge-dot-sm { width: 5px; height: 5px; border-radius: 50%; background: currentColor; display:inline-block; }
.project-card__foot {
  display: flex; align-items: center; justify-content: space-between; gap: var(--sp-2);
  border-top: 1px solid var(--border); padding-top: var(--sp-4);
}
.project-date { font-size: var(--text-xs); color: var(--text-muted); }
.project-actions { display: flex; gap: var(--sp-2); }

/* Skeleton */
.skeleton-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--sp-5);
  min-height: 120px;
}
.skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: var(--sp-5); }
.sk-line {
  background: linear-gradient(90deg, var(--bg-elevated) 0%, var(--border) 50%, var(--bg-elevated) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer { 0%{background-position:200%} 100%{background-position:-200%} }

/* Empty state */
.empty-state {
  padding: var(--sp-16) var(--sp-6);
  display: flex; flex-direction: column; align-items: center;
  gap: var(--sp-4); text-align: center;
}
.empty-state p { font-size: var(--text-md); color: var(--text-secondary); line-height: 1.7; }

/* Upload zone */
.upload-zone {
  border: 2px dashed var(--border);
  border-radius: var(--radius-md);
  padding: var(--sp-6);
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-2);
  cursor: pointer; color: var(--text-secondary); font-size: var(--text-sm);
  transition: border-color var(--t-fast), background var(--t-fast);
}
.upload-zone:hover, .upload-zone.dragover {
  border-color: var(--accent); background: var(--accent-light);
}

/* Btn-icon */
.btn-icon {
  width: 36px; height: 36px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary); cursor: pointer;
  transition: background var(--t-fast);
}
.btn-icon:hover { background: var(--bg-elevated); }
`
document.head.appendChild(style)

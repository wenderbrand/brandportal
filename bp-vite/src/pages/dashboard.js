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
            <div class="section-eyebrow">Workspace</div>
            <h1 class="dash-title">Meus Portais</h1>
          </div>
          <button class="btn btn-accent" id="new-project-btn">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Portal
          </button>
        </div>
        <div id="projects-area">
          <div class="skeleton-grid">
            ${[1,2,3].map(()=>`<div class="project-card skeleton-card"><div class="sk-line" style="height:18px;width:55%;margin-bottom:10px"></div><div class="sk-line" style="height:12px;width:28%"></div></div>`).join('')}
          </div>
        </div>
      </div>
    </main>

    <div id="new-modal" class="overlay" style="display:none">
      <div class="modal">
        <div class="modal-head">
          <h2 class="modal-title">Novo Portal</h2>
          <button id="close-modal" class="btn-icon"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <form id="new-form" novalidate>
          <div class="field" style="margin-bottom:var(--sp-4)">
            <label class="label">Nome da Marca</label>
            <input class="input" id="brand-name" type="text" placeholder="Ex: Studio Nova" required>
          </div>
          <div class="field" style="margin-bottom:var(--sp-6)">
            <label class="label">Logo (opcional)</label>
            <div class="upload-zone" id="logo-zone">
              <input type="file" id="logo-file" accept="image/*" hidden>
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span id="upload-label">Clique ou arraste</span>
            </div>
          </div>
          <div style="display:flex;gap:var(--sp-3);justify-content:flex-end">
            <button type="button" id="cancel-modal" class="btn btn-ghost">Cancelar</button>
            <button type="submit" id="create-btn" class="btn btn-accent">Criar Portal</button>
          </div>
        </form>
      </div>
    </div>
  `)

  await loadProjects(user.id)

  const showModal = (v) => {
    document.getElementById('new-modal').style.display = v ? 'flex' : 'none'
    if (!v) { document.getElementById('new-form').reset(); document.getElementById('upload-label').textContent = 'Clique ou arraste'; document.getElementById('logo-zone').style.borderColor = '' }
  }

  document.getElementById('new-project-btn').onclick = () => showModal(true)
  document.getElementById('close-modal').onclick = () => showModal(false)
  document.getElementById('cancel-modal').onclick = () => showModal(false)

  const zone = document.getElementById('logo-zone')
  const fi = document.getElementById('logo-file')
  zone.onclick = () => fi.click()
  fi.onchange = () => { if (fi.files[0]) { document.getElementById('upload-label').textContent = fi.files[0].name; zone.style.borderColor = 'var(--accent)' } }

  document.getElementById('new-form').onsubmit = async e => {
    e.preventDefault()
    const name = document.getElementById('brand-name').value.trim()
    if (!name) { toast('Informe o nome da marca', 'error'); return }
    const btn = document.getElementById('create-btn')
    btn.disabled = true; btn.textContent = 'Criando...'
    try {
      let logo_url = null
      const lf = document.getElementById('logo-file').files[0]
      if (lf) {
        const path = `logos/${user.id}/${Date.now()}.${lf.name.split('.').pop()}`
        await supabase.storage.from('assets').upload(path, lf, { upsert: true })
        logo_url = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl
      }
      const { data, error } = await supabase.from('projects').insert({ user_id: user.id, name, logo_url, is_published: false, slug: null })
      if (error) throw error
      const project = Array.isArray(data) ? data[0] : data
      toast('Portal criado!', 'success')
      showModal(false)
      navigate(`/editor/${project.id}`)
    } catch (err) { toast(err.message || 'Erro', 'error'); btn.disabled = false; btn.textContent = 'Criar Portal' }
  }
}

async function loadProjects(userId) {
  const area = document.getElementById('projects-area')
  const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) { toast('Erro ao carregar', 'error'); return }
  if (!data?.length) {
    area.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">
          <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24" opacity=".4"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        </div>
        <h3>Nenhum portal ainda</h3>
        <p>Crie seu primeiro portal e comece a impressionar seus clientes.</p>
        <button class="btn btn-accent" id="empty-new">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Portal
        </button>
      </div>`
    document.getElementById('empty-new')?.addEventListener('click', () => document.getElementById('new-project-btn').click())
    return
  }
  area.innerHTML = `<div class="projects-grid">${data.map(p => projectCard(p)).join('')}</div>`
  data.forEach(p => {
    document.getElementById(`edit-${p.id}`)?.addEventListener('click', () => navigate(`/editor/${p.id}`))
    document.getElementById(`open-${p.id}`)?.addEventListener('click', () => window.open(`/p/${p.slug}`, '_blank'))
  })
}

function projectCard(p) {
  const date = new Date(p.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })
  return `
    <div class="project-card">
      <div class="project-card__head">
        <div class="project-logo">
          ${p.logo_url ? `<img src="${p.logo_url}" alt="Logo">` : `<div class="project-logo__initials">${p.name.charAt(0).toUpperCase()}</div>`}
        </div>
        <span class="badge ${p.is_published ? 'badge-published' : 'badge-draft'}">
          <span style="width:5px;height:5px;border-radius:50%;background:currentColor;display:inline-block"></span>
          ${p.is_published ? 'Publicado' : 'Rascunho'}
        </span>
      </div>
      <div class="project-card__body">
        <h3 class="project-name">${p.name}</h3>
        <span class="project-date">${date}</span>
      </div>
      <div class="project-card__foot">
        ${p.is_published ? `<button class="btn btn-ghost btn-sm" id="open-${p.id}"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>Abrir</button>` : '<span></span>'}
        <button class="btn btn-primary btn-sm" id="edit-${p.id}">Editar</button>
      </div>
    </div>`
}

const style = document.createElement('style')
style.textContent = `
.dashboard { padding:var(--sp-12) 0 var(--sp-20); }
.dash-header { display:flex; align-items:flex-end; justify-content:space-between; gap:var(--sp-4); flex-wrap:wrap; margin-bottom:var(--sp-10); }
.dash-title { font-family:var(--font-brand); font-size:var(--text-4xl); color:var(--text-1); margin-top:var(--sp-2); }
.projects-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:var(--sp-5); }
.project-card { background:var(--bg-1); border:1px solid var(--border); border-radius:var(--r-xl); padding:var(--sp-5); display:flex; flex-direction:column; gap:var(--sp-4); transition:border-color var(--t-mid), box-shadow var(--t-mid); }
.project-card:hover { border-color:var(--border-md); box-shadow:var(--shadow-md); }
.project-card__head { display:flex; align-items:center; justify-content:space-between; }
.project-logo { width:48px; height:48px; border-radius:var(--r-lg); overflow:hidden; background:var(--bg-3); display:flex; align-items:center; justify-content:center; border:1px solid var(--border); flex-shrink:0; }
.project-logo img { width:100%; height:100%; object-fit:contain; }
.project-logo__initials { font-family:var(--font-brand); font-size:var(--text-xl); color:var(--accent); }
.project-card__body { flex:1; }
.project-name { font-family:var(--font-display); font-size:var(--text-lg); font-weight:600; color:var(--text-1); margin-bottom:4px; }
.project-date { font-size:var(--text-xs); color:var(--text-3); }
.project-card__foot { display:flex; align-items:center; justify-content:space-between; gap:var(--sp-2); padding-top:var(--sp-4); border-top:1px solid var(--border); }
.skeleton-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px,1fr)); gap:var(--sp-5); }
.skeleton-card { background:var(--bg-1); border:1px solid var(--border); border-radius:var(--r-xl); padding:var(--sp-5); min-height:140px; }
.sk-line { background:linear-gradient(90deg,var(--bg-2) 0%,var(--bg-3) 50%,var(--bg-2) 100%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:var(--r-sm); }
.empty-state { padding:var(--sp-20) var(--sp-6); display:flex; flex-direction:column; align-items:center; gap:var(--sp-5); text-align:center; }
.empty-state__icon { width:80px; height:80px; background:var(--bg-2); border:1px solid var(--border); border-radius:var(--r-xl); display:flex; align-items:center; justify-content:center; }
.empty-state h3 { font-family:var(--font-display); font-size:var(--text-xl); font-weight:600; color:var(--text-1); }
.empty-state p { font-size:var(--text-md); color:var(--text-2); line-height:1.7; max-width:380px; }
.modal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--sp-6); }
.modal-title { font-family:var(--font-brand); font-size:var(--text-2xl); color:var(--text-1); }
`
document.head.appendChild(style)

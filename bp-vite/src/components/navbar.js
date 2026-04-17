// ─────────────────────────────────────────────────────
//  components/navbar.js
// ─────────────────────────────────────────────────────
import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'
import { toast } from '../lib/utils.js'

export function renderNavbar(user) {
  const email = user?.email || ''
  const initials = email.slice(0, 2).toUpperCase()

  setTimeout(() => {
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await supabase.auth.signOut()
      toast('Até logo!', 'default')
      navigate('/')
    })

    const avatarBtn  = document.getElementById('avatar-btn')
    const avatarMenu = document.getElementById('avatar-menu')
    avatarBtn?.addEventListener('click', e => {
      e.stopPropagation()
      avatarMenu.classList.toggle('visible')
    })
    document.addEventListener('click', () => avatarMenu?.classList.remove('visible'))
  }, 0)

  return `
    <header class="navbar">
      <div class="container navbar__inner">
        <a data-link="/dashboard" class="landing-logo">Brand<span>Portal</span></a>
        <nav class="navbar__nav">
          <a data-link="/dashboard" class="navbar__link">Portais</a>
        </nav>
        <div class="navbar__user">
          <div class="avatar-wrapper">
            <button class="avatar-btn" id="avatar-btn" aria-label="Menu do usuário">
              <div class="avatar">${initials}</div>
            </button>
            <div class="avatar-menu" id="avatar-menu">
              <div class="avatar-menu__email">${email}</div>
              <hr class="divider" style="margin:var(--sp-2) 0">
              <button class="avatar-menu__item" id="logout-btn">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  `
}

// ── CSS ──────────────────────────────────────────────
const style = document.createElement('style')
style.textContent = `
.navbar {
  position: sticky; top: 0; z-index: var(--z-raised);
  background: rgba(247,246,243,0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  height: 60px;
}
.navbar__inner {
  display: flex; align-items: center;
  justify-content: space-between;
  height: 100%;
}
.navbar__nav { display: flex; gap: var(--sp-1); }
.navbar__link {
  padding: 6px 12px; border-radius: var(--radius-md);
  font-size: var(--text-sm); font-weight: 500;
  color: var(--text-secondary);
  transition: background var(--t-fast), color var(--t-fast);
}
.navbar__link:hover { background: var(--bg-elevated); color: var(--text-primary); }
.navbar__user { position: relative; }
.avatar-wrapper { position: relative; }
.avatar-btn {
  display: flex; align-items: center;
  border-radius: var(--radius-full);
  padding: 2px; cursor: pointer;
}
.avatar {
  width: 34px; height: 34px;
  border-radius: var(--radius-full);
  background: var(--text-primary);
  color: var(--bg);
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-xs); font-weight: 600;
  letter-spacing: 0.05em;
}
.avatar-menu {
  position: absolute; top: calc(100% + 8px); right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--sp-3);
  min-width: 200px;
  box-shadow: var(--shadow-md);
  display: none;
  z-index: var(--z-overlay);
}
.avatar-menu.visible { display: block; animation: fadeIn var(--t-fast) var(--ease-out); }
.avatar-menu__email { font-size: var(--text-xs); color: var(--text-muted); padding: 4px var(--sp-2); }
.avatar-menu__item {
  width: 100%; display: flex; align-items: center; gap: var(--sp-2);
  padding: 8px var(--sp-2); border-radius: var(--radius-sm);
  font-size: var(--text-sm); color: var(--text-secondary); cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast);
}
.avatar-menu__item:hover { background: var(--bg-elevated); color: var(--text-primary); }
`
document.head.appendChild(style)

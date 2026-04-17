// ─────────────────────────────────────────────────────
//  lib/router.js  —  Minimal SPA hash router
// ─────────────────────────────────────────────────────

const routes = {}
let currentCleanup = null

export function route(path, handler) {
  routes[path] = handler
}

export function navigate(path) {
  history.pushState({}, '', path)
  dispatch(path)
}

function dispatch(path) {
  if (currentCleanup) { currentCleanup(); currentCleanup = null }

  // Try exact match
  if (routes[path]) {
    currentCleanup = routes[path]() || null
    return
  }

  // Try pattern match (e.g. /editor/:id, /p/:slug)
  for (const pattern of Object.keys(routes)) {
    const regex = new RegExp('^' + pattern.replace(/:([^/]+)/g, '([^/]+)') + '$')
    const match = path.match(regex)
    if (match) {
      const paramNames = [...pattern.matchAll(/:([^/]+)/g)].map(m => m[1])
      const params = Object.fromEntries(paramNames.map((n, i) => [n, match[i + 1]]))
      currentCleanup = routes[pattern](params) || null
      return
    }
  }

  // Fallback → 404 or home
  navigate('/')
}

export function startRouter() {
  window.addEventListener('popstate', () => dispatch(location.pathname))
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-link]')
    if (a) {
      e.preventDefault()
      navigate(a.dataset.link)
    }
  })
  dispatch(location.pathname)
}

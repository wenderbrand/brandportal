// ─────────────────────────────────────────────────────
//  main.js  —  Entry point + Router setup
// ─────────────────────────────────────────────────────
import './src/styles/global.css'

import { route, startRouter } from './src/lib/router.js'

import { renderLanding }  from './src/pages/landing.js'
import { renderLogin, renderRegister, renderRecover } from './src/pages/auth.js'
import { renderDashboard } from './src/pages/dashboard.js'
import { renderEditor }   from './src/pages/editor.js'
import { renderPortal }   from './src/pages/portal.js'

// ── Routes ───────────────────────────────────────────
route('/',           renderLanding)
route('/login',      renderLogin)
route('/register',   renderRegister)
route('/recover',    renderRecover)
route('/dashboard',  renderDashboard)
route('/editor/:id', renderEditor)
route('/p/:slug',    renderPortal)

// ── Start ────────────────────────────────────────────
startRouter()

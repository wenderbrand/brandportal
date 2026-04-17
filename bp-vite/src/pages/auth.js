import { mount, toast } from '../lib/utils.js'
import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'

function authShell(mode) {
  const isLogin = mode === 'login', isRegister = mode === 'register', isRecover = mode === 'recover'
  mount(`
    <div class="auth-page">
      <div class="auth-bg-glow"></div>
      <a data-link="/" class="auth-back">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Voltar
      </a>
      <div class="auth-card">
        <div class="auth-brand">
          <span class="logotype">Brand<em>Portal</em></span>
        </div>
        <h1 class="auth-title">
          ${isLogin ? 'Boas-vindas de volta' : isRegister ? 'Criar sua conta' : 'Recuperar acesso'}
        </h1>
        <p class="auth-sub">
          ${isLogin ? 'Entre para continuar no seu espaço.' : isRegister ? 'Comece gratuitamente, sem cartão.' : 'Enviaremos um link para seu e-mail.'}
        </p>
        <form id="auth-form" class="auth-form" novalidate>
          <div class="field">
            <label class="label" for="email">E-mail</label>
            <input class="input" type="email" id="email" placeholder="voce@email.com" required autocomplete="email">
          </div>
          ${!isRecover ? `
          <div class="field">
            <label class="label" for="password">Senha</label>
            <input class="input" type="password" id="password" placeholder="${isLogin?'••••••••':'Mínimo 8 caracteres'}" required autocomplete="${isLogin?'current-password':'new-password'}">
          </div>` : ''}
          <button class="btn btn-accent" style="width:100%;justify-content:center;margin-top:var(--sp-2)" type="submit" id="submit-btn">
            ${isLogin ? 'Entrar' : isRegister ? 'Criar conta' : 'Enviar link'}
          </button>
        </form>
        <div class="auth-footer">
          ${isLogin ? `<a data-link="/recover" class="auth-link">Esqueci a senha</a><span>·</span><a data-link="/register" class="auth-link">Criar conta</a>`
            : isRegister ? `<span>Já tem conta?</span><a data-link="/login" class="auth-link">Entrar</a>`
            : `<a data-link="/login" class="auth-link">Voltar para login</a>`}
        </div>
      </div>
    </div>
  `)

  document.getElementById('auth-form').addEventListener('submit', async e => {
    e.preventDefault()
    const btn = document.getElementById('submit-btn')
    const email = document.getElementById('email').value.trim()
    const pass = document.getElementById('password')?.value
    btn.disabled = true; btn.textContent = 'Aguarde...'
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (error) throw error
        toast('Bem-vindo de volta!', 'success')
        navigate('/dashboard')
      } else if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password: pass })
        if (error) throw error
        toast('Conta criada!', 'success')
        navigate('/dashboard')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
        toast('Link enviado para ' + email, 'success')
      }
    } catch (err) {
      toast(err?.message || 'Erro ao autenticar.', 'error')
      btn.disabled = false
      btn.textContent = isLogin ? 'Entrar' : isRegister ? 'Criar conta' : 'Enviar link'
    }
  })
}

export function renderLogin()    { authShell('login') }
export function renderRegister() { authShell('register') }
export function renderRecover()  { authShell('recover') }

const style = document.createElement('style')
style.textContent = `
.auth-page { min-height:100dvh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:var(--sp-6); position:relative; overflow:hidden; }
.auth-bg-glow { position:absolute; top:-200px; left:50%; transform:translateX(-50%); width:600px; height:600px; background:radial-gradient(ellipse, rgba(200,132,58,0.08) 0%, transparent 70%); pointer-events:none; }
.auth-back { position:absolute; top:var(--sp-6); left:var(--sp-6); display:flex; align-items:center; gap:var(--sp-2); font-size:var(--text-sm); color:var(--text-3); transition:color var(--t-fast); }
.auth-back:hover { color:var(--text-1); }
.auth-card { width:100%; max-width:400px; background:var(--bg-1); border:1px solid var(--border-md); border-radius:var(--r-2xl); padding:var(--sp-10); position:relative; }
.auth-brand { margin-bottom:var(--sp-6); }
.auth-title { font-family:var(--font-brand); font-size:var(--text-2xl); color:var(--text-1); margin-bottom:var(--sp-2); }
.auth-sub { font-size:var(--text-sm); color:var(--text-2); margin-bottom:var(--sp-8); line-height:1.6; }
.auth-form { display:flex; flex-direction:column; gap:var(--sp-4); }
.auth-footer { display:flex; align-items:center; gap:var(--sp-3); margin-top:var(--sp-6); font-size:var(--text-sm); color:var(--text-3); justify-content:center; }
.auth-link { color:var(--accent-2); font-weight:500; transition:color var(--t-fast); }
.auth-link:hover { color:var(--accent); }
`
document.head.appendChild(style)

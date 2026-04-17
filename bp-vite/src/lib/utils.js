// ─────────────────────────────────────────────────────
//  lib/utils.js  —  Shared helpers
// ─────────────────────────────────────────────────────

// ── Toast notifications ──────────────────────────────
let toastContainer = null

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.className = 'toast-container'
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

export function toast(message, type = 'default', duration = 3000) {
  const c = getToastContainer()
  const el = document.createElement('div')
  el.className = `toast${type !== 'default' ? ` toast-${type}` : ''}`
  el.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      ${type === 'error'
        ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
        : '<polyline points="20 6 9 17 4 12"/>'}
    </svg>
    <span>${message}</span>
  `
  c.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transform = 'translateX(24px)'
    el.style.transition = 'opacity 200ms, transform 200ms'
    setTimeout(() => el.remove(), 220)
  }, duration)
}

// ── Slug generation ──────────────────────────────────
export function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    + '-' + Math.random().toString(36).slice(2, 7)
}

// ── Hex validation ───────────────────────────────────
export function isValidHex(hex) {
  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex)
}

// ── Copy to clipboard ────────────────────────────────
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta); ta.select()
    document.execCommand('copy'); ta.remove()
    return true
  }
}

// ── Debounce ─────────────────────────────────────────
export function debounce(fn, ms = 300) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

// ── Upload file to Supabase Storage ─────────────────
export async function uploadFile(supabase, bucket, path, file) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return urlData.publicUrl
}

// ── Format file size ─────────────────────────────────
export function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ── Render helper ────────────────────────────────────
export function render(selector, html) {
  const el = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector
  if (el) el.innerHTML = html
  return el
}

// ── Mount component into app shell ───────────────────
export function mount(html) {
  const app = document.getElementById('app')
  app.innerHTML = `<div class="page-enter">${html}</div>`
}

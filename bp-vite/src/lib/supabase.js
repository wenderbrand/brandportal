// ─────────────────────────────────────────────────────
//  lib/supabase.js  —  Supabase client singleton
//  Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
//  in your .env file
// ─────────────────────────────────────────────────────

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || ''
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Minimal Supabase REST client (no SDK dependency required)
// Swap for @supabase/supabase-js if preferred
class SupabaseClient {
  constructor(url, key) {
    this.url = url
    this.key = key
  }

  _headers(extra = {}) {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this._getToken() || this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...extra
    }
  }

  _getToken() {
    try {
      const session = JSON.parse(localStorage.getItem('bp_session') || 'null')
      return session?.access_token || null
    } catch { return null }
  }

  // ── Auth ──────────────────────────────────────────
  auth = {
    signUp: async ({ email, password }) => {
      const r = await fetch(`${this.url}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'apikey': this.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await r.json()
      if (!r.ok) return { data: null, error: data }
      if (data.session) localStorage.setItem('bp_session', JSON.stringify(data.session))
      return { data, error: null }
    },

    signInWithPassword: async ({ email, password }) => {
      const r = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': this.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await r.json()
      if (!r.ok) return { data: null, error: data }
      localStorage.setItem('bp_session', JSON.stringify(data))
      return { data, error: null }
    },

    signOut: async () => {
      const token = this._getToken()
      if (token) {
        await fetch(`${this.url}/auth/v1/logout`, {
          method: 'POST',
          headers: { 'apikey': this.key, 'Authorization': `Bearer ${token}` }
        })
      }
      localStorage.removeItem('bp_session')
      return { error: null }
    },

    getUser: () => {
      try {
        const session = JSON.parse(localStorage.getItem('bp_session') || 'null')
        if (!session?.user) return null
        // Check expiry
        if (session.expires_at && Date.now() / 1000 > session.expires_at) {
          localStorage.removeItem('bp_session')
          return null
        }
        return session.user
      } catch { return null }
    },

    resetPasswordForEmail: async (email) => {
      const r = await fetch(`${this.url}/auth/v1/recover`, {
        method: 'POST',
        headers: { 'apikey': this.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await r.json()
      return r.ok ? { error: null } : { error: data }
    }
  }

  // ── Database ──────────────────────────────────────
  from(table) {
    return new QueryBuilder(this, table)
  }

  // ── Storage ───────────────────────────────────────
  storage = {
    from: (bucket) => ({
      upload: async (path, file, options = {}) => {
        const contentType = file.type || 'application/octet-stream'
        const r = await fetch(`${this.url}/storage/v1/object/${bucket}/${path}`, {
          method: 'POST',
          headers: {
            'apikey': this.key,
            'Authorization': `Bearer ${this._getToken() || this.key}`,
            'Content-Type': contentType,
            'x-upsert': options.upsert ? 'true' : 'false'
          },
          body: file
        })
        const data = await r.json()
        return r.ok ? { data, error: null } : { data: null, error: data }
      },
      getPublicUrl: (path) => ({
        data: { publicUrl: `${this.url}/storage/v1/object/public/${bucket}/${path}` }
      })
    })
  }
}

class QueryBuilder {
  constructor(client, table) {
    this._client = client
    this._table  = table
    this._filters = []
    this._select  = '*'
    this._order   = null
    this._limit   = null
    this._single  = false
  }

  select(cols = '*') { this._select = cols; return this }
  eq(col, val)        { this._filters.push(`${col}=eq.${val}`); return this }
  order(col, { ascending = true } = {}) {
    this._order = `${col}.${ascending ? 'asc' : 'desc'}`; return this
  }
  limit(n) { this._limit = n; return this }
  single()  { this._single = true; return this }

  _buildUrl(extra = '') {
    const base = `${this._client.url}/rest/v1/${this._table}`
    const params = new URLSearchParams({ select: this._select })
    this._filters.forEach(f => {
      const [k, v] = f.split('=')
      params.append(k, v)
    })
    if (this._order) params.append('order', this._order)
    if (this._limit) params.append('limit', this._limit)
    return `${base}${extra}?${params}`
  }

  async _req(method, body) {
    const headers = this._client._headers()
    if (this._single) headers['Accept'] = 'application/vnd.pgrst.object+json'
    const r = await fetch(this._buildUrl(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })
    if (r.status === 204) return { data: null, error: null }
    const data = await r.json()
    return r.ok ? { data, error: null } : { data: null, error: data }
  }

  then(resolve, reject) {
    return this._req('GET').then(resolve, reject)
  }

  async insert(body)  { return this._req('POST', body) }
  async update(body)  { return this._req('PATCH', body) }
  async delete()      { return this._req('DELETE') }
  async upsert(body)  {
    const headers = this._client._headers({ 'Prefer': 'return=representation,resolution=merge-duplicates' })
    const r = await fetch(this._buildUrl(), {
      method: 'POST', headers,
      body: JSON.stringify(body)
    })
    const data = await r.json()
    return r.ok ? { data, error: null } : { data: null, error: data }
  }
}

export const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_KEY)

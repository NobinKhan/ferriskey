export type JwtToken = {
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
  id_token?: string
}

export type TokenIntrospectionResponse = {
  active: boolean
  scope?: string
  client_id?: string
  username?: string
  sub?: string
  token_type?: string
  exp?: number
  iat?: number
  nbf?: number
  aud?: string
  iss?: string
  jti?: string
  realm?: string
}

export type FerriskeyConfig = {
  apiOrigin: string // e.g. http://localhost:8080
  rootPath: string // e.g. '' or '/api'
  realm: string
  clientId: string
  clientSecret: string
  scope: string
  redirectUri: string
}

function normalizeRootPath(rootPath: string): string {
  const t = rootPath.trim()
  if (!t || t === '/') return ''
  if (!t.startsWith('/')) return `/${t}`
  return t.replace(/\/+$/, '')
}

export function apiBase(cfg: FerriskeyConfig): string {
  return `${cfg.apiOrigin.replace(/\/+$/, '')}${normalizeRootPath(cfg.rootPath)}`
}

export function authorizeUrl(cfg: FerriskeyConfig, state: string): string {
  const base = apiBase(cfg)
  const url = new URL(`${base}/realms/${encodeURIComponent(cfg.realm)}/protocol/openid-connect/auth`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', cfg.clientId)
  url.searchParams.set('redirect_uri', cfg.redirectUri)
  url.searchParams.set('state', state)
  if (cfg.scope.trim()) url.searchParams.set('scope', cfg.scope.trim())
  return url.toString()
}

async function postForm<T>(
  url: string,
  body: Record<string, string | undefined>,
  headers?: Record<string, string>
): Promise<T> {
  const form = new URLSearchParams()
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue
    if (v === '') continue
    form.set(k, v)
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      ...(headers ?? {})
    },
    body: form.toString()
  })

  const text = await res.text()
  let json: any = undefined
  try {
    json = text ? JSON.parse(text) : undefined
  } catch {
    // ignore
  }

  if (!res.ok) {
    const detail = json ? JSON.stringify(json, null, 2) : text
    throw new Error(`Token endpoint error (HTTP ${res.status}):\n${detail}`)
  }

  return json as T
}

export async function exchangeCodeForToken(cfg: FerriskeyConfig, code: string): Promise<JwtToken> {
  const base = apiBase(cfg)
  const url = `${base}/realms/${encodeURIComponent(cfg.realm)}/protocol/openid-connect/token`

  return await postForm<JwtToken>(url, {
    grant_type: 'authorization_code',
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret || undefined,
    code
  })
}

export async function refreshToken(cfg: FerriskeyConfig, refreshToken: string): Promise<JwtToken> {
  const base = apiBase(cfg)
  const url = `${base}/realms/${encodeURIComponent(cfg.realm)}/protocol/openid-connect/token`

  return await postForm<JwtToken>(url, {
    grant_type: 'refresh_token',
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret || undefined,
    refresh_token: refreshToken,
    scope: cfg.scope.trim() || undefined
  })
}

function basicAuthHeaderValue(clientId: string, clientSecret: string): string {
  // Browser base64 helper; Ferriskey expects RFC7617-ish `Basic base64(clientId:clientSecret)`.
  const raw = `${clientId}:${clientSecret}`
  return `Basic ${btoa(raw)}`
}

export async function introspectToken(
  cfg: FerriskeyConfig,
  token: string,
  tokenTypeHint: 'access_token' | 'refresh_token' = 'access_token'
): Promise<TokenIntrospectionResponse> {
  const base = apiBase(cfg)
  const url = `${base}/realms/${encodeURIComponent(cfg.realm)}/protocol/openid-connect/token/introspect`

  if (!cfg.clientId.trim() || !cfg.clientSecret.trim()) {
    throw new Error('Introspection requires a confidential client: set client_id and client_secret.')
  }

  return await postForm<TokenIntrospectionResponse>(
    url,
    {
      token,
      token_type_hint: tokenTypeHint
    },
    {
      authorization: basicAuthHeaderValue(cfg.clientId, cfg.clientSecret)
    }
  )
}

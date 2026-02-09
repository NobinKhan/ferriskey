import React, { useEffect, useMemo, useState } from 'react'
import {
  type FerriskeyConfig,
  type JwtToken,
  type TokenIntrospectionResponse,
  apiBase,
  authorizeUrl,
  exchangeCodeForToken,
  introspectToken as doIntrospect,
  refreshToken as doRefreshToken
} from './ferriskey'

const LS_KEY = 'ferriskey_token_test_cfg_v1'
const SS_STATE_KEY = 'ferriskey_token_test_state'
const SS_CFG_KEY = 'ferriskey_token_test_cfg_at_auth'

function randomState(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function defaultRedirectUri(): string {
  // Keep this simple so Ferriskey's redirect builder (`{redirect_uri}?code=...&state=...`) works.
  return `${window.location.origin}/`
}

function loadCfg(): FerriskeyConfig {
  const raw = localStorage.getItem(LS_KEY)
  if (raw) {
    try {
      const v = JSON.parse(raw)
      return {
        apiOrigin: String(v.apiOrigin ?? 'http://localhost:8080'),
        rootPath: String(v.rootPath ?? ''),
        realm: String(v.realm ?? 'master'),
        clientId: String(v.clientId ?? ''),
        clientSecret: String(v.clientSecret ?? ''),
        scope: String(v.scope ?? 'openid'),
        redirectUri: String(v.redirectUri ?? defaultRedirectUri())
      }
    } catch {
      // ignore
    }
  }

  return {
    apiOrigin: 'http://localhost:8080',
    rootPath: '',
    realm: 'master',
    clientId: '',
    clientSecret: '',
    scope: 'openid',
    redirectUri: defaultRedirectUri()
  }
}

function saveCfg(cfg: FerriskeyConfig) {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg))
}

export default function App() {
  const [cfg, setCfg] = useState<FerriskeyConfig>(() => loadCfg())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [token, setToken] = useState<JwtToken | null>(null)
  const [introspection, setIntrospection] = useState<TokenIntrospectionResponse | null>(null)

  const computed = useMemo(() => {
    const base = apiBase(cfg)
    const auth = `${base}/realms/${encodeURIComponent(cfg.realm)}/protocol/openid-connect/auth`
    const tok = `${base}/realms/${encodeURIComponent(cfg.realm)}/protocol/openid-connect/token`
    return { base, auth, tok }
  }, [cfg])

  useEffect(() => {
    saveCfg(cfg)
  }, [cfg])

  useEffect(() => {
    // Handle redirect back from Ferriskey: ?code=...&state=...
    const qs = new URLSearchParams(window.location.search)
    const code = qs.get('code')
    const returnedState = qs.get('state')
    const error = qs.get('error')
    const errorDescription = qs.get('error_description')

    if (!code && !error) return

    ;(async () => {
      setErr(null)

      try {
        if (error) {
          throw new Error(`${error}${errorDescription ? `: ${errorDescription}` : ''}`)
        }

        const expectedState = sessionStorage.getItem(SS_STATE_KEY)
        if (!expectedState) {
          throw new Error('Missing expected state in sessionStorage; start login again.')
        }
        if (!returnedState || returnedState !== expectedState) {
          throw new Error(`State mismatch. expected=${expectedState} got=${returnedState ?? '(missing)'}`)
        }

        const cfgAtAuthRaw = sessionStorage.getItem(SS_CFG_KEY)
        const cfgAtAuth: FerriskeyConfig = cfgAtAuthRaw ? JSON.parse(cfgAtAuthRaw) : cfg
        setCfg(cfgAtAuth)

        setBusy(true)
        const t = await exchangeCodeForToken(cfgAtAuth, code!)
        setToken(t)
        setIntrospection(null)

        // Clean URL so tokens don't get re-requested on refresh.
        window.history.replaceState({}, '', window.location.pathname)
      } catch (e: any) {
        setErr(e?.message ?? String(e))
      } finally {
        setBusy(false)
      }
    })()
  }, [])

  async function onLogin() {
    setErr(null)
    setToken(null)
    setIntrospection(null)

    if (!cfg.clientId.trim()) {
      setErr('client_id is required')
      return
    }
    if (!cfg.redirectUri.trim()) {
      setErr('redirect_uri is required')
      return
    }

    const state = randomState()
    sessionStorage.setItem(SS_STATE_KEY, state)
    sessionStorage.setItem(SS_CFG_KEY, JSON.stringify(cfg))

    window.location.href = authorizeUrl(cfg, state)
  }

  async function onRefresh() {
    if (!token?.refresh_token) return

    setErr(null)
    setBusy(true)
    try {
      const t = await doRefreshToken(cfg, token.refresh_token)
      setToken(t)
      setIntrospection(null)
    } catch (e: any) {
      setErr(e?.message ?? String(e))
    } finally {
      setBusy(false)
    }
  }

  async function onIntrospectAccessToken() {
    if (!token?.access_token) return

    setErr(null)
    setBusy(true)
    try {
      const r = await doIntrospect(cfg, token.access_token, 'access_token')
      setIntrospection(r)
    } catch (e: any) {
      setErr(e?.message ?? String(e))
    } finally {
      setBusy(false)
    }
  }

  function onClear() {
    setErr(null)
    setToken(null)
    setIntrospection(null)
    sessionStorage.removeItem(SS_STATE_KEY)
    sessionStorage.removeItem(SS_CFG_KEY)
    window.history.replaceState({}, '', window.location.pathname)
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="hero__kicker">Ferriskey</div>
        <h1 className="hero__title">Token Test Frontend</h1>
        <p className="hero__sub">
          Enter client details, redirect to Ferriskey login, then exchange the auth code for access and refresh tokens.
        </p>
      </header>

      <main className="grid">
        <section className="card">
          <h2>Client Input</h2>

          <div className="form">
            <label>
              <span>API origin</span>
              <input
                value={cfg.apiOrigin}
                onChange={(e) => setCfg((c) => ({ ...c, apiOrigin: e.target.value }))}
                placeholder="http://localhost:8080"
              />
            </label>

            <label>
              <span>Root path</span>
              <input
                value={cfg.rootPath}
                onChange={(e) => setCfg((c) => ({ ...c, rootPath: e.target.value }))}
                placeholder="(empty) or /api"
              />
            </label>

            <label>
              <span>Realm</span>
              <input
                value={cfg.realm}
                onChange={(e) => setCfg((c) => ({ ...c, realm: e.target.value }))}
                placeholder="master"
              />
            </label>

            <label>
              <span>Client ID</span>
              <input value={cfg.clientId} onChange={(e) => setCfg((c) => ({ ...c, clientId: e.target.value }))} />
            </label>

            <label>
              <span>Client secret (optional)</span>
              <input
                value={cfg.clientSecret}
                onChange={(e) => setCfg((c) => ({ ...c, clientSecret: e.target.value }))}
                placeholder="(leave empty if not required)"
              />
            </label>

            <label>
              <span>Scope</span>
              <input
                value={cfg.scope}
                onChange={(e) => setCfg((c) => ({ ...c, scope: e.target.value }))}
                placeholder="openid"
              />
            </label>

            <label>
              <span>Redirect URI</span>
              <input
                value={cfg.redirectUri}
                onChange={(e) => setCfg((c) => ({ ...c, redirectUri: e.target.value }))}
                placeholder={defaultRedirectUri()}
              />
            </label>
          </div>

          <div className="actions">
            <button disabled={busy} onClick={onLogin}>
              {busy ? 'Working…' : 'Login via Ferriskey'}
            </button>
            <button className="secondary" disabled={busy} onClick={onClear}>
              Clear
            </button>
          </div>

          <details className="details">
            <summary>Computed endpoints</summary>
            <div className="mono">
              <div>
                <div className="muted">Base</div>
                <div>{computed.base}</div>
              </div>
              <div>
                <div className="muted">Authorize</div>
                <div>{computed.auth}</div>
              </div>
              <div>
                <div className="muted">Token</div>
                <div>{computed.tok}</div>
              </div>
            </div>
          </details>

          <p className="warn">
            Note: this is a test tool. If you enter a client secret here, it lives in your browser (localStorage).
          </p>
        </section>

        <section className="card">
          <h2>Tokens</h2>

          {err ? (
            <pre className="error">{err}</pre>
          ) : token ? (
            <>
              <div className="actions">
                <button disabled={busy} onClick={onRefresh}>
                  Refresh token
                </button>
                <button disabled={busy} onClick={onIntrospectAccessToken}>
                  Introspect access token
                </button>
              </div>

              <div className="kv">
                <div className="k">token_type</div>
                <div className="v mono">{token.token_type}</div>

                <div className="k">expires_in</div>
                <div className="v mono">{token.expires_in}</div>

                <div className="k">access_token</div>
                <div className="v">
                  <textarea readOnly value={token.access_token} />
                </div>

                <div className="k">refresh_token</div>
                <div className="v">
                  <textarea readOnly value={token.refresh_token} />
                </div>

                {token.id_token ? (
                  <>
                    <div className="k">id_token</div>
                    <div className="v">
                      <textarea readOnly value={token.id_token} />
                    </div>
                  </>
                ) : null}
              </div>

              <div className="divider" />

              <h3 className="subhead">Introspection</h3>
              {introspection ? (
                <pre className="introspect mono">{JSON.stringify(introspection, null, 2)}</pre>
              ) : (
                <div className="empty">No introspection yet. Click “Introspect access token”.</div>
              )}
            </>
          ) : (
            <div className="empty">
              No tokens yet. Click “Login via Ferriskey”, complete login, then you’ll be redirected back here.
            </div>
          )}
        </section>
      </main>

      <footer className="footer">Ferriskey OAuth flow used: `response_type=code` and POST `/protocol/openid-connect/token`.</footer>
    </div>
  )
}

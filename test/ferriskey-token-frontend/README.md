# Ferriskey Token Test Frontend

Minimal React + Vite test UI that:

1. Redirects the browser to Ferriskey `/protocol/openid-connect/auth`
2. Receives the redirect back with `?code=...&state=...`
3. Exchanges the code for an access + refresh token via `/protocol/openid-connect/token`
4. Displays the tokens and lets you refresh

## Run

```bash
cd test/ferriskey-token-frontend

# pick one
bun install
# or: pnpm install
# or: npm install

bun run dev
# or: pnpm dev
# or: npm run dev
```

Then open `http://localhost:5173/`.

## Ferriskey Setup Notes

- CORS: Ferriskey only allows origins from its `allowed_origins` config.
  - Add `http://localhost:5173` to `allowed_origins`.
- Redirect URIs: your Ferriskey client must allow the exact redirect URI you enter.
  - Default used by this app: `http://localhost:5173/`
- OAuth params used by this app:
  - Authorize request: `response_type=code`, `client_id`, `redirect_uri`, `scope` (optional), `state`
  - Token request: `grant_type=authorization_code`, `client_id`, `client_secret` (optional), `code`

## Security

This is a test tool.

If you enter a `client_secret`, it is stored in your browser `localStorage` so the app can exchange the code for tokens after redirect.

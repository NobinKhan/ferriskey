---
name: Dashboard Architecture
description: Understanding the SvelteKit dashboard architecture, auth flow, API patterns, and migration status from the old React frontend
---

# FerrisKey SvelteKit Dashboard Architecture

## Project Structure

```
dashboard/
├── src/
│   ├── app.css           # Global design tokens (CSS variables, light/dark themes)
│   ├── app.html          # HTML shell
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts    # apiRequest<T>() generic fetch wrapper + ApiError class
│   │   │   └── config.ts    # resolveApiBase() — uses PUBLIC_API_URL env or falls back to origin/api
│   │   ├── auth/
│   │   │   └── session.ts   # JWT decode, getSessionUser() extracts claims from FERRISKEY_IDENTITY cookie
│   │   ├── components/      # Reusable Svelte 5 components
│   │   ├── config/
│   │   │   └── navigation.ts # Sidebar nav groups (Core, Configuration, Security)
│   │   ├── query/
│   │   │   └── client.ts    # TanStack Query client singleton
│   │   ├── server/
│   │   │   └── realm-api.ts # Server-side loadRealmResource() with Bearer token
│   │   └── utils/           # classnames, ripple action
│   └── routes/
│       ├── +layout.svelte    # Root layout (TanStack QueryClientProvider)
│       ├── +page.server.ts   # Redirects / → /realms/master/overview
│       └── realms/[realm]/
│           ├── +page.server.ts  # Redirects to /overview
│           ├── (auth)/          # Auth pages (no sidebar, no auth guard)
│           │   └── authentication/
│           │       ├── login/
│           │       ├── otp/
│           │       └── required-action/
│           └── (app)/           # App pages (sidebar, auth guard)
│               ├── +layout.server.ts  # Auth guard: checks FERRISKEY_IDENTITY cookie
│               ├── +layout.svelte     # AppShell wrapper
│               ├── overview/
│               ├── users/
│               ├── clients/
│               ├── roles/
│               ├── client-scopes/     # Placeholder
│               ├── realm-settings/    # Placeholder
│               ├── identity-providers/# Placeholder
│               ├── user-federation/   # Placeholder
│               ├── seawatch/          # Hardcoded demo data
│               └── compass/           # Hardcoded demo data
```

## Auth Flow

> All API calls go through the SvelteKit proxy (`/api/*` → backend) via `hooks.server.ts`.
> This keeps all cookies (`FERRISKEY_SESSION`, `FERRISKEY_IDENTITY`) on the dashboard domain.

1. User visits any `(app)` route → `+layout.server.ts` checks `FERRISKEY_IDENTITY` cookie
2. If no cookie → redirect to `/realms/{realm}/authentication/login`
3. Login `+page.server.ts` redirects to `/api/realms/{realm}/protocol/openid-connect/auth` (proxy)
4. Proxy forwards to backend, backend creates `FERRISKEY_SESSION` cookie
5. Proxy strips cookie domain, browser stores cookie on dashboard domain
6. Backend redirects to `{WEBAPP_URL}/realms/{realm}/authentication/login?client_id=...`
7. Login form POSTs to `/api/realms/{realm}/login-actions/authenticate` (proxy)
8. Backend validates session cookie, on success sets `FERRISKEY_IDENTITY` cookie
9. Proxy strips domain, browser stores FERRISKEY_IDENTITY on dashboard domain

### Key Files
- `hooks.server.ts` — API proxy (uses `BACKEND_URL` env var, default: `http://localhost:3333`)
- `api/.env` — Must set `WEBAPP_URL=http://localhost:5173` for the dashboard
- `dashboard/.env` — Uses `BACKEND_URL` (not `PUBLIC_API_URL`)

## API Patterns

### Client-side API calls (from .svelte files)
```typescript
const response = await apiRequest<T>({
  url: page.url,
  fetcher: fetch,
  path: `/realms/${realm}/some-endpoint`,
  init: { method: 'POST', body: JSON.stringify(data) }
});
```

### Server-side data loading (from +page.server.ts)
```typescript
const response = await loadRealmResource<ResponseType>(
  { cookies, fetch, params, url },
  `/realms/${params.realm}/endpoint`
);
```

## Design System

- CSS variables in `:root` and `:root[data-theme='dark']`
- Font: Public Sans (body), DM Sans (display headings)
- Key classes: `.glass-panel`, `.grid-auto`, `.status-dot`, `.page-shell`
- Components use scoped `<style>` blocks
- Material-style `ripple` action for interactive elements

## Dependencies

- Svelte 5, SvelteKit 2, Vite 7
- @tanstack/svelte-query for server state
- lucide-svelte for icons
- zod for validation (not yet used in forms)
- clsx for class merging

## Environment Variables

### Dashboard (`dashboard/.env`)
- `BACKEND_URL` — Server-side proxy target (default: `http://localhost:3333`)
- `PUBLIC_API_URL` — Optional override for API base (defaults to `/api` on same origin)

### Backend (`api/.env`)
- `WEBAPP_URL` — Must point to SvelteKit dashboard (e.g., `http://localhost:5173`)
- `ALLOWED_ORIGINS` — Must include dashboard origin

## Migration Status (as of 2026-03-08)

**Completed (~25-30%)**:
- Architecture, auth flow, app shell, design system
- Read-only pages: overview, users, clients, roles

**Missing (~70-75%)**:
- All CRUD operations (create/edit/delete for users, clients, roles)
- Detail pages with tabs
- Entire modules: webhooks, trident (MFA), credentials
- Real data for seawatch and compass pages
- Realm switcher, global search, notifications, toasts
- Shared type definitions, form validation, confirmation dialogs

# FerrisKey Dashboard Migration: Task Tracker

## Phase 1: Analysis & Planning ✅
- [x] Old/new frontend structure analysis, auth flow, login failure root cause

## Phase 2: Fix Critical Login Issue ✅
- [x] API proxy (`hooks.server.ts`), env configs, logout URL fix

## Phase 3: Core CRUD Operations ✅
- [x] Shared types, Dialog, Toaster, ConfirmDelete components
- [x] Users: CRUD + search/filter/metrics/detail-sidebar
- [x] Clients: CRUD + protocol/type + search/filter/metrics
- [x] Roles: CRUD + permissions + search/filter/metrics
- [x] User detail page: Profile/Credentials/Roles/Permissions tabs
- [x] Client detail page: Settings/Redirect URIs/Post-Logout URIs/Roles tabs
- [x] View links from list pages to detail pages

## Phase 4: Feature Modules ✅
- [x] Realm Settings: Login toggles, magic link, compass, signing algo
- [x] SeaWatch: Wired to real API (event timeline + detail view)
- [x] Webhooks: Full CRUD (26 triggers, create/edit/delete)
- [x] Navigation: All pages linked in sidebar
- [x] Identity Providers: CRUD (Google, GitHub, OIDC, SAML, etc.)
- [x] User Federation: CRUD + test-connection + sync-users (LDAP, Kerberos, AD)
- [x] Compass: Stats + flow timeline wired to real API
- [x] Client Scopes: Full CRUD (scopes + protocol mappers via aegis API)

## Phase 5: Additional Features ✅
- [x] Realm switcher: Dropdown using `get_user_realms` API

## Verification ✅
- [x] `svelte-check`: 0 errors, 1 warning (cosmetic CSS)
- [x] `npm run build`: Success (7.32s, adapter-node)
- [ ] Browser testing (needs PostgreSQL + backend running — user will need to stop system PG or use Docker)

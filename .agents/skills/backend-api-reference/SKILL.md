---
name: Backend API Reference
description: Key backend API endpoints and patterns used by the SvelteKit dashboard
---

# FerrisKey Backend API Reference

## Server Configuration

- Default port: `3333`
- Default `webapp_url`: `http://localhost:5555` (configurable via env)
- Default `ADMIN_USERNAME`/`ADMIN_PASSWORD`: `admin`/`admin`
- CORS allowed origins: configurable via `ALLOWED_ORIGINS`

## Authentication Flow Endpoints

### 1. OAuth Authorize (initiates login)
```
GET /realms/{realm}/protocol/openid-connect/auth
  ?response_type=code
  &client_id=security-admin-console
  &redirect_uri={dashboard_url}/realms/{realm}/overview
  &scope=openid profile email
```
- Creates auth session, sets `FERRISKEY_SESSION` cookie
- Redirects to `{webapp_url}/realms/{realm}/authentication/login?client_id=...&redirect_uri=...`

### 2. Authenticate (login form submission)
```
POST /realms/{realm}/login-actions/authenticate?client_id=security-admin-console
Body: { "username": "admin", "password": "admin" }
Requires: FERRISKEY_SESSION cookie
```
Response:
```json
{
  "status": "Success" | "RequiresActions" | "RequiresOtpChallenge" | "Failed",
  "url": "redirect_url or null",
  "required_actions": ["TOTP_SETUP"] | null,
  "token": "temporary_token" | null,
  "message": "string"
}
```
On success: Sets `FERRISKEY_IDENTITY` cookie (JWT access token)

### 3. Token Exchange
```
POST /realms/{realm}/protocol/openid-connect/token
Body: grant_type=authorization_code&code=...&client_id=...
```

### 4. Logout
```
GET /realms/{realm}/protocol/openid-connect/logout
  ?client_id=security-admin-console
  &post_logout_redirect_uri={dashboard_url}/realms/{realm}/authentication/login
```

## Data Endpoints (require Bearer token)

### Users
- `GET /realms/{realm}/users` → `{ data: User[] }`
- `POST /realms/{realm}/users` → Create user
- `PUT /realms/{realm}/users/{id}` → Update user
- `DELETE /realms/{realm}/users/{id}` → Delete user

### Clients
- `GET /realms/{realm}/clients` → `{ data: Client[] }`
- `POST /realms/{realm}/clients` → Create client
- `PUT /realms/{realm}/clients/{id}` → Update client
- `DELETE /realms/{realm}/clients/{id}` → Delete client

### Roles
- `GET /realms/{realm}/roles` → `{ data: Role[] }`
- `POST /realms/{realm}/roles` → Create role
- `PUT /realms/{realm}/roles/{id}` → Update role
- `DELETE /realms/{realm}/roles/{id}` → Delete role

### Realms
- `GET /realms` → List realms
- `GET /realms/{realm}` → Get realm details

### Other API modules
- `/realms/{realm}/client-scopes/*`
- `/realms/{realm}/sea-watch/events`
- `/realms/{realm}/webhooks/*`
- `/realms/{realm}/trident/*` (MFA)
- `/realms/{realm}/credentials/*`
- `/realms/{realm}/identity-providers/*`

## Cookie Names

| Cookie | Purpose | Set By |
|--------|---------|--------|
| `FERRISKEY_SESSION` | Auth session UUID | Backend `/auth` endpoint |
| `FERRISKEY_IDENTITY` | JWT access token | Backend `/authenticate` endpoint |

## OpenAPI Spec

Available at:
- Swagger UI: `http://localhost:3333/swagger-ui`
- ReDoc: `http://localhost:3333/redoc`
- Scalar: `http://localhost:3333/scalar`
- OpenAPI JSON: `front/openapi.yaml` (generated)

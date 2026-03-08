/* ────────────────────────────────────────────────────────────
 *  Shared type definitions for API resources.
 *  Centralises the inline types that were duplicated across
 *  every +page.server.ts file.
 * ──────────────────────────────────────────────────────────── */

/* ── Users ─────────────────────────────────────────────────── */

export type UserRole = {
  id: string;
  name: string;
};

export type User = {
  client_id?: string | null;
  created_at: string;
  email: string;
  email_verified: boolean;
  enabled: boolean;
  firstname: string;
  id: string;
  lastname: string;
  required_actions: string[];
  roles?: UserRole[] | null;
  updated_at?: string | null;
  username: string;
};

export type UsersResponse = { data: User[] };
export type UserResponse = { data: User };

export type CreateUserPayload = {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  email_verified?: boolean;
};

export type UpdateUserPayload = {
  firstname: string;
  lastname: string;
  email: string;
  email_verified?: boolean;
  enabled?: boolean;
  required_actions?: string[];
};

/* ── Clients ───────────────────────────────────────────────── */

export type RedirectUri = { uri: string };

export type Client = {
  client_id: string;
  client_type: string;
  created_at: string;
  direct_access_grants_enabled: boolean;
  enabled: boolean;
  id: string;
  name: string;
  protocol: string;
  public_client: boolean;
  redirect_uris?: RedirectUri[] | null;
  secret?: string | null;
  service_account_enabled: boolean;
  updated_at: string;
};

export type ClientsResponse = { data: Client[] };
export type ClientResponse = { data: Client };

/* ── Roles ─────────────────────────────────────────────────── */

export type Role = {
  client_id?: string | null;
  description?: string | null;
  id: string;
  name: string;
  permissions: string[];
};

export type RolesResponse = { data: Role[] };
export type RoleResponse = { data: Role };

/* ── Generic ───────────────────────────────────────────────── */

export type DeleteResponse = { count: number };

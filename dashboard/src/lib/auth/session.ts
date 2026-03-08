export type SessionUser = {
  avatar: string | null;
  email: string | null;
  expiresAt: number | null;
  name: string;
  preferredUsername: string | null;
};

type JwtClaims = {
  avatar?: unknown;
  email?: unknown;
  exp?: unknown;
  name?: unknown;
  preferred_username?: unknown;
};

function decodePayload(token: string): JwtClaims | null {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = parts[1]?.replace(/-/g, '+').replace(/_/g, '/');

    if (!payload) {
      return null;
    }

    const decoded = atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='));
    const parsed = JSON.parse(decoded) as JwtClaims;

    return parsed;
  } catch {
    return null;
  }
}

function toStringOrNull(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export function getSessionUser(token: string | undefined): SessionUser | null {
  if (!token) {
    return null;
  }

  const claims = decodePayload(token);

  if (!claims) {
    return null;
  }

  const exp = typeof claims.exp === 'number' ? claims.exp * 1000 : null;

  if (exp !== null && exp <= Date.now()) {
    return null;
  }

  const preferredUsername = toStringOrNull(claims.preferred_username);
  const email = toStringOrNull(claims.email);
  const displayName =
    toStringOrNull(claims.name) ?? preferredUsername ?? email ?? 'Barrzen Admin';

  return {
    avatar: toStringOrNull(claims.avatar),
    email,
    expiresAt: exp,
    name: displayName,
    preferredUsername
  };
}

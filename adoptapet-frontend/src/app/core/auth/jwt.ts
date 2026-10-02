/** Claims signed by user-service: `sub` = username, plus `id`, `role` and `exp` (seconds). */
export interface JwtClaims {
  sub?: string;
  id?: number;
  role?: string;
  exp?: number;
}

/** Reads the payload without validating it (the backend validates; the client only needs `exp`). */
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

/** Expiry in epoch ms: the `exp` claim when present, otherwise now + `expiresIn`. */
export function expiresAt(token: string, expiresInMs: number, now = Date.now()): number {
  const exp = decodeJwt(token)?.exp;
  return exp ? exp * 1000 : now + expiresInMs;
}

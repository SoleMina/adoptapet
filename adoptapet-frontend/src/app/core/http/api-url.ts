import { environment } from '@env/environment';

/** Absolute URL of an API path: `apiUrl('/pets')` → `http://localhost:8080/api/pets`. */
export function apiUrl(path: string): string {
  return `${environment.apiUrl}${path}`;
}

/** True when the request goes to our gateway (only those carry the JWT). */
export function isApiRequest(url: string): boolean {
  return url.startsWith(environment.apiUrl);
}

/** Pet `imageUrl` comes relative to the gateway (`/api/pets/images/x.jpg`). */
export function imageUrl(relative: string | null | undefined): string | null {
  return relative ? `${environment.apiOrigin}${relative}` : null;
}

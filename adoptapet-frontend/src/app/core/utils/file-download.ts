import { HttpResponse } from '@angular/common/http';

/** File name from `Content-Disposition` (exposed by the gateway CORS config), or a fallback. */
export function fileNameOf(response: HttpResponse<Blob>, fallback: string): string {
  const header = response.headers.get('Content-Disposition') ?? '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match ? decodeURIComponent(match[1]) : fallback;
}

/** Saves a protected file (it cannot be a plain <a href> because it needs the JWT). */
export function saveBlob(response: HttpResponse<Blob>, fallbackName: string): void {
  if (!response.body) {
    return;
  }
  const url = URL.createObjectURL(response.body);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileNameOf(response, fallbackName);
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Opens a protected file (PDF/image) in a new tab. */
export function openBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

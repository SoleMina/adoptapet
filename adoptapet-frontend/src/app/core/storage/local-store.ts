import { Injectable } from '@angular/core';

/**
 * The only access point to localStorage. It can be unavailable (private mode, blocked storage),
 * so every call is guarded and the app keeps working without persistence.
 */
@Injectable({ providedIn: 'root' })
export class LocalStore {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  }

  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage not available: the value simply is not remembered.
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to clean.
    }
  }
}

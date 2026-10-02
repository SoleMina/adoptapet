import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { LocalStore } from '@core/storage/local-store';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'adoptapet.theme';

/**
 * Light/dark mode. Material and the design tokens both follow the `color-scheme` of <html>.
 * Light by default (the Figma design); the user's choice of dark mode is remembered.
 */
@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly document = inject(DOCUMENT);
  private readonly store = inject(LocalStore);

  readonly mode = signal<ThemeMode>(this.store.get<ThemeMode>(STORAGE_KEY) ?? 'light');

  constructor() {
    effect(() => {
      const mode = this.mode();
      this.document.documentElement.style.colorScheme = mode;
      this.store.set(STORAGE_KEY, mode);
    });
  }

  toggle(): void {
    this.mode.update((mode) => (mode === 'light' ? 'dark' : 'light'));
  }
}

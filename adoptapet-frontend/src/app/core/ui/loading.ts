import { Injectable, computed, signal } from '@angular/core';

/** Counts the HTTP requests in flight (loadingInterceptor) to show the global progress bar. */
@Injectable({ providedIn: 'root' })
export class Loading {
  private readonly pending = signal(0);

  readonly active = computed(() => this.pending() > 0);

  start(): void {
    this.pending.update((count) => count + 1);
  }

  stop(): void {
    this.pending.update((count) => Math.max(0, count - 1));
  }
}

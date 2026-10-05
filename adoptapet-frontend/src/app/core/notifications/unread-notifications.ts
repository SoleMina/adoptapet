import { Injectable, effect, inject, signal } from '@angular/core';
import { NotificationApi } from '@core/api/notification-api';
import { AuthStore } from '@core/auth/auth-store';

const POLL_MS = 60_000;

/**
 * Unread notifications of the adopter, for the badge in the header. The backend has no push channel,
 * so the count is polled while an adopter is signed in.
 */
@Injectable({ providedIn: 'root' })
export class UnreadNotifications {
  private readonly api = inject(NotificationApi);
  private readonly auth = inject(AuthStore);
  private timer?: ReturnType<typeof setInterval>;

  readonly count = signal(0);

  constructor() {
    effect(() => {
      clearInterval(this.timer);
      if (this.auth.isAdopter()) {
        this.refresh();
        this.timer = setInterval(() => this.refresh(), POLL_MS);
      } else {
        this.count.set(0);
      }
    });
  }

  /** Call it after reading notifications so the badge updates at once. */
  refresh(): void {
    this.api.unreadCount().subscribe({
      next: ({ unread }) => this.count.set(unread),
      // A failed poll is not worth interrupting the user; the next one will try again.
      error: () => undefined,
    });
  }
}

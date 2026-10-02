import { Injectable, computed, inject, signal } from '@angular/core';
import { UserResponse } from '@core/models/user';
import { LocalStore } from '@core/storage/local-store';

export interface Session {
  token: string;
  user: UserResponse;
  /** Epoch ms. */
  expiresAt: number;
}

const STORAGE_KEY = 'adoptapet.session';

/** Session state (signals) persisted in localStorage. Login/logout logic lives in `Auth`. */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly storage = inject(LocalStore);
  private readonly state = signal<Session | null>(this.restore());

  readonly session = this.state.asReadonly();
  readonly token = computed(() => this.state()?.token ?? null);
  readonly user = computed(() => this.state()?.user ?? null);
  readonly role = computed(() => this.user()?.role ?? null);
  readonly isAuthenticated = computed(() => this.state() !== null);
  readonly isAdopter = computed(() => this.role() === 'ADOPTER');
  readonly isAdmin = computed(() => this.role() === 'ADMIN');
  readonly isStaff = computed(() => this.role() === 'ADMIN' || this.role() === 'WORKER');

  save(session: Session): void {
    this.state.set(session);
    this.storage.set(STORAGE_KEY, session);
  }

  /** After the user edits the profile. */
  updateUser(user: UserResponse): void {
    const session = this.state();
    if (session) {
      this.save({ ...session, user });
    }
  }

  clear(): void {
    this.state.set(null);
    this.storage.remove(STORAGE_KEY);
  }

  private restore(): Session | null {
    const session = this.storage.get<Session>(STORAGE_KEY);
    const valid =
      !!session?.token &&
      !!session.user?.role &&
      typeof session.expiresAt === 'number' &&
      session.expiresAt > Date.now();
    if (!valid) {
      this.storage.remove(STORAGE_KEY);
      return null;
    }
    return session;
  }
}

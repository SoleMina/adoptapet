import { Injectable, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApi } from '@core/api/auth-api';
import { LoginRequest, RegisterRequest, Role, UserResponse } from '@core/models/user';
import { Notify } from '@core/ui/notify';
import { Observable, map, switchMap } from 'rxjs';
import { AuthStore } from './auth-store';
import { expiresAt } from './jwt';

/** Login, registration, logout and automatic logout when the JWT expires (there is no refresh token). */
@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly api = inject(AuthApi);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly notify = inject(Notify);
  private expiryTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      clearTimeout(this.expiryTimer);
      const session = this.store.session();
      if (session) {
        this.expiryTimer = setTimeout(() => this.expire(), session.expiresAt - Date.now());
      }
    });
  }

  login(credentials: LoginRequest): Observable<UserResponse> {
    return this.api.login(credentials).pipe(
      map((response) => {
        this.store.save({
          token: response.token,
          user: response.user,
          expiresAt: expiresAt(response.token, response.expiresIn),
        });
        return response.user;
      }),
    );
  }

  /** Registers an adopter and signs in with the same credentials. */
  register(request: RegisterRequest): Observable<UserResponse> {
    return this.api
      .register(request)
      .pipe(
        switchMap(() => this.login({ username: request.username, password: request.password })),
      );
  }

  logout(): void {
    this.store.clear();
    void this.router.navigateByUrl('/');
  }

  /** Token expired or rejected (401): back to login, remembering where the user was. */
  expire(): void {
    if (!this.store.isAuthenticated()) {
      return;
    }
    const returnUrl = this.router.url;
    this.store.clear();
    this.notify.info('Tu sesión expiró. Inicia sesión de nuevo');
    void this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }

  /** Where each role lands after login (Figma: adopter → catalog, staff → panel). */
  homeFor(role: Role): string {
    return role === 'ADOPTER' ? '/pets' : '/staff/dashboard';
  }

  /** Honors `returnUrl` only when it is an internal path the role can open. */
  urlAfterLogin(role: Role, returnUrl: string | null | undefined): string {
    const internal = !!returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//');
    if (!internal || returnUrl.startsWith('/login') || returnUrl.startsWith('/register')) {
      return this.homeFor(role);
    }
    const isStaffUrl = returnUrl.startsWith('/staff');
    const allowed = role === 'ADOPTER' ? !isStaffUrl : isStaffUrl;
    return allowed ? returnUrl : this.homeFor(role);
  }
}

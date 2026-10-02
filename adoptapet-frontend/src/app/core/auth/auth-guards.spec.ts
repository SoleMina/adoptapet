import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { UserResponse } from '@core/models/user';
import { authGuard, guestGuard, roleGuard } from './auth-guards';
import { AuthStore } from './auth-store';

function signIn(role: UserResponse['role']): void {
  TestBed.inject(AuthStore).save({
    token: 't',
    user: { id: 1, role } as UserResponse,
    expiresAt: Date.now() + 60_000,
  });
}

function run(guard: typeof authGuard, data: object = {}, url = '/x') {
  const route = { data } as unknown as ActivatedRouteSnapshot;
  const state = { url } as RouterStateSnapshot;
  return TestBed.runInInjectionContext(() => guard(route, state));
}

const target = (result: unknown) => (result instanceof UrlTree ? result.toString() : result);

describe('guards', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  });

  it('authGuard sends visitors to login with returnUrl', () => {
    expect(target(run(authGuard, {}, '/apply/2'))).toBe('/login?returnUrl=%2Fapply%2F2');
    signIn('ADOPTER');
    expect(run(authGuard)).toBe(true);
  });

  it('roleGuard only lets the listed roles in', () => {
    signIn('WORKER');
    expect(run(roleGuard, { roles: ['ADMIN', 'WORKER'] })).toBe(true);
    expect(target(run(roleGuard, { roles: ['ADMIN'] }))).toBe('/forbidden');
  });

  it('guestGuard sends a signed-in user to their home', () => {
    expect(run(guestGuard)).toBe(true);
    signIn('ADMIN');
    expect(target(run(guestGuard))).toBe('/staff/dashboard');
  });
});

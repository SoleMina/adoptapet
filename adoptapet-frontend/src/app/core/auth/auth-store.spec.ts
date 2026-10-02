import { TestBed } from '@angular/core/testing';
import { UserResponse } from '@core/models/user';
import { AuthStore, Session } from './auth-store';

const user = { id: 1, firstName: 'Ana', role: 'ADOPTER' } as UserResponse;

describe('AuthStore', () => {
  beforeEach(() => localStorage.clear());

  it('saves, exposes and clears the session', () => {
    const store = TestBed.inject(AuthStore);
    store.save({ token: 't', user, expiresAt: Date.now() + 60_000 });

    expect(store.isAuthenticated()).toBe(true);
    expect(store.isAdopter()).toBe(true);
    expect(store.isStaff()).toBe(false);
    expect(localStorage.getItem('adoptapet.session')).toContain('"token":"t"');

    store.clear();
    expect(store.user()).toBeNull();
    expect(localStorage.getItem('adoptapet.session')).toBeNull();
  });

  it('restores a valid session and discards an expired one', () => {
    const valid: Session = { token: 't', user, expiresAt: Date.now() + 60_000 };
    localStorage.setItem('adoptapet.session', JSON.stringify(valid));
    expect(TestBed.inject(AuthStore).token()).toBe('t');

    TestBed.resetTestingModule();
    localStorage.setItem(
      'adoptapet.session',
      JSON.stringify({ ...valid, expiresAt: Date.now() - 1 }),
    );
    expect(TestBed.inject(AuthStore).isAuthenticated()).toBe(false);
    expect(localStorage.getItem('adoptapet.session')).toBeNull();
  });
});

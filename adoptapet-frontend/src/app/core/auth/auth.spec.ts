import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Auth } from './auth';

describe('Auth.urlAfterLogin', () => {
  let auth: Auth;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(Auth);
  });

  it('sends each role to its home (Figma: adopter → catalog, staff → panel)', () => {
    expect(auth.urlAfterLogin('ADOPTER', null)).toBe('/pets');
    expect(auth.urlAfterLogin('WORKER', undefined)).toBe('/staff/dashboard');
  });

  it('honors returnUrl only when the role can open it', () => {
    expect(auth.urlAfterLogin('ADOPTER', '/apply/3')).toBe('/apply/3');
    expect(auth.urlAfterLogin('ADOPTER', '/staff/pets')).toBe('/pets');
    expect(auth.urlAfterLogin('ADMIN', '/staff/workers')).toBe('/staff/workers');
    expect(auth.urlAfterLogin('ADMIN', '/my-applications')).toBe('/staff/dashboard');
  });

  it('ignores external or auth URLs', () => {
    expect(auth.urlAfterLogin('ADOPTER', 'https://evil.com')).toBe('/pets');
    expect(auth.urlAfterLogin('ADOPTER', '//evil.com')).toBe('/pets');
    expect(auth.urlAfterLogin('ADOPTER', '/login')).toBe('/pets');
  });
});

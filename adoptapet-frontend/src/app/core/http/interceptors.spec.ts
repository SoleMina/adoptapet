import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@core/auth/auth-store';
import { ApiError } from '@core/errors/api-error';
import { UserResponse } from '@core/models/user';
import { environment } from '@env/environment';
import { authInterceptor } from './auth-interceptor';
import { errorInterceptor } from './error-interceptor';

describe('interceptors', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        // 401 sends the user to /login.
        provideRouter([{ path: '**', children: [] }]),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthStore).save({
      token: 'jwt',
      user: { id: 1, role: 'ADOPTER' } as UserResponse,
      expiresAt: Date.now() + 60_000,
    });
  });

  afterEach(() => backend.verify());

  it('sends the token to the gateway only', () => {
    http.get(`${environment.apiUrl}/users/me`).subscribe();
    http.get('https://example.com/data').subscribe();

    expect(
      backend.expectOne(`${environment.apiUrl}/users/me`).request.headers.get('Authorization'),
    ).toBe('Bearer jwt');
    expect(backend.expectOne('https://example.com/data').request.headers.has('Authorization')).toBe(
      false,
    );
  });

  it('turns errors into ApiError for the screen to show', () => {
    let error: unknown;
    http.get(`${environment.apiUrl}/pets/9`).subscribe({ error: (e) => (error = e) });
    backend
      .expectOne(`${environment.apiUrl}/pets/9`)
      .flush({ status: 404, detail: 'Pet not found' }, { status: 404, statusText: 'Not Found' });

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe('Mascota no encontrada');
    expect((error as ApiError).notified).toBe(false);
  });

  it('closes the session on 401', () => {
    http.get(`${environment.apiUrl}/users/me`).subscribe({ error: () => undefined });
    backend
      .expectOne(`${environment.apiUrl}/users/me`)
      .flush(
        { status: 401, detail: 'Invalid or expired JWT token' },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect(TestBed.inject(AuthStore).isAuthenticated()).toBe(false);
  });
});

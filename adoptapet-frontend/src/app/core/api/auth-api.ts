import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { apiUrl } from '@core/http/api-url';
import { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '@core/models/user';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(apiUrl('/auth/login'), request);
  }

  /** Public adopter registration. */
  register(request: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(apiUrl('/auth/register'), request);
  }
}

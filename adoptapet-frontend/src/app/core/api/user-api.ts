import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { apiUrl } from '@core/http/api-url';
import { RegisterRequest, Role, UpdateUserRequest, UserResponse } from '@core/models/user';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);

  me(): Observable<UserResponse> {
    return this.http.get<UserResponse>(apiUrl('/users/me'));
  }

  updateMe(request: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(apiUrl('/users/me'), request);
  }

  /** Staff. */
  list(role?: Role): Observable<UserResponse[]> {
    const params = role ? new HttpParams().set('role', role) : undefined;
    return this.http.get<UserResponse[]>(apiUrl('/users'), { params });
  }

  /** Staff, or the user itself. */
  get(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(apiUrl(`/users/${id}`));
  }

  /** ADMIN. */
  createWorker(request: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(apiUrl('/users/workers'), request);
  }

  /** ADMIN. */
  update(id: number, request: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(apiUrl(`/users/${id}`), request);
  }

  /** ADMIN. */
  setActive(id: number, active: boolean): Observable<UserResponse> {
    const action = active ? 'activate' : 'deactivate';
    return this.http.put<UserResponse>(apiUrl(`/users/${id}/${action}`), null);
  }
}

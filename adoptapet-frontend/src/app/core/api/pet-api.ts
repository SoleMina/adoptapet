import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { apiUrl } from '@core/http/api-url';
import { PetFilters, PetRequest, PetResponse } from '@core/models/pet';
import { toFormData } from '@core/utils/form-data';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PetApi {
  private readonly http = inject(HttpClient);

  /** Public. */
  list(filters: PetFilters = {}): Observable<PetResponse[]> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.species) params = params.set('species', filters.species);
    return this.http.get<PetResponse[]>(apiUrl('/pets'), { params });
  }

  /** Public. */
  get(id: number): Observable<PetResponse> {
    return this.http.get<PetResponse>(apiUrl(`/pets/${id}`));
  }

  /** Staff. Multipart with an optional `image`. */
  create(request: PetRequest, image?: File | null): Observable<PetResponse> {
    return this.http.post<PetResponse>(apiUrl('/pets'), toFormData(request, { image }));
  }

  /** Staff. `request.version` is required (optimistic locking). */
  update(id: number, request: PetRequest, image?: File | null): Observable<PetResponse> {
    return this.http.put<PetResponse>(apiUrl(`/pets/${id}`), toFormData(request, { image }));
  }

  /** Staff. Logical delete: the pet becomes INACTIVE. */
  deactivate(id: number, version: number): Observable<PetResponse> {
    const params = new HttpParams().set('version', version);
    return this.http.delete<PetResponse>(apiUrl(`/pets/${id}`), { params });
  }

  /** Staff. */
  activate(id: number): Observable<PetResponse> {
    return this.http.put<PetResponse>(apiUrl(`/pets/${id}/activate`), null);
  }
}

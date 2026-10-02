import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { apiUrl } from '@core/http/api-url';
import { AdopterSummaryResponse } from '@core/models/adopter';
import { Observable } from 'rxjs';

/** Staff. Activate/deactivate an adopter is in UserApi. */
@Injectable({ providedIn: 'root' })
export class AdopterApi {
  private readonly http = inject(HttpClient);

  list(): Observable<AdopterSummaryResponse[]> {
    return this.http.get<AdopterSummaryResponse[]>(apiUrl('/adopters'));
  }

  /** Includes the application history. */
  get(id: number): Observable<AdopterSummaryResponse> {
    return this.http.get<AdopterSummaryResponse>(apiUrl(`/adopters/${id}`));
  }
}

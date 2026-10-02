import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { apiUrl } from '@core/http/api-url';
import { ApplicationStatus } from '@core/models/application';
import { AdoptionStatus } from '@core/models/pet';
import { Observable } from 'rxjs';

export interface ReportFilters {
  applicationStatus?: ApplicationStatus;
  petStatus?: AdoptionStatus;
  species?: string;
}

/** ADMIN. */
@Injectable({ providedIn: 'root' })
export class ReportApi {
  private readonly http = inject(HttpClient);

  /** PDF download, file name in Content-Disposition. */
  general(filters: ReportFilters = {}): Observable<HttpResponse<Blob>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params = params.set(key, value);
    }
    return this.http.get(apiUrl('/reports/general'), {
      params,
      responseType: 'blob',
      observe: 'response',
    });
  }
}

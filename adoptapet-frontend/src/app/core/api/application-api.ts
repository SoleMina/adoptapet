import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { apiUrl } from '@core/http/api-url';
import {
  ApplicationRequest,
  ApplicationResponse,
  ApplicationStatus,
  DocumentType,
  ReasonRequest,
  ScheduleRequest,
} from '@core/models/application';
import { toFormData } from '@core/utils/form-data';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApplicationApi {
  private readonly http = inject(HttpClient);

  // ----- adopter

  /** ADOPTER. Multipart: form fields + `dniFile` + `addressProofFile`. */
  create(
    request: ApplicationRequest,
    dniFile: File,
    addressProofFile: File,
  ): Observable<ApplicationResponse> {
    return this.http.post<ApplicationResponse>(
      apiUrl('/applications'),
      toFormData(request, { dniFile, addressProofFile }),
    );
  }

  mine(): Observable<ApplicationResponse[]> {
    return this.http.get<ApplicationResponse[]>(apiUrl('/applications/me'));
  }

  // ----- read (owner or staff)

  /** Staff. */
  list(status?: ApplicationStatus): Observable<ApplicationResponse[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<ApplicationResponse[]>(apiUrl('/applications'), { params });
  }

  /** Staff. */
  byAdopter(adopterId: number): Observable<ApplicationResponse[]> {
    return this.http.get<ApplicationResponse[]>(apiUrl(`/applications/adopter/${adopterId}`));
  }

  get(id: number): Observable<ApplicationResponse> {
    return this.http.get<ApplicationResponse>(apiUrl(`/applications/${id}`));
  }

  /** Protected file: comes as a Blob with its name in Content-Disposition. */
  document(id: number, type: DocumentType): Observable<HttpResponse<Blob>> {
    return this.http.get(apiUrl(`/applications/${id}/documents/${type}`), {
      responseType: 'blob',
      observe: 'response',
    });
  }

  // ----- workflow (staff)

  approve(id: number, schedule: ScheduleRequest): Observable<ApplicationResponse> {
    return this.http.put<ApplicationResponse>(apiUrl(`/applications/${id}/approve`), schedule);
  }

  reject(id: number, body: ReasonRequest): Observable<ApplicationResponse> {
    return this.http.put<ApplicationResponse>(apiUrl(`/applications/${id}/reject`), body);
  }

  markNoShow(id: number): Observable<ApplicationResponse> {
    return this.http.put<ApplicationResponse>(apiUrl(`/applications/${id}/no-show`), null);
  }

  reschedule(id: number, schedule: ScheduleRequest): Observable<ApplicationResponse> {
    return this.http.put<ApplicationResponse>(apiUrl(`/applications/${id}/reschedule`), schedule);
  }

  cancel(id: number, body: ReasonRequest): Observable<ApplicationResponse> {
    return this.http.put<ApplicationResponse>(apiUrl(`/applications/${id}/cancel`), body);
  }

  /** Generates the adoption act and returns the PDF. */
  generateAct(id: number): Observable<HttpResponse<Blob>> {
    return this.http.post(apiUrl(`/applications/${id}/act`), null, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  uploadSignedAct(id: number, file: File): Observable<ApplicationResponse> {
    return this.http.post<ApplicationResponse>(
      apiUrl(`/applications/${id}/signed-act`),
      toFormData({}, { file }),
    );
  }

  complete(id: number): Observable<ApplicationResponse> {
    return this.http.put<ApplicationResponse>(apiUrl(`/applications/${id}/complete`), null);
  }

  /** ADMIN. */
  completeByContingency(id: number, body: ReasonRequest): Observable<ApplicationResponse> {
    return this.http.put<ApplicationResponse>(
      apiUrl(`/applications/${id}/complete-contingency`),
      body,
    );
  }
}

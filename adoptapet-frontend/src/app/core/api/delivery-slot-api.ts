import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { apiUrl } from '@core/http/api-url';
import { SlotAvailabilityResponse } from '@core/models/delivery-slot';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DeliverySlotApi {
  private readonly http = inject(HttpClient);

  /** @param date yyyy-MM-dd */
  availability(date: string): Observable<SlotAvailabilityResponse[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<SlotAvailabilityResponse[]>(apiUrl('/delivery-slots'), { params });
  }
}

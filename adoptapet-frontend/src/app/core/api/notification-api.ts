import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { apiUrl } from '@core/http/api-url';
import { SILENT_REQUEST } from '@core/http/loading-interceptor';
import { NotificationResponse, UnreadCountResponse } from '@core/models/notification';
import { Observable } from 'rxjs';

/** Each user only sees their own notifications (the id comes from the token). */
@Injectable({ providedIn: 'root' })
export class NotificationApi {
  private readonly http = inject(HttpClient);

  mine(): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(apiUrl('/notifications/me'));
  }

  /** Polled in the background, so it does not show the progress bar. */
  unreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(apiUrl('/notifications/me/unread-count'), {
      context: new HttpContext().set(SILENT_REQUEST, true),
    });
  }

  markAsRead(id: number): Observable<NotificationResponse> {
    return this.http.put<NotificationResponse>(apiUrl(`/notifications/${id}/read`), null);
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(apiUrl('/notifications/me/read-all'), null);
  }
}

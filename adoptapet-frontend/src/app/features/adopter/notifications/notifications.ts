import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ApplicationApi } from '@core/api/application-api';
import { NotificationApi } from '@core/api/notification-api';
import { PetApi } from '@core/api/pet-api';
import { Tone } from '@core/i18n/labels';
import { NotificationResponse } from '@core/models/notification';
import { UnreadNotifications } from '@core/notifications/unread-notifications';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PageHero } from '@shared/components/page-hero/page-hero';
import { PetPhoto } from '@shared/components/pet-photo/pet-photo';
import { catchError, of } from 'rxjs';
import { notificationLook, notificationText } from './notification-text';
import { valueOf } from '@shared/utils/resource';

interface NotificationRow {
  notification: NotificationResponse;
  text: string;
  icon: string;
  tone: Tone;
  petName: string;
  imageUrl: string | null;
}

@Component({
  selector: 'app-notifications',
  imports: [MatButtonModule, MatIconModule, PageHero, PetPhoto, EmptyState, ErrorState],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications {
  private readonly notificationApi = inject(NotificationApi);
  private readonly applicationApi = inject(ApplicationApi);
  private readonly petApi = inject(PetApi);
  private readonly unread = inject(UnreadNotifications);
  private readonly router = inject(Router);

  protected readonly notifications = rxResource({ stream: () => this.notificationApi.mine() });

  // Context to write each message in Spanish and show the pet photo. If they fail the list still works.
  private readonly applications = rxResource({
    stream: () => this.applicationApi.mine().pipe(catchError(() => of([]))),
    defaultValue: [],
  });
  private readonly pets = rxResource({
    stream: () => this.petApi.list().pipe(catchError(() => of([]))),
    defaultValue: [],
  });

  protected readonly markingAll = signal(false);

  protected readonly rows = computed<NotificationRow[]>(() => {
    const applications = new Map(this.applications.value().map((a) => [a.id, a]));
    const images = new Map(this.pets.value().map((pet) => [pet.id, pet.imageUrl]));
    return (valueOf(this.notifications) ?? []).map((notification) => {
      const application = applications.get(notification.applicationId);
      return {
        notification,
        text: notificationText(notification, application),
        ...notificationLook(notification.type),
        petName: application?.petName ?? 'Mascota',
        imageUrl: application ? (images.get(application.petId) ?? null) : null,
      };
    });
  });

  protected readonly unreadCount = computed(
    () => (valueOf(this.notifications) ?? []).filter((notification) => !notification.read).length,
  );

  /** Opens the application; an unread notification is marked as read on the way. */
  protected open(notification: NotificationResponse): void {
    if (!notification.read) {
      this.notificationApi.markAsRead(notification.id).subscribe({
        next: () => this.unread.refresh(),
        error: () => undefined,
      });
    }
    void this.router.navigate(['/my-applications', notification.applicationId]);
  }

  protected markAllAsRead(): void {
    this.markingAll.set(true);
    this.notificationApi.markAllAsRead().subscribe({
      next: () => {
        this.markingAll.set(false);
        this.notifications.update((list) => list?.map((item) => ({ ...item, read: true })));
        this.unread.refresh();
      },
      error: () => this.markingAll.set(false),
    });
  }
}

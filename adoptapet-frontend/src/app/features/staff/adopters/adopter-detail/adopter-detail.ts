import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AdopterApi } from '@core/api/adopter-api';
import { ApplicationApi } from '@core/api/application-api';
import { PetApi } from '@core/api/pet-api';
import { UserApi } from '@core/api/user-api';
import { AuthStore } from '@core/auth/auth-store';
import { ApiError } from '@core/errors/api-error';
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE } from '@core/i18n/labels';
import { AdopterSummaryResponse } from '@core/models/adopter';
import { Confirm } from '@core/ui/confirm';
import { Notify } from '@core/ui/notify';
import { Avatar } from '@shared/components/avatar/avatar';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PetPhoto } from '@shared/components/pet-photo/pet-photo';
import { LimaDatePipe } from '@shared/pipes/lima-date-pipe';
import { valueOf } from '@shared/utils/resource';
import { EMPTY, Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';

/** Staff: one adopter with contact data and the history of applications. */
@Component({
  selector: 'app-adopter-detail',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    Avatar,
    PetPhoto,
    EmptyState,
    ErrorState,
    LimaDatePipe,
  ],
  templateUrl: './adopter-detail.html',
  styleUrl: './adopter-detail.scss',
})
export class AdopterDetail {
  private readonly adopterApi = inject(AdopterApi);
  private readonly applicationApi = inject(ApplicationApi);
  private readonly petApi = inject(PetApi);
  private readonly userApi = inject(UserApi);
  private readonly confirm = inject(Confirm);
  private readonly notify = inject(Notify);
  protected readonly isAdmin = inject(AuthStore).isAdmin;

  /** Route param :id (component input binding). */
  readonly id = input.required<string>();

  protected readonly adopter = rxResource({
    params: () => Number(this.id()),
    stream: ({ params: id }) => this.adopterApi.get(id),
  });
  private readonly current = computed(() => valueOf(this.adopter));

  /**
   * The history comes from the applications endpoint (it has the pet id, needed for the photo).
   * Photos are optional: if the pets cannot be read the rows show the placeholder.
   */
  protected readonly history = rxResource({
    params: () => Number(this.id()),
    stream: ({ params: id }) =>
      forkJoin({
        applications: this.applicationApi.byAdopter(id),
        pets: forkJoin([this.petApi.list(), this.petApi.list({ status: 'INACTIVE' })]).pipe(
          map(([active, inactive]) => [...active, ...inactive]),
          catchError(() => of([])),
        ),
      }),
  });

  protected readonly rows = computed(() => {
    const data = valueOf(this.history);
    if (!data) return [];
    const images = new Map(data.pets.map((pet) => [pet.id, pet.imageUrl]));
    return [...data.applications]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((application) => ({
        application,
        imageUrl: images.get(application.petId) ?? null,
        status: {
          text: APPLICATION_STATUS_LABEL[application.status],
          tone: APPLICATION_STATUS_TONE[application.status],
        },
      }));
  });

  protected readonly saving = signal(false);

  /** ADMIN: an inactive adopter cannot sign in. */
  protected toggleActive(adopter: AdopterSummaryResponse): void {
    const activate = !adopter.active;
    const ask: Observable<void> = activate
      ? of(undefined)
      : this.confirm.ask({
          title: `¿Desactivar a ${adopter.firstName}?`,
          message:
            'No podrá iniciar sesión ni enviar solicitudes. Sus datos y su historial se conservan.',
          confirmLabel: 'Desactivar cuenta',
          tone: 'danger',
        });
    ask
      .pipe(
        switchMap(() => {
          this.saving.set(true);
          return this.userApi.setActive(adopter.id, activate);
        }),
        catchError((error: unknown) => {
          if (error instanceof ApiError && !error.notified) {
            error.notified = true;
            this.notify.error(error.message);
          }
          this.saving.set(false);
          return EMPTY;
        }),
      )
      .subscribe((user) => {
        this.saving.set(false);
        this.adopter.update((value) => (value ? { ...value, active: user.active } : value));
        this.notify.success(user.active ? 'Cuenta reactivada' : 'Cuenta desactivada');
      });
  }
}

import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AdopterApi } from '@core/api/adopter-api';
import { ApplicationApi } from '@core/api/application-api';
import { PetApi } from '@core/api/pet-api';
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE } from '@core/i18n/labels';
import { ApplicationStatus } from '@core/models/application';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { PetPhoto } from '@shared/components/pet-photo/pet-photo';
import { LimaDatePipe } from '@shared/pipes/lima-date-pipe';
import { valueOf } from '@shared/utils/resource';
import { catchError, forkJoin, map, of } from 'rxjs';

interface Tab {
  /** Value of ?status= (empty = all). */
  status: ApplicationStatus | '';
  label: string;
}

const TABS: Tab[] = [
  { status: 'PENDING', label: 'Pendientes' },
  { status: 'APPROVED', label: 'Aprobadas' },
  { status: 'NO_SHOW', label: 'No se presentó' },
  { status: 'COMPLETED', label: 'Completadas' },
  { status: 'REJECTED', label: 'Rechazadas' },
  { status: 'CANCELLED', label: 'Canceladas' },
  { status: '', label: 'Todas' },
];

/** Staff: every application, by status. The tab lives in the URL (?status=) so it survives "back". */
@Component({
  selector: 'app-application-list',
  imports: [MatIconModule, RouterLink, PanelHeader, PetPhoto, EmptyState, ErrorState, LimaDatePipe],
  templateUrl: './application-list.html',
  styleUrl: './application-list.scss',
})
export class ApplicationList {
  private readonly applicationApi = inject(ApplicationApi);
  private readonly petApi = inject(PetApi);
  private readonly adopterApi = inject(AdopterApi);

  /** Query param ?status= (component input binding). Without it the pending ones are shown. */
  readonly status = input<string>();

  protected readonly tabs = TABS;
  protected readonly active = computed<ApplicationStatus | ''>(() => {
    const status = this.status();
    if (status === 'ALL') return '';
    return TABS.some((tab) => tab.status === status) ? (status as ApplicationStatus) : 'PENDING';
  });

  protected readonly applications = rxResource({ stream: () => this.applicationApi.list() });

  /** Photos and names: an application only stores the ids. If they fail the list still works. */
  private readonly lookups = rxResource({
    stream: () =>
      forkJoin({
        pets: forkJoin([this.petApi.list(), this.petApi.list({ status: 'INACTIVE' })]).pipe(
          map(([active, inactive]) => [...active, ...inactive]),
          catchError(() => of([])),
        ),
        adopters: this.adopterApi.list().pipe(catchError(() => of([]))),
      }),
    defaultValue: { pets: [], adopters: [] },
  });

  /** How many applications each tab has. */
  protected readonly counts = computed(() => {
    const all = valueOf(this.applications) ?? [];
    const counts = new Map<string, number>([['', all.length]]);
    for (const application of all) {
      counts.set(application.status, (counts.get(application.status) ?? 0) + 1);
    }
    return counts;
  });

  protected readonly rows = computed(() => {
    const { pets, adopters } = this.lookups.value();
    const images = new Map(pets.map((pet) => [pet.id, pet.imageUrl]));
    const names = new Map(adopters.map((a) => [a.id, `${a.firstName} ${a.lastName}`]));
    const active = this.active();
    return (valueOf(this.applications) ?? [])
      .filter((application) => !active || application.status === active)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((application) => ({
        application,
        imageUrl: images.get(application.petId) ?? null,
        adopter: names.get(application.adopterId) ?? `Adoptante #${application.adopterId}`,
        status: {
          text: APPLICATION_STATUS_LABEL[application.status],
          tone: APPLICATION_STATUS_TONE[application.status],
        },
        action: application.status === 'PENDING' ? 'Revisar' : 'Ver detalle',
      }));
  });

  protected readonly activeLabel = computed(
    () => TABS.find((tab) => tab.status === this.active())?.label ?? '',
  );
}

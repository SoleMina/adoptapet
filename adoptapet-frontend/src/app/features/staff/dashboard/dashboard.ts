import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AdopterApi } from '@core/api/adopter-api';
import { ApplicationApi } from '@core/api/application-api';
import { PetApi } from '@core/api/pet-api';
import { Tone } from '@core/i18n/labels';
import { ApplicationResponse, ApplicationStatus } from '@core/models/application';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { PetPhoto } from '@shared/components/pet-photo/pet-photo';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { limaToday } from '@shared/utils/lima-date';
import { valueOf } from '@shared/utils/resource';
import { catchError, of } from 'rxjs';

interface Kpi {
  label: string;
  value: number;
  icon: string;
  tone: Tone;
}

interface ReviewRow {
  application: ApplicationResponse;
  imageUrl: string | null;
  adopter: string;
  action: string;
}

/** Statuses that need something from the staff, in the order they should be handled. */
const TO_REVIEW: ApplicationStatus[] = ['PENDING', 'NO_SHOW', 'APPROVED'];

const ACTION: Partial<Record<ApplicationStatus, string>> = {
  PENDING: 'Revisar',
  NO_SHOW: 'Reprogramar',
  APPROVED: 'Ver cita',
};

const MAX_ROWS = 8;

/** Staff home: what needs attention today. */
@Component({
  selector: 'app-dashboard',
  imports: [MatIconModule, RouterLink, PanelHeader, PetPhoto, StatusBadge, EmptyState, ErrorState],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly applicationApi = inject(ApplicationApi);
  private readonly petApi = inject(PetApi);
  private readonly adopterApi = inject(AdopterApi);

  protected readonly applications = rxResource({ stream: () => this.applicationApi.list() });
  protected readonly pets = rxResource({ stream: () => this.petApi.list() });

  /** Only for the names: an application stores the adopter id. Without it the id is shown. */
  private readonly adopters = rxResource({
    stream: () => this.adopterApi.list().pipe(catchError(() => of([]))),
    defaultValue: [],
  });

  protected readonly loading = computed(
    () => this.applications.isLoading() || this.pets.isLoading(),
  );
  protected readonly error = computed(() => this.applications.error() ?? this.pets.error());

  protected readonly kpis = computed<Kpi[]>(() => {
    const applications = valueOf(this.applications) ?? [];
    const pets = valueOf(this.pets) ?? [];
    const today = limaToday();
    const count = (status: ApplicationStatus) =>
      applications.filter((application) => application.status === status).length;
    return [
      { label: 'Pendientes', value: count('PENDING'), icon: 'schedule', tone: 'warning' },
      {
        label: 'Entregas hoy',
        value: applications.filter(
          (application) =>
            application.status === 'APPROVED' && application.appointment?.deliveryDate === today,
        ).length,
        icon: 'calendar_today',
        tone: 'info',
      },
      {
        label: 'Disponibles',
        value: pets.filter((pet) => pet.adoptionStatus === 'AVAILABLE').length,
        icon: 'pets',
        tone: 'success',
      },
      { label: 'No se presentó', value: count('NO_SHOW'), icon: 'warning', tone: 'danger' },
    ];
  });

  private readonly toReview = computed(() =>
    (valueOf(this.applications) ?? [])
      .filter((application) => TO_REVIEW.includes(application.status))
      .sort(
        (a, b) =>
          TO_REVIEW.indexOf(a.status) - TO_REVIEW.indexOf(b.status) ||
          // oldest first: the adopter who has waited longer goes on top
          a.createdAt.localeCompare(b.createdAt),
      ),
  );

  protected readonly total = computed(() => this.toReview().length);

  protected readonly rows = computed<ReviewRow[]>(() => {
    const images = new Map((valueOf(this.pets) ?? []).map((pet) => [pet.id, pet.imageUrl]));
    const names = new Map(
      this.adopters
        .value()
        .map((adopter) => [adopter.id, `${adopter.firstName} ${adopter.lastName}`]),
    );
    return this.toReview()
      .slice(0, MAX_ROWS)
      .map((application) => ({
        application,
        imageUrl: images.get(application.petId) ?? null,
        adopter: names.get(application.adopterId) ?? `Adoptante #${application.adopterId}`,
        action: ACTION[application.status] ?? 'Ver',
      }));
  });

  protected reload(): void {
    this.applications.reload();
    this.pets.reload();
  }
}

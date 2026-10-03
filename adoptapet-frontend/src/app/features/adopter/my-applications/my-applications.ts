import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ApplicationApi } from '@core/api/application-api';
import { PetApi } from '@core/api/pet-api';
import { ApplicationResponse } from '@core/models/application';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PageHero } from '@shared/components/page-hero/page-hero';
import { PetPhoto } from '@shared/components/pet-photo/pet-photo';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { LimaDatePipe } from '@shared/pipes/lima-date-pipe';

/** One row of the table, with what the adopter has to know about it. */
interface ApplicationRow {
  application: ApplicationResponse;
  imageUrl: string | null;
  /** "Qué sigue": an appointment (with calendar icon) or a sentence. */
  appointment: { date: string; start: string; end: string } | null;
  next: string;
}

@Component({
  selector: 'app-my-applications',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PageHero,
    PetPhoto,
    StatusBadge,
    EmptyState,
    ErrorState,
    LimaDatePipe,
  ],
  templateUrl: './my-applications.html',
  styleUrl: './my-applications.scss',
})
export class MyApplications {
  private readonly applicationApi = inject(ApplicationApi);
  private readonly petApi = inject(PetApi);

  protected readonly applications = rxResource({ stream: () => this.applicationApi.mine() });

  /** Only for the photos: an application stores the pet id and name, not the image. */
  private readonly pets = rxResource({
    params: () => (this.applications.value()?.length ? true : undefined),
    stream: () => this.petApi.list(),
    defaultValue: [],
  });

  protected readonly rows = computed<ApplicationRow[]>(() => {
    const images = new Map(this.pets.value().map((pet) => [pet.id, pet.imageUrl]));
    return [...(this.applications.value() ?? [])]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((application) => ({
        application,
        imageUrl: images.get(application.petId) ?? null,
        appointment:
          application.status === 'APPROVED' && application.appointment
            ? {
                date: application.appointment.deliveryDate,
                start: application.appointment.startTime,
                end: application.appointment.endTime,
              }
            : null,
        next: nextStep(application),
      }));
  });
}

/** "¿Qué sigue?" for each status. */
function nextStep(application: ApplicationResponse): string {
  switch (application.status) {
    case 'PENDING':
      return 'Estamos revisando tu solicitud';
    case 'APPROVED':
      return 'Te contactaremos para coordinar la entrega';
    case 'NO_SHOW':
      return 'No asististe a tu cita; te contactaremos para reprogramar';
    case 'COMPLETED':
      return '¡Felicidades por tu adopción!';
    case 'REJECTED':
      return application.rejectionReason
        ? `Motivo: ${application.rejectionReason}`
        : 'Tu solicitud no fue aprobada';
    case 'CANCELLED':
      return application.cancellationReason
        ? `Motivo: ${application.cancellationReason}`
        : 'La adopción fue cancelada';
  }
}

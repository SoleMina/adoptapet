import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ApplicationApi } from '@core/api/application-api';
import { PetApi } from '@core/api/pet-api';
import { APPLICATION_STATUS_LABEL } from '@core/i18n/labels';
import { ApplicationResponse, DocumentType } from '@core/models/application';
import { PageTitleStrategy } from '@core/routing/page-title-strategy';
import { saveBlob } from '@core/utils/file-download';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PageHero } from '@shared/components/page-hero/page-hero';
import { PetPhoto } from '@shared/components/pet-photo/pet-photo';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { LimaDatePipe } from '@shared/pipes/lima-date-pipe';
import { catchError, finalize, of } from 'rxjs';
import { timelineOf } from './application-timeline';
import { valueOf } from '@shared/utils/resource';

interface DocumentRow {
  type: DocumentType;
  label: string;
  /** Used when the server does not send a file name. */
  fallbackName: string;
}

/** Message under the timeline for the statuses that are a single sentence. */
interface StatusNote {
  tone: 'info' | 'warning' | 'danger' | 'neutral';
  icon: string;
  text: string;
}

/** One application of the adopter: status timeline, appointment and documents. */
@Component({
  selector: 'app-application-detail',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PageHero,
    PetPhoto,
    StatusBadge,
    ErrorState,
    LimaDatePipe,
  ],
  templateUrl: './application-detail.html',
  styleUrl: './application-detail.scss',
})
export class ApplicationDetail {
  private readonly applicationApi = inject(ApplicationApi);
  private readonly petApi = inject(PetApi);
  private readonly titles = inject(PageTitleStrategy);

  /** Route param :id (component input binding). */
  readonly id = input.required<string>();

  protected readonly trail = [{ label: 'Mis solicitudes', path: '/my-applications' }];

  protected readonly application = rxResource({
    params: () => Number(this.id()),
    stream: ({ params: id }) => this.applicationApi.get(id),
  });

  /** Only for the photo; if the pet cannot be read the placeholder is shown. */
  private readonly pet = rxResource({
    params: () => valueOf(this.application)?.petId,
    stream: ({ params: petId }) => this.petApi.get(petId).pipe(catchError(() => of(null))),
  });
  protected readonly imageUrl = computed(() => this.pet.value()?.imageUrl ?? null);

  protected readonly heading = computed(() => {
    const application = valueOf(this.application);
    return application
      ? `Detalle · ${APPLICATION_STATUS_LABEL[application.status]}`
      : 'Detalle de solicitud';
  });

  protected readonly reference = computed(() => {
    const application = valueOf(this.application);
    return application ? `Solicitud #${application.id} · ${application.petName}` : '';
  });

  protected readonly timeline = computed(() => {
    const application = valueOf(this.application);
    return application ? timelineOf(application.status) : [];
  });

  protected readonly note = computed(() => {
    const application = valueOf(this.application);
    return application ? noteOf(application) : null;
  });

  protected readonly documents = computed<DocumentRow[]>(() => {
    const application = valueOf(this.application);
    if (!application) return [];
    const rows: (DocumentRow & { available: boolean })[] = [
      { type: 'DNI', label: 'DNI', fallbackName: 'dni', available: application.hasDni },
      {
        type: 'ADDRESS_PROOF',
        label: 'Comprobante de domicilio',
        fallbackName: 'comprobante-domicilio',
        available: application.hasAddressProof,
      },
      {
        type: 'ACT',
        label: 'Acta de adopción',
        fallbackName: 'acta-adopcion.pdf',
        available: application.hasAct,
      },
      {
        type: 'SIGNED_ACT',
        label: 'Acta firmada',
        fallbackName: 'acta-firmada',
        available: application.hasSignedAct,
      },
    ];
    return rows.filter((row) => row.available);
  });

  /** Document being downloaded right now (its button shows progress). */
  protected readonly downloading = signal<DocumentType | null>(null);

  constructor() {
    effect(() => this.titles.setPageTitle(this.heading()));
  }

  protected download(application: ApplicationResponse, document: DocumentRow): void {
    this.downloading.set(document.type);
    this.applicationApi
      .document(application.id, document.type)
      .pipe(finalize(() => this.downloading.set(null)))
      .subscribe((response) => saveBlob(response, document.fallbackName));
  }
}

function noteOf(application: ApplicationResponse): StatusNote | null {
  switch (application.status) {
    case 'PENDING':
      return { tone: 'info', icon: 'info', text: 'Estamos revisando tu solicitud' };
    case 'NO_SHOW':
      return {
        tone: 'warning',
        icon: 'error',
        text: 'No asististe a tu cita; el albergue te contactará para reprogramar.',
      };
    case 'REJECTED':
      return {
        tone: 'danger',
        icon: 'cancel',
        text: application.rejectionReason
          ? `Motivo: ${application.rejectionReason}`
          : 'Tu solicitud no fue aprobada.',
      };
    case 'CANCELLED':
      return {
        tone: 'neutral',
        icon: 'info',
        text: application.cancellationReason
          ? `Motivo: ${application.cancellationReason}`
          : 'La adopción fue cancelada.',
      };
    default:
      // APPROVED shows the appointment and COMPLETED the congratulations, both with their own block.
      return null;
  }
}

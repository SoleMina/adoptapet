import { HttpResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AdopterApi } from '@core/api/adopter-api';
import { ApplicationApi } from '@core/api/application-api';
import { PetApi } from '@core/api/pet-api';
import { AuthStore } from '@core/auth/auth-store';
import { ApiError } from '@core/errors/api-error';
import { translateMessage } from '@core/errors/error-messages';
import { APPLICATION_STATUS_LABEL, healthStatusLabel } from '@core/i18n/labels';
import { ApplicationResponse, DocumentType, ScheduleRequest } from '@core/models/application';
import { PageTitleStrategy } from '@core/routing/page-title-strategy';
import { Confirm } from '@core/ui/confirm';
import { Notify } from '@core/ui/notify';
import { fileNameOf, saveBlob } from '@core/utils/file-download';
import {
  DocumentViewer,
  DocumentViewerData,
} from '@shared/components/document-viewer/document-viewer';
import { ErrorState } from '@shared/components/error-state/error-state';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { LimaDatePipe } from '@shared/pipes/lima-date-pipe';
import { limaNow } from '@shared/utils/lima-date';
import { valueOf } from '@shared/utils/resource';
import { EMPTY, Observable, catchError, filter, finalize, of, switchMap, tap } from 'rxjs';
import { ScheduleData, ScheduleDialog } from '../schedule-dialog/schedule-dialog';

/** Same limit as the backend (ApplicationService.MAX_RESCHEDULES). */
const MAX_RESCHEDULES = 2;
const SIGNED_ACT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_MB = 5;

/** Where an approved application stands against the clock of its appointment. */
interface DeliveryClock {
  /** The delivery window already started: the signed act can be uploaded and the adoption completed. */
  started: boolean;
  /** The window ended: "no se presentó" can be marked. */
  ended: boolean;
  /** The pickup deadline passed: only an ADMIN can close it, by contingency. */
  overdue: boolean;
}

/**
 * Staff review of one application. It shows only the actions that are valid for the current status,
 * role and time; the backend validates all of them again.
 */
@Component({
  selector: 'app-application-review',
  imports: [MatButtonModule, MatIconModule, RouterLink, StatusBadge, ErrorState, LimaDatePipe],
  templateUrl: './application-review.html',
  styleUrl: './application-review.scss',
})
export class ApplicationReview {
  private readonly applicationApi = inject(ApplicationApi);
  private readonly adopterApi = inject(AdopterApi);
  private readonly petApi = inject(PetApi);
  private readonly auth = inject(AuthStore);
  private readonly confirm = inject(Confirm);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(Notify);
  private readonly titles = inject(PageTitleStrategy);

  /** Route param :id (component input binding). */
  readonly id = input.required<string>();

  protected readonly maxReschedules = MAX_RESCHEDULES;
  protected readonly statusLabel = APPLICATION_STATUS_LABEL;
  protected readonly isAdmin = this.auth.isAdmin;

  protected readonly application = rxResource({
    params: () => Number(this.id()),
    stream: ({ params: id }) => this.applicationApi.get(id),
  });
  private readonly current = computed(() => valueOf(this.application));

  // The application only stores ids; these give the names shown in the summary. Optional data.
  private readonly adopter = rxResource({
    params: () => this.current()?.adopterId,
    stream: ({ params: id }) => this.adopterApi.get(id).pipe(catchError(() => of(null))),
  });
  private readonly pet = rxResource({
    params: () => this.current()?.petId,
    stream: ({ params: id }) => this.petApi.get(id).pipe(catchError(() => of(null))),
  });

  /** Name of the action in progress, to disable the buttons meanwhile. */
  protected readonly busy = signal<string | null>(null);

  protected readonly heading = computed(() => {
    const application = this.current();
    return application
      ? `Revisión · ${APPLICATION_STATUS_LABEL[application.status]}`
      : 'Revisión de solicitud';
  });

  protected readonly adopterText = computed(() => {
    const adopter = this.adopter.value();
    if (!adopter) return `Adoptante #${this.current()?.adopterId ?? ''}`;
    return `${adopter.firstName} ${adopter.lastName} · DNI ${adopter.dni}`;
  });

  protected readonly adopterContact = computed(() => {
    const adopter = this.adopter.value();
    return adopter ? [adopter.phone, adopter.email].filter(Boolean).join(' · ') : '';
  });

  protected readonly petText = computed(() => {
    const application = this.current();
    const pet = this.pet.value();
    if (!application) return '';
    return pet
      ? `${pet.name} · ${healthStatusLabel(pet.healthStatus, pet.sex)}`
      : application.petName;
  });

  /** "Departamento · 3 personas · Sin otras mascotas" */
  protected readonly home = computed(() => {
    const application = this.current();
    if (!application) return '';
    const people =
      application.householdSize === 1 ? '1 persona' : `${application.householdSize} personas`;
    const pets = application.otherPets
      ? `Otras mascotas: ${application.otherPets}`
      : 'Sin otras mascotas';
    return `${application.housingType} · ${people} · ${pets}`;
  });

  /** Reason of a rejection or cancellation (the automatic ones come in English from the backend). */
  protected readonly closingReason = computed(() => {
    const application = this.current();
    const reason = application?.rejectionReason ?? application?.cancellationReason;
    return reason ? translateMessage(reason) : null;
  });

  /** Changes every 30 s so the time-based buttons unlock without reloading the page. */
  private readonly tick = signal(0);

  protected readonly clock = computed<DeliveryClock>(() => {
    this.tick();
    const appointment = this.current()?.appointment;
    if (!appointment) return { started: false, ended: false, overdue: false };
    const now = limaNow();
    return {
      started: now >= `${appointment.deliveryDate}T${appointment.startTime}`,
      ended: now >= `${appointment.deliveryDate}T${appointment.endTime}`,
      overdue: now > appointment.pickupDeadline,
    };
  });

  /** Reschedules used up: only an ADMIN can add another one, explaining why. */
  protected readonly rescheduleLimitReached = computed(
    () => (this.current()?.rescheduleCount ?? 0) >= MAX_RESCHEDULES,
  );
  protected readonly canReschedule = computed(
    () => !this.rescheduleLimitReached() || this.isAdmin(),
  );

  /** Step of the closing checklist the application is on (1 act, 2 signed act, 3 complete). */
  protected readonly closingStep = computed(() => {
    const application = this.current();
    if (!application?.hasAct) return 1;
    return application.hasSignedAct ? 3 : 2;
  });

  constructor() {
    effect(() => this.titles.setPageTitle(this.heading()));
    const timer = setInterval(() => this.tick.update((value) => value + 1), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  // ----- documents

  /** Shows a document of the application inside the page. */
  protected view(application: ApplicationResponse, type: DocumentType, title: string): void {
    this.busy.set(type);
    this.applicationApi
      .document(application.id, type)
      .pipe(
        catchError((error: unknown) => this.failDocument(error)),
        finalize(() => this.busy.set(null)),
      )
      .subscribe((response) => this.openViewer(title, response));
  }

  protected download(
    application: ApplicationResponse,
    type: DocumentType,
    fallbackName: string,
  ): void {
    this.busy.set(type);
    this.applicationApi
      .document(application.id, type)
      .pipe(
        catchError((error: unknown) => this.failDocument(error)),
        finalize(() => this.busy.set(null)),
      )
      .subscribe((response) => saveBlob(response, fallbackName));
  }

  // ----- pending

  protected approve(application: ApplicationResponse): void {
    this.askSchedule({
      title: 'Aprobar y agendar la entrega',
      message: `Elige cuándo se entregará ${application.petName}. Las demás solicitudes pendientes para esta mascota se rechazarán.`,
      confirmLabel: 'Aprobar solicitud',
    })
      .pipe(
        switchMap((schedule) =>
          this.run('approve', this.applicationApi.approve(application.id, schedule)),
        ),
      )
      .subscribe(() => this.notify.success('Solicitud aprobada y entrega agendada'));
  }

  protected reject(application: ApplicationResponse): void {
    this.confirm
      .askReason({
        title: 'Rechazar solicitud',
        message: 'El adoptante verá este motivo en su solicitud y en sus notificaciones.',
        label: 'Motivo del rechazo',
        confirmLabel: 'Rechazar',
        tone: 'danger',
      })
      .pipe(
        switchMap((reason) =>
          this.run('reject', this.applicationApi.reject(application.id, { reason })),
        ),
      )
      .subscribe(() => this.notify.success('Solicitud rechazada'));
  }

  // ----- approved / no-show

  protected reschedule(application: ApplicationResponse): void {
    const extra = this.rescheduleLimitReached();
    this.askSchedule({
      title: 'Reprogramar la entrega',
      message: extra
        ? `Esta solicitud ya usó sus ${MAX_RESCHEDULES} reprogramaciones. Como administrador puedes autorizar una más indicando el motivo.`
        : `Reprogramación ${application.rescheduleCount + 1} de ${MAX_RESCHEDULES}. El adoptante recibirá una notificación.`,
      confirmLabel: 'Reprogramar',
      requireObservation: extra,
    })
      .pipe(
        switchMap((schedule) =>
          this.run('reschedule', this.applicationApi.reschedule(application.id, schedule)),
        ),
      )
      .subscribe(() => this.notify.success('Entrega reprogramada'));
  }

  protected cancel(application: ApplicationResponse): void {
    this.confirm
      .askReason({
        title: 'Cancelar la adopción',
        message: `${application.petName} volverá a estar disponible en el catálogo. El adoptante verá este motivo.`,
        label: 'Motivo de la cancelación',
        confirmLabel: 'Cancelar adopción',
        tone: 'danger',
      })
      .pipe(
        switchMap((reason) =>
          this.run('cancel', this.applicationApi.cancel(application.id, { reason })),
        ),
      )
      .subscribe(() => this.notify.success('Adopción cancelada'));
  }

  protected markNoShow(application: ApplicationResponse): void {
    this.confirm
      .ask({
        title: 'Marcar "no se presentó"',
        message:
          'Confirma que el adoptante no asistió a su cita. Después podrás reprogramar o cancelar.',
        confirmLabel: 'Marcar no se presentó',
        tone: 'danger',
      })
      .pipe(switchMap(() => this.run('no-show', this.applicationApi.markNoShow(application.id))))
      .subscribe(() => this.notify.success('Cita marcada como "no se presentó"'));
  }

  // ----- closing checklist

  /** Generates (or regenerates) the act, opens the PDF and refreshes the application. */
  protected generateAct(application: ApplicationResponse): void {
    this.busy.set('act');
    this.applicationApi
      .generateAct(application.id)
      .pipe(
        tap((response) => this.openViewer('Acta de adopción', response)),
        switchMap(() => this.applicationApi.get(application.id)),
        catchError((error: unknown) => this.fail(error)),
        finalize(() => this.busy.set(null)),
      )
      .subscribe((updated) => {
        this.application.set(updated);
        this.notify.success('Acta generada. Imprímela para la firma');
      });
  }

  protected onSignedActPicked(application: ApplicationResponse, input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!SIGNED_ACT_TYPES.includes(file.type)) {
      this.notify.error('Solo se permiten archivos PDF, JPG o PNG');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      this.notify.error(`El archivo supera los ${MAX_FILE_MB} MB`);
      return;
    }
    this.run('signed-act', this.applicationApi.uploadSignedAct(application.id, file)).subscribe(
      () => this.notify.success('Acta firmada guardada'),
    );
  }

  protected complete(application: ApplicationResponse): void {
    this.confirm
      .ask({
        title: 'Completar la adopción',
        message: `Confirma que ${application.petName} fue entregada y el acta está firmada. La solicitud quedará de solo lectura.`,
        confirmLabel: 'Completar adopción',
      })
      .pipe(switchMap(() => this.run('complete', this.applicationApi.complete(application.id))))
      .subscribe(() => this.notify.success('¡Adopción completada!'));
  }

  protected completeByContingency(application: ApplicationResponse): void {
    this.confirm
      .askReason({
        title: 'Cerrar por contingencia',
        message:
          'El plazo de recojo ya venció. Indica por qué se completa la adopción fuera de plazo.',
        label: 'Motivo de la contingencia',
        confirmLabel: 'Completar por contingencia',
      })
      .pipe(
        switchMap((reason) =>
          this.run(
            'contingency',
            this.applicationApi.completeByContingency(application.id, { reason }),
          ),
        ),
      )
      .subscribe(() => this.notify.success('Adopción completada por contingencia'));
  }

  // ----- helpers

  private openViewer(title: string, response: HttpResponse<Blob>): void {
    if (!response.body) return;
    this.dialog.open<DocumentViewer, DocumentViewerData>(DocumentViewer, {
      data: { title, blob: response.body, fileName: fileNameOf(response, title) },
      width: 'calc(100vw - 32px)',
      maxWidth: '920px',
    });
  }

  /** The record says the file exists but the server cannot find it (or it cannot be read). */
  private failDocument(error: unknown): Observable<never> {
    if (error instanceof ApiError && !error.notified) {
      error.notified = true;
      this.notify.error(
        error.status === 404 ? 'El archivo de este documento ya no está disponible' : error.message,
      );
    }
    return EMPTY;
  }

  private askSchedule(data: ScheduleData): Observable<ScheduleRequest> {
    return this.dialog
      .open<ScheduleDialog, ScheduleData, ScheduleRequest>(ScheduleDialog, { data })
      .afterClosed()
      .pipe(filter((schedule): schedule is ScheduleRequest => !!schedule));
  }

  /** Runs a workflow action and shows the application it returns. */
  private run(
    name: string,
    action: Observable<ApplicationResponse>,
  ): Observable<ApplicationResponse> {
    this.busy.set(name);
    return action.pipe(
      tap((updated) => this.application.set(updated)),
      catchError((error: unknown) => this.fail(error)),
      finalize(() => this.busy.set(null)),
    );
  }

  /** Explains the failure and reloads: most conflicts mean the application changed meanwhile. */
  private fail(error: unknown): Observable<never> {
    if (error instanceof ApiError && !error.notified) {
      error.notified = true;
      this.notify.error(error.message);
      if (error.isConflict) {
        this.application.reload();
      }
    }
    return EMPTY;
  }
}

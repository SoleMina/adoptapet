import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { ApplicationApi } from '@core/api/application-api';
import { ApiError } from '@core/errors/api-error';
import { applyServerErrors } from '@core/errors/server-errors';
import { ApplicationResponse } from '@core/models/application';
import { Notify } from '@core/ui/notify';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { REASON_MAX_LENGTH, ReasonField } from '@shared/components/reason-field/reason-field';
import { limaNow } from '@shared/utils/lima-date';
import { valueOf } from '@shared/utils/resource';
import { Observable } from 'rxjs';

/**
 * `reject` a PENDING application, `cancel` an APPROVED / NO_SHOW one, or (ADMIN) close one by
 * `contingency` once its pickup deadline passed. It comes from the route `data`.
 */
export type ReasonMode = 'reject' | 'cancel' | 'contingency';

interface ModeTexts {
  heading: string;
  subtitle: string;
  submit: string;
  icon: string;
  done: string;
  danger: boolean;
}

const TEXTS: Record<ReasonMode, ModeTexts> = {
  reject: {
    heading: 'Rechazar solicitud',
    subtitle: 'El motivo es obligatorio. Máximo 500 caracteres.',
    submit: 'Confirmar rechazo',
    icon: 'close',
    done: 'Solicitud rechazada',
    danger: true,
  },
  cancel: {
    heading: 'Cancelar solicitud',
    subtitle: 'El motivo es obligatorio. Máximo 500 caracteres.',
    submit: 'Confirmar cancelación',
    icon: 'delete',
    done: 'Adopción cancelada. La mascota vuelve al catálogo',
    danger: true,
  },
  contingency: {
    heading: 'Cierre por contingencia',
    subtitle: 'Solo administrador. Disponible tras vencer el límite de recojo.',
    submit: 'Cerrar por contingencia',
    icon: 'gavel',
    done: 'Adopción completada por contingencia',
    danger: false,
  },
};

/** Staff: rejects, cancels or closes by contingency an application. The adopter sees the reason. */
@Component({
  selector: 'app-application-reason',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PanelHeader,
    ErrorState,
    ReasonField,
  ],
  templateUrl: './application-reason.html',
  styleUrl: './application-reason.scss',
})
export class ApplicationReason {
  private readonly applicationApi = inject(ApplicationApi);
  private readonly router = inject(Router);
  private readonly notify = inject(Notify);

  /** Route param :id and `data.mode` (component input binding). */
  readonly id = input.required<string>();
  readonly mode = input.required<ReasonMode>();

  protected readonly texts = computed(() => TEXTS[this.mode()]);
  protected readonly backPath = computed(() => `/staff/applications/${this.id()}`);

  protected readonly application = rxResource({
    params: () => Number(this.id()),
    stream: ({ params: id }) => this.applicationApi.get(id),
  });
  protected readonly current = computed(() => valueOf(this.application));

  /** Why the action cannot be done now (the application changed meanwhile, or it is too early). */
  protected readonly blocked = computed(() => {
    const application = this.current();
    if (!application) return null;
    switch (this.mode()) {
      case 'reject':
        return application.status === 'PENDING' ? null : 'Esta solicitud ya no está pendiente.';
      case 'cancel':
        return application.status === 'APPROVED' || application.status === 'NO_SHOW'
          ? null
          : 'Esta solicitud ya no se puede cancelar.';
      case 'contingency':
        if (application.status !== 'APPROVED') return 'Esta solicitud ya no está aprobada.';
        if (!application.appointment || limaNow() <= application.appointment.pickupDeadline) {
          return 'El límite de recojo todavía no vence: completa la adopción de la forma habitual.';
        }
        return application.hasSignedAct
          ? null
          : 'Primero sube el acta firmada; luego podrás cerrar por contingencia.';
    }
  });

  protected readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(REASON_MAX_LENGTH)],
  });
  /** `[formGroup]` is what makes Angular handle the submit (otherwise the browser reloads the page). */
  protected readonly form = new FormGroup({ reason: this.reason });

  protected readonly saving = signal(false);

  protected save(application: ApplicationResponse): void {
    const reason = this.reason.value.trim();
    if (!reason) {
      this.reason.setValue(reason);
      this.reason.markAsTouched();
      return;
    }
    const calls: Record<ReasonMode, () => Observable<ApplicationResponse>> = {
      reject: () => this.applicationApi.reject(application.id, { reason }),
      cancel: () => this.applicationApi.cancel(application.id, { reason }),
      contingency: () => this.applicationApi.completeByContingency(application.id, { reason }),
    };

    this.saving.set(true);
    calls[this.mode()]().subscribe({
      next: () => {
        this.notify.success(this.texts().done);
        void this.router.navigateByUrl(this.backPath());
      },
      error: (error: unknown) => {
        this.saving.set(false);
        if (!(error instanceof ApiError)) return;
        if (applyServerErrors(this.form, error).length === 0 && !error.notified) {
          error.notified = true;
          this.notify.error(error.message);
        }
        if (error.isConflict) {
          this.application.reload();
        }
      },
    });
  }
}

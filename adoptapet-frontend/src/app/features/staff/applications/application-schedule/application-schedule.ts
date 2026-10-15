import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { ApplicationApi } from '@core/api/application-api';
import { DeliverySlotApi } from '@core/api/delivery-slot-api';
import { AuthStore } from '@core/auth/auth-store';
import { ApiError } from '@core/errors/api-error';
import { applyServerErrors } from '@core/errors/server-errors';
import { ApplicationResponse, ScheduleRequest } from '@core/models/application';
import { SlotAvailabilityResponse } from '@core/models/delivery-slot';
import { Notify } from '@core/ui/notify';
import { ErrorState } from '@shared/components/error-state/error-state';
import { FieldError } from '@shared/components/field-error/field-error';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { limaToday } from '@shared/utils/lima-date';
import { valueOf } from '@shared/utils/resource';
import { Observable } from 'rxjs';

/** Same limit as the backend (ApplicationService.MAX_RESCHEDULES). */
const MAX_RESCHEDULES = 2;
/** Minutes after the end of the window the backend gives, at least, to pick up the pet. */
const PICKUP_TOLERANCE_MIN = 30;

/** `approve` (PENDING → APPROVED) or `reschedule` (APPROVED / NO_SHOW); it comes from the route `data`. */
export type ScheduleMode = 'approve' | 'reschedule';

/**
 * Staff: picks the delivery appointment to approve an application or to move it. The windows come
 * with their live capacity; the full or already started ones cannot be chosen.
 */
@Component({
  selector: 'app-application-schedule',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PanelHeader,
    ErrorState,
    FieldError,
  ],
  templateUrl: './application-schedule.html',
  styleUrl: './application-schedule.scss',
})
export class ApplicationSchedule {
  private readonly applicationApi = inject(ApplicationApi);
  private readonly slotApi = inject(DeliverySlotApi);
  private readonly router = inject(Router);
  private readonly notify = inject(Notify);
  private readonly isAdmin = inject(AuthStore).isAdmin;

  /** Route param :id and `data.mode` (component input binding). */
  readonly id = input.required<string>();
  readonly mode = input.required<ScheduleMode>();

  protected readonly approving = computed(() => this.mode() === 'approve');
  protected readonly backPath = computed(() => `/staff/applications/${this.id()}`);
  protected readonly today = limaToday();

  protected readonly application = rxResource({
    params: () => Number(this.id()),
    stream: ({ params: id }) => this.applicationApi.get(id),
  });
  protected readonly current = computed(() => valueOf(this.application));

  /** Reschedules used up: only an ADMIN can add one more, explaining why in the observation. */
  protected readonly extraReschedule = computed(
    () => !this.approving() && (this.current()?.rescheduleCount ?? 0) >= MAX_RESCHEDULES,
  );

  /** Why this action cannot be done now (the application changed, or the role is not enough). */
  protected readonly blocked = computed(() => {
    const application = this.current();
    if (!application) return null;
    if (this.approving()) {
      return application.status === 'PENDING' ? null : 'Esta solicitud ya no está pendiente.';
    }
    if (application.status !== 'APPROVED' && application.status !== 'NO_SHOW') {
      return 'Esta solicitud ya no tiene una entrega que reprogramar.';
    }
    if (this.extraReschedule() && !this.isAdmin()) {
      return `Ya se usaron las ${MAX_RESCHEDULES} reprogramaciones. Solo un administrador puede autorizar otra.`;
    }
    return null;
  });

  protected readonly form = inject(FormBuilder).nonNullable.group({
    deliveryDate: [this.today, Validators.required],
    /** Start time of the chosen window ("14:00:00"). */
    slot: ['', Validators.required],
    pickupDeadline: ['', Validators.required],
    observation: ['', Validators.maxLength(500)],
  });
  protected readonly controls = this.form.controls;

  /** The date as a signal, so the windows are asked again when it changes. */
  protected readonly date = signal(this.today);

  protected readonly slots = rxResource({
    params: () => this.date(),
    stream: ({ params: date }) => this.slotApi.availability(date),
  });

  protected readonly chosen = signal('');
  protected readonly slot = computed(() =>
    valueOf(this.slots)?.find((slot) => slot.startTime === this.chosen()),
  );

  /** "10:00–12:00 sin cupos." for the windows that cannot be chosen. */
  protected readonly unavailableText = computed(() =>
    (valueOf(this.slots) ?? [])
      .filter((slot) => !slot.available)
      .map((slot) => `${range(slot)} ${slot.expired ? 'ya inició' : 'sin cupos'}.`)
      .join(' '),
  );
  protected readonly noneAvailable = computed(() => {
    const slots = valueOf(this.slots);
    return !!slots && !slots.some((slot) => slot.available);
  });

  protected readonly saving = signal(false);

  constructor() {
    effect(() => {
      if (this.extraReschedule()) {
        this.controls.observation.addValidators(Validators.required);
        this.controls.observation.updateValueAndValidity();
      }
    });
    // Picks the first free window of the day, so the usual case is one click. Late in the day, when
    // every window of today already started, it moves to tomorrow once.
    effect(() => {
      const slots = valueOf(this.slots);
      if (slots) {
        if (this.date() === this.today && slots.length > 0 && slots.every((slot) => slot.expired)) {
          this.setDate(nextDay(this.today));
          return;
        }
        const first = slots.find((slot) => slot.available);
        this.choose(first?.startTime ?? '');
      }
    });
  }

  protected range = range;

  protected option(slot: SlotAvailabilityResponse): string {
    return `${range(slot)} · ${freeText(slot)}`;
  }

  protected freeText = freeText;

  protected onDate(value: string): void {
    if (value && value !== this.date()) {
      this.setDate(value);
    }
  }

  private setDate(value: string): void {
    this.date.set(value);
    this.controls.deliveryDate.setValue(value);
  }

  protected choose(startTime: string): void {
    this.chosen.set(startTime);
    this.controls.slot.setValue(startTime);
    const slot = valueOf(this.slots)?.find((item) => item.startTime === startTime);
    this.controls.pickupDeadline.setValue(
      slot ? `${this.date()}T${addMinutes(slot.endTime, PICKUP_TOLERANCE_MIN)}` : '',
    );
  }

  protected save(application: ApplicationResponse): void {
    const slot = this.slot();
    if (this.form.invalid || !slot?.available) {
      this.form.markAllAsTouched();
      return;
    }
    const { pickupDeadline, observation } = this.form.getRawValue();
    const schedule: ScheduleRequest = {
      deliveryDate: this.date(),
      startTime: slot.startTime.slice(0, 5),
      endTime: slot.endTime.slice(0, 5),
      pickupDeadline,
      observation: observation.trim() || undefined,
    };
    const call: Observable<ApplicationResponse> = this.approving()
      ? this.applicationApi.approve(application.id, schedule)
      : this.applicationApi.reschedule(application.id, schedule);

    this.saving.set(true);
    call.subscribe({
      next: () => {
        this.notify.success(
          this.approving() ? 'Solicitud aprobada y entrega agendada' : 'Entrega reprogramada',
        );
        void this.router.navigateByUrl(this.backPath());
      },
      error: (error: unknown) => {
        this.saving.set(false);
        if (!(error instanceof ApiError)) return;
        if (applyServerErrors(this.form, error).length === 0 && !error.notified) {
          error.notified = true;
          this.notify.error(error.message);
        }
        // a window may have filled up meanwhile
        if (error.isConflict) {
          this.slots.reload();
          this.application.reload();
        }
      },
    });
  }
}

/** "10:00–12:00" */
function range(slot: SlotAvailabilityResponse): string {
  return `${slot.startTime.slice(0, 5)}–${slot.endTime.slice(0, 5)}`;
}

function freeText(slot: SlotAvailabilityResponse): string {
  if (slot.expired) return 'ya inició';
  if (slot.free <= 0) return 'sin cupos';
  return slot.free === 1 ? '1 cupo libre' : `${slot.free} cupos libres`;
}

/** "2026-10-14" → "2026-10-15" */
function nextDay(date: string): string {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

/** "16:00:00" + 30 → "16:30" */
function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

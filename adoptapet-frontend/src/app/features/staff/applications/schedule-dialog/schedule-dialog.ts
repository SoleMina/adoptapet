import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DeliverySlotApi } from '@core/api/delivery-slot-api';
import { ScheduleRequest } from '@core/models/application';
import { SlotAvailabilityResponse } from '@core/models/delivery-slot';
import { ErrorState } from '@shared/components/error-state/error-state';
import { limaToday } from '@shared/utils/lima-date';
import { valueOf } from '@shared/utils/resource';

export interface ScheduleData {
  title: string;
  message: string;
  confirmLabel: string;
  /** An ADMIN rescheduling beyond the limit has to explain why. */
  requireObservation?: boolean;
}

/** Minutes after the end of the window the backend gives, at least, to pick up the pet. */
const PICKUP_TOLERANCE_MIN = 30;

/** Picks the delivery appointment: day, window (with live capacity), pickup deadline and observation. */
@Component({
  selector: 'app-schedule-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, ErrorState],
  templateUrl: './schedule-dialog.html',
  styleUrl: './schedule-dialog.scss',
})
export class ScheduleDialog {
  protected readonly data = inject<ScheduleData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<ScheduleDialog, ScheduleRequest>>(MatDialogRef);
  private readonly slotApi = inject(DeliverySlotApi);

  protected readonly today = limaToday();
  protected readonly date = signal(this.today);
  /** Start time of the chosen window ("10:00:00"), or null. */
  protected readonly selected = signal<string | null>(null);
  protected readonly submitted = signal(false);

  protected readonly slots = rxResource({
    params: () => this.date(),
    stream: ({ params: date }) => this.slotApi.availability(date),
  });

  protected readonly slot = computed(() =>
    valueOf(this.slots)?.find((slot) => slot.startTime === this.selected() && slot.available),
  );

  protected readonly deadline = new FormControl('', {
    nonNullable: true,
    validators: Validators.required,
  });
  protected readonly observation = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.maxLength(500),
      ...(this.data.requireObservation ? [Validators.required] : []),
    ],
  });

  /** `[formGroup]` is what makes Angular handle the submit (otherwise the browser reloads the page). */
  protected readonly form = new FormGroup({
    deadline: this.deadline,
    observation: this.observation,
  });

  protected onDate(value: string): void {
    if (!value) return;
    this.date.set(value);
    this.selected.set(null);
  }

  protected choose(slot: SlotAvailabilityResponse): void {
    this.selected.set(slot.startTime);
    this.deadline.setValue(addMinutes(slot.endTime, PICKUP_TOLERANCE_MIN));
  }

  protected slotNote(slot: SlotAvailabilityResponse): string {
    if (slot.expired) return 'Ya pasó';
    if (slot.free <= 0) return 'Sin cupos';
    return slot.free === 1 ? '1 cupo libre' : `${slot.free} cupos libres`;
  }

  protected submit(): void {
    this.submitted.set(true);
    this.observation.markAsTouched();
    const slot = this.slot();
    if (!slot || this.deadline.invalid || this.observation.invalid) {
      return;
    }
    this.dialogRef.close({
      deliveryDate: this.date(),
      startTime: slot.startTime.slice(0, 5),
      endTime: slot.endTime.slice(0, 5),
      pickupDeadline: `${this.date()}T${this.deadline.value}`,
      observation: this.observation.value.trim() || undefined,
    });
  }
}

/** "12:00:00" + 30 → "12:30" */
function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

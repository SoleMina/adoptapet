import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FieldError } from '../field-error/field-error';

export interface ReasonData {
  title: string;
  message: string;
  /** Label of the textarea. */
  label: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
}

const MAX_LENGTH = 500;

/** Asks for the reason of a reject, a cancel or a contingency close. Open it with `Confirm.askReason`. */
@Component({
  selector: 'app-reason-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, FieldError],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <p class="message">{{ data.message }}</p>
        <div class="ap-field">
          <label class="ap-field__label" for="reason">{{ data.label }}</label>
          <textarea
            id="reason"
            class="ap-input"
            rows="4"
            formControlName="reason"
            [maxLength]="maxLength"
            [attr.aria-invalid]="reason.invalid && reason.touched"
            aria-describedby="reason-count reason-error"
            cdkFocusInitial
          ></textarea>
          <p class="ap-field__hint" id="reason-count">
            {{ reason.value.length }} / {{ maxLength }}
          </p>
          <app-field-error [control]="reason" errorId="reason-error" />
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton="tonal" type="button" mat-dialog-close>Volver</button>
        <button matButton="filled" type="submit" [class.danger]="data.tone === 'danger'">
          {{ data.confirmLabel }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .message {
      margin-bottom: var(--ap-space-4);
      color: var(--ap-color-text-muted);
    }

    .danger {
      --mat-button-filled-container-color: var(--ap-color-danger);
      --mat-button-filled-label-text-color: #fff;
    }
  `,
})
export class ReasonDialog {
  protected readonly data = inject<ReasonData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<ReasonDialog, string>>(MatDialogRef);

  protected readonly maxLength = MAX_LENGTH;
  protected readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(MAX_LENGTH)],
  });

  /** `[formGroup]` is what makes Angular handle the submit (otherwise the browser reloads the page). */
  protected readonly form = new FormGroup({ reason: this.reason });

  protected submit(): void {
    const text = this.reason.value.trim();
    if (!text) {
      this.reason.setValue(text);
      this.reason.markAsTouched();
      return;
    }
    this.dialogRef.close(text);
  }
}

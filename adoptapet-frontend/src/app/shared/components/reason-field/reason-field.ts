import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FieldError } from '../field-error/field-error';

/** Max length of every reason the backend stores (reject, cancel, contingency, deactivate). */
export const REASON_MAX_LENGTH = 500;

/** "Motivo" textarea of the action pages, with its counter. Put it inside the page's `[formGroup]`. */
@Component({
  selector: 'app-reason-field',
  imports: [ReactiveFormsModule, FieldError],
  template: `
    <div class="ap-field">
      <label class="ap-field__label" for="reason">
        {{ label() }}
        @if (required()) {
          <span class="required" aria-hidden="true">*</span>
        } @else {
          <span class="optional">(opcional)</span>
        }
      </label>
      <textarea
        id="reason"
        class="ap-input"
        rows="5"
        placeholder="Completar"
        [formControl]="control()"
        [maxLength]="maxLength"
        [attr.aria-required]="required()"
        [attr.aria-invalid]="control().invalid && control().touched"
        aria-describedby="reason-count reason-error"
      ></textarea>
      <div class="under">
        <app-field-error [control]="control()" errorId="reason-error" />
        <p class="count" id="reason-count">{{ control().value.length }}/{{ maxLength }}</p>
      </div>
    </div>
  `,
  styles: `
    .required {
      color: var(--ap-color-danger);
    }

    .optional {
      font-weight: 400;
      color: var(--ap-color-text-muted);
    }

    .under {
      display: flex;
      align-items: flex-start;
      gap: var(--ap-space-3);
    }

    .count {
      margin-left: auto;
      font-size: var(--ap-font-size-sm);
      color: var(--ap-color-text-muted);
    }
  `,
})
export class ReasonField {
  readonly control = input.required<FormControl<string>>();
  readonly required = input(true);
  readonly label = input('Motivo');

  protected readonly maxLength = REASON_MAX_LENGTH;
}

import { Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { errorMessage } from '@shared/validators/validators';
import { startWith, switchMap } from 'rxjs';

/**
 * Message under a field, shown once the user touched it. Give it the same `id` used in the input's
 * `aria-describedby` so screen readers read it.
 */
@Component({
  selector: 'app-field-error',
  template: `
    @if (message(); as text) {
      <p class="ap-field__error" [id]="errorId()" role="alert">{{ text }}</p>
    }
  `,
})
export class FieldError {
  readonly control = input.required<AbstractControl>();
  readonly errorId = input<string>();

  /** Re-evaluates on every value/status/touched change of the control. */
  private readonly controlEvent = toSignal(
    toObservable(this.control).pipe(switchMap((control) => control.events.pipe(startWith(null)))),
  );

  protected readonly message = computed(() => {
    this.controlEvent();
    const control = this.control();
    return control.invalid && control.touched ? errorMessage(control.errors) : null;
  });
}

import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldError } from '@shared/components/field-error/field-error';
import { ProfileForm } from './profile-editor';

/**
 * The editable personal data of "Mi perfil" (names, email, DNI, birth date, phone, address).
 * `emailFirst` puts the email before the names, as in the staff design.
 */
@Component({
  selector: 'app-profile-fields',
  imports: [ReactiveFormsModule, FieldError],
  templateUrl: './profile-fields.html',
  styles: `
    .email-first .field--email {
      order: -1;
    }

    .field--wide {
      grid-column: 1 / -1;
    }

    .optional {
      font-weight: 400;
      color: var(--ap-color-text-muted);
    }
  `,
})
export class ProfileFields {
  readonly form = input.required<ProfileForm>();
  readonly emailFirst = input(false);
  /** false when the page shows the email somewhere else (account section of the user form). */
  readonly showEmail = input(true);

  /** The newest allowed birth date (yesterday), for the date picker. */
  protected readonly maxBirthDate = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

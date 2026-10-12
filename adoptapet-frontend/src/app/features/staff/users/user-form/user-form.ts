import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { UserApi } from '@core/api/user-api';
import { ApiError } from '@core/errors/api-error';
import { applyServerErrors } from '@core/errors/server-errors';
import { ROLE_LABEL } from '@core/i18n/labels';
import { UserResponse } from '@core/models/user';
import { Notify } from '@core/ui/notify';
import { ErrorState } from '@shared/components/error-state/error-state';
import { FieldError } from '@shared/components/field-error/field-error';
import { ProfileFields } from '@shared/profile/profile-fields';
import { valueOf } from '@shared/utils/resource';
import { AppValidators } from '@shared/validators/validators';

/** What the form is used for; it comes from the route `data`. */
export type UserFormMode = 'create-worker' | 'edit-worker' | 'edit-user';

const TEXTS: Record<
  UserFormMode,
  { heading: string; back: string; backPath: string; submit: string }
> = {
  'create-worker': {
    heading: 'Crear trabajador',
    back: 'Volver a trabajadores',
    backPath: '/staff/workers',
    submit: 'Crear trabajador',
  },
  'edit-worker': {
    heading: 'Editar trabajador',
    back: 'Volver a trabajadores',
    backPath: '/staff/workers',
    submit: 'Guardar cambios',
  },
  'edit-user': {
    heading: 'Editar usuario',
    back: 'Volver a usuarios',
    backPath: '/staff/users',
    submit: 'Guardar cambios',
  },
};

/** Unique fields the backend rejects with 409. */
const CONFLICT_FIELDS: Record<string, string> = {
  'Username is already registered': 'username',
  'Email is already registered': 'email',
  'DNI is already registered': 'dni',
};

/**
 * ADMIN: creates a worker (POST /users/workers) or edits any account (PUT /users/{id}).
 * The backend does not change the username, the role or the password on edit, so the username is
 * read-only there and there is no password field.
 */
@Component({
  selector: 'app-user-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    ProfileFields,
    FieldError,
    ErrorState,
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
})
export class UserForm {
  private readonly userApi = inject(UserApi);
  private readonly router = inject(Router);
  private readonly notify = inject(Notify);
  private readonly fb = inject(FormBuilder).nonNullable;

  /** Route `data.mode` and param `:id` (component input binding). */
  readonly mode = input.required<UserFormMode>();
  readonly id = input<string>();

  protected readonly texts = computed(() => TEXTS[this.mode()]);
  protected readonly creating = computed(() => this.mode() === 'create-worker');
  protected readonly roleLabel = ROLE_LABEL;

  protected readonly user = rxResource({
    params: () => (this.id() === undefined ? undefined : Number(this.id())),
    stream: ({ params: id }) => this.userApi.get(id),
  });
  protected readonly loaded = computed(() => valueOf(this.user));

  protected readonly form = this.fb.group({
    account: this.fb.group({
      username: ['', [Validators.required, Validators.maxLength(50), AppValidators.username]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    }),
    // Same shape as "Mi perfil", so the personal fields component is shared.
    person: this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      dni: ['', [Validators.required, AppValidators.dni]],
      birthDate: ['', [Validators.required, AppValidators.pastDate]],
      phone: ['', [Validators.required, AppValidators.phone]],
      address: ['', Validators.maxLength(250)],
    }),
  });
  protected readonly account = this.form.controls.account.controls;
  protected readonly person = this.form.controls.person;

  protected readonly showPassword = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (!this.creating()) {
        // On edit there is no password and the username cannot change.
        this.form.controls.account.disable();
      }
    });
    effect(() => {
      const user = this.loaded();
      if (user) {
        this.fill(user);
      }
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { account, person } = this.form.getRawValue();
    const data = {
      firstName: person.firstName.trim(),
      lastName: person.lastName.trim(),
      email: person.email.trim(),
      dni: person.dni.trim(),
      birthDate: person.birthDate,
      phone: person.phone.trim(),
      address: person.address.trim() || undefined,
    };
    const user = this.loaded();
    const call = user
      ? this.userApi.update(user.id, data)
      : this.userApi.createWorker({
          ...data,
          username: account.username.trim(),
          password: account.password,
        });

    this.saving.set(true);
    this.error.set(null);
    call.subscribe({
      next: (saved) => {
        this.notify.success(
          user
            ? `Guardamos los cambios de ${saved.firstName}`
            : `${saved.firstName} ya puede iniciar sesión como trabajador`,
        );
        void this.router.navigateByUrl(this.texts().backPath);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        if (error instanceof ApiError) {
          this.showServerError(error);
        }
      },
    });
  }

  private fill(user: UserResponse): void {
    this.form.reset({
      account: { username: user.username, password: '' },
      person: {
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        dni: user.dni ?? '',
        birthDate: user.birthDate ?? '',
        phone: user.phone ?? '',
        address: user.address ?? '',
      },
    });
  }

  private showServerError(error: ApiError): void {
    const field = CONFLICT_FIELDS[error.detail];
    const control = field
      ? (this.form.get(['account', field]) ?? this.form.get(['person', field]))
      : null;
    if (control) {
      control.setErrors({ server: error.message });
      control.markAsTouched();
      return;
    }
    if (applyServerErrors(this.form, error).length === 0 && !error.notified) {
      error.notified = true;
      this.error.set(error.message);
    }
  }
}

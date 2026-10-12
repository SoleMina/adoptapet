import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { UserApi } from '@core/api/user-api';
import { AuthStore } from '@core/auth/auth-store';
import { ApiError } from '@core/errors/api-error';
import { applyServerErrors } from '@core/errors/server-errors';
import { ROLE_LABEL } from '@core/i18n/labels';
import { UpdateUserRequest, UserResponse } from '@core/models/user';
import { Notify } from '@core/ui/notify';
import { initialsOf } from '@shared/utils/initials';
import { valueOf } from '@shared/utils/resource';
import { AppValidators } from '@shared/validators/validators';

/** Unique fields the backend rejects with 409. */
const CONFLICT_FIELDS: Record<string, 'email' | 'dni'> = {
  'Email is already registered': 'email',
  'DNI is already registered': 'dni',
};

/**
 * State and actions of "Mi perfil": loads the signed-in user (GET /users/me), validates like the backend
 * and saves (PUT /users/me). The adopter page and the staff page share it and only differ in their template.
 * Provide it in the component: `providers: [ProfileEditor]`.
 */
@Injectable()
export class ProfileEditor {
  private readonly userApi = inject(UserApi);
  private readonly auth = inject(AuthStore);
  private readonly notify = inject(Notify);

  readonly roleLabel = ROLE_LABEL;

  /** Fresh copy from the server: the session may hold data edited somewhere else. */
  readonly profile = rxResource({ stream: () => this.userApi.me() });
  readonly user = computed(() => valueOf(this.profile));
  readonly initials = computed(() => initialsOf(this.user() ?? {}));

  readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    dni: ['', [Validators.required, AppValidators.dni]],
    birthDate: ['', [Validators.required, AppValidators.pastDate]],
    phone: ['', [Validators.required, AppValidators.phone]],
    address: ['', Validators.maxLength(250)],
  });

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const user = this.user();
      if (user) {
        this.fill(user);
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.userApi.updateMe(this.toRequest()).subscribe({
      next: (user) => {
        this.saving.set(false);
        this.profile.set(user);
        this.auth.updateUser(user);
        this.notify.success('Guardamos tus cambios');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        if (error instanceof ApiError) {
          this.showServerError(error);
        }
      },
    });
  }

  /** Back to what is saved. */
  cancel(): void {
    const user = this.user();
    if (user) {
      this.fill(user);
    }
    this.error.set(null);
  }

  private fill(user: UserResponse): void {
    this.form.reset({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      dni: user.dni ?? '',
      birthDate: user.birthDate ?? '',
      phone: user.phone ?? '',
      address: user.address ?? '',
    });
  }

  private toRequest(): UpdateUserRequest {
    const value = this.form.getRawValue();
    return {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      dni: value.dni.trim(),
      birthDate: value.birthDate,
      phone: value.phone.trim(),
      address: value.address.trim() || undefined,
    };
  }

  private showServerError(error: ApiError): void {
    const conflict = CONFLICT_FIELDS[error.detail];
    if (conflict) {
      this.form.controls[conflict].setErrors({ server: error.message });
      this.form.controls[conflict].markAsTouched();
      return;
    }
    if (applyServerErrors(this.form, error).length === 0 && !error.notified) {
      error.notified = true;
      this.error.set(error.message);
    }
  }
}

export type ProfileForm = ProfileEditor['form'];

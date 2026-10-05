import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserApi } from '@core/api/user-api';
import { AuthStore } from '@core/auth/auth-store';
import { ApiError } from '@core/errors/api-error';
import { applyServerErrors } from '@core/errors/server-errors';
import { ROLE_LABEL } from '@core/i18n/labels';
import { UpdateUserRequest, UserResponse } from '@core/models/user';
import { Notify } from '@core/ui/notify';
import { ErrorState } from '@shared/components/error-state/error-state';
import { FieldError } from '@shared/components/field-error/field-error';
import { PageHero } from '@shared/components/page-hero/page-hero';
import { initialsOf } from '@shared/utils/initials';
import { valueOf } from '@shared/utils/resource';
import { AppValidators } from '@shared/validators/validators';

/** Unique fields the backend rejects with 409. */
const CONFLICT_FIELDS: Record<string, 'email' | 'dni'> = {
  'Email is already registered': 'email',
  'DNI is already registered': 'dni',
};

/** The signed-in user's data. Username and role are read-only; the rest goes to PUT /users/me. */
@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule, PageHero, FieldError, ErrorState],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly userApi = inject(UserApi);
  private readonly auth = inject(AuthStore);
  private readonly notify = inject(Notify);

  protected readonly roleLabel = ROLE_LABEL;
  /** The newest allowed birth date (yesterday), for the date picker. */
  protected readonly maxBirthDate = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  /** Fresh copy from the server: the session may hold data edited somewhere else. */
  protected readonly profile = rxResource({ stream: () => this.userApi.me() });
  protected readonly user = computed(() => valueOf(this.profile));
  protected readonly initials = computed(() => initialsOf(this.user() ?? {}));

  protected readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    dni: ['', [Validators.required, AppValidators.dni]],
    birthDate: ['', [Validators.required, AppValidators.pastDate]],
    phone: ['', [Validators.required, AppValidators.phone]],
    address: ['', Validators.maxLength(250)],
  });
  protected readonly controls = this.form.controls;

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const user = this.user();
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
  protected cancel(): void {
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
      this.controls[conflict].setErrors({ server: error.message });
      this.controls[conflict].markAsTouched();
      return;
    }
    if (applyServerErrors(this.form, error).length === 0 && !error.notified) {
      error.notified = true;
      this.error.set(error.message);
    }
  }
}

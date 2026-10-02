import { Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '@core/auth/auth';
import { ApiError } from '@core/errors/api-error';
import { applyServerErrors } from '@core/errors/server-errors';
import { RegisterRequest } from '@core/models/user';
import { Notify } from '@core/ui/notify';
import { FieldError } from '@shared/components/field-error/field-error';
import { PageHeader } from '@shared/components/page-header/page-header';
import { AppValidators } from '@shared/validators/validators';

type Step = 1 | 2;

/** Unique fields the backend rejects with 409, and the step where each one is. */
const CONFLICT_FIELDS: Record<string, { field: string; step: Step }> = {
  'Username is already registered': { field: 'username', step: 1 },
  'Email is already registered': { field: 'email', step: 1 },
  'DNI is already registered': { field: 'dni', step: 2 },
};

const ACCOUNT_FIELDS = ['username', 'email', 'password', 'confirmPassword'];

/** Adopter registration: 1. account → 2. personal data, then automatic login. */
@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PageHeader,
    FieldError,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly notify = inject(Notify);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly returnUrl = input<string>();

  protected readonly step = signal<Step>(1);
  protected readonly heading = computed(() => `Crear cuenta · Paso ${this.step()}`);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  /** The newest allowed birth date (yesterday), for the date picker. */
  protected readonly maxBirthDate = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  protected readonly form = this.fb.group({
    account: this.fb.group(
      {
        username: ['', [Validators.required, Validators.maxLength(50), AppValidators.username]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
        password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: AppValidators.matchFields('password', 'confirmPassword') },
    ),
    personal: this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      dni: ['', [Validators.required, AppValidators.dni]],
      birthDate: ['', [Validators.required, AppValidators.pastDate]],
      phone: ['', [Validators.required, AppValidators.phone]],
      address: ['', Validators.maxLength(250)],
    }),
  });

  protected readonly account = this.form.controls.account.controls;
  protected readonly personal = this.form.controls.personal.controls;

  protected next(): void {
    if (this.touchInvalid(this.form.controls.account)) {
      return;
    }
    this.goTo(2);
  }

  protected back(): void {
    this.goTo(1);
  }

  protected submit(): void {
    if (this.touchInvalid(this.form.controls.personal)) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.auth.register(this.toRequest()).subscribe({
      next: (user) => {
        this.notify.success(`¡Tu cuenta está lista, ${user.firstName}!`);
        void this.router.navigateByUrl(this.auth.urlAfterLogin(user.role, this.returnUrl()));
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        if (error instanceof ApiError) {
          this.showServerError(error);
        }
      },
    });
  }

  private showServerError(error: ApiError): void {
    const conflict = CONFLICT_FIELDS[error.detail];
    if (conflict) {
      const control =
        this.form.get(['account', conflict.field]) ?? this.form.get(['personal', conflict.field]);
      control?.setErrors({ server: error.message });
      control?.markAsTouched();
      this.goTo(conflict.step);
      return;
    }
    const fields = applyServerErrors(this.form, error);
    if (fields.some((field) => ACCOUNT_FIELDS.includes(field))) {
      this.goTo(1);
    } else if (!error.notified) {
      error.notified = true;
      this.error.set(error.message);
    }
  }

  private toRequest(): RegisterRequest {
    const { account, personal } = this.form.getRawValue();
    return {
      username: account.username.trim(),
      email: account.email.trim(),
      password: account.password,
      firstName: personal.firstName.trim(),
      lastName: personal.lastName.trim(),
      dni: personal.dni.trim(),
      birthDate: personal.birthDate,
      phone: personal.phone.trim(),
      address: personal.address.trim() || undefined,
    };
  }

  /** Marks the group as touched and focuses the first wrong field. Returns true if invalid. */
  private touchInvalid(group: FormGroup): boolean {
    if (group.valid) {
      return false;
    }
    group.markAllAsTouched();
    setTimeout(() =>
      this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
    );
    return true;
  }

  private goTo(step: Step): void {
    this.step.set(step);
    // Focus the first field of the step that just appeared (keyboard and screen reader users).
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('form .ap-input')?.focus());
  }
}

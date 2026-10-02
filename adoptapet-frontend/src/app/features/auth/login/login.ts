import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '@core/auth/auth';
import { ApiError } from '@core/errors/api-error';
import { FieldError } from '@shared/components/field-error/field-error';
import { PageHeader } from '@shared/components/page-header/page-header';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PageHeader,
    FieldError,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  /** ?returnUrl= set by authGuard or by "Quiero adoptarla". */
  readonly returnUrl = input<string>();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (user) =>
        void this.router.navigateByUrl(this.auth.urlAfterLogin(user.role, this.returnUrl())),
      error: (error: unknown) => {
        this.submitting.set(false);
        if (error instanceof ApiError && !error.notified) {
          error.notified = true;
          this.error.set(error.message);
        }
      },
    });
  }
}

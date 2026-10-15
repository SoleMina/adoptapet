import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { UserApi } from '@core/api/user-api';
import { AuthStore } from '@core/auth/auth-store';
import { ApiError } from '@core/errors/api-error';
import { applyServerErrors } from '@core/errors/server-errors';
import { ROLE_LABEL } from '@core/i18n/labels';
import { UserResponse } from '@core/models/user';
import { Notify } from '@core/ui/notify';
import { Avatar } from '@shared/components/avatar/avatar';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { REASON_MAX_LENGTH, ReasonField } from '@shared/components/reason-field/reason-field';
import { valueOf } from '@shared/utils/resource';

/**
 * ADMIN: deactivates an account (it cannot sign in; the data is kept). Reached from Usuarios,
 * Trabajadores or the adopter detail; `?from=` says where to go back.
 */
@Component({
  selector: 'app-user-deactivate',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PanelHeader,
    Avatar,
    ErrorState,
    ReasonField,
  ],
  templateUrl: './user-deactivate.html',
  styleUrl: '../../pets/pet-deactivate/deactivate-page.scss',
})
export class UserDeactivate {
  private readonly userApi = inject(UserApi);
  private readonly router = inject(Router);
  private readonly notify = inject(Notify);
  private readonly store = inject(AuthStore);

  /** Route param :id and query param ?from (component input binding). */
  readonly id = input.required<string>();
  readonly from = input<string>();

  /** Only paths of the panel, so the link cannot send the admin anywhere else. */
  protected readonly backPath = computed(() => {
    const from = this.from();
    return from?.startsWith('/staff/') ? from : '/staff/users';
  });
  protected readonly roleLabel = ROLE_LABEL;

  protected readonly user = rxResource({
    params: () => Number(this.id()),
    stream: ({ params: id }) => this.userApi.get(id),
  });
  protected readonly current = computed(() => valueOf(this.user));

  /** Same rules as the backend. */
  protected readonly blocked = computed(() => {
    const user = this.current();
    if (!user) return null;
    if (user.id === this.store.user()?.id) return 'No puedes desactivar tu propia cuenta.';
    if (user.role === 'ADMIN') return 'Las cuentas de administrador no se pueden desactivar.';
    return user.active ? null : 'Esta cuenta ya está inactiva.';
  });

  protected readonly reason = new FormControl('', {
    nonNullable: true,
    validators: Validators.maxLength(REASON_MAX_LENGTH),
  });
  protected readonly form = new FormGroup({ reason: this.reason });
  protected readonly saving = signal(false);

  protected save(user: UserResponse): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.userApi.deactivate(user.id, this.reason.value.trim() || undefined).subscribe({
      next: () => {
        this.notify.success(`Desactivamos la cuenta de ${user.firstName}`);
        void this.router.navigateByUrl(this.backPath());
      },
      error: (error: unknown) => {
        this.saving.set(false);
        if (!(error instanceof ApiError)) return;
        if (applyServerErrors(this.form, error).length === 0 && !error.notified) {
          error.notified = true;
          this.notify.error(error.message);
        }
        if (error.isConflict) this.user.reload();
      },
    });
  }
}

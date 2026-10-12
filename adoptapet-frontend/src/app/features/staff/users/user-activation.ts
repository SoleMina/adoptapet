import { Injectable, inject } from '@angular/core';
import { UserApi } from '@core/api/user-api';
import { ApiError } from '@core/errors/api-error';
import { Confirm } from '@core/ui/confirm';
import { Notify } from '@core/ui/notify';
import { EMPTY, Observable, catchError, of, switchMap, tap } from 'rxjs';

interface Account {
  id: number;
  firstName: string;
  active: boolean;
}

/**
 * ADMIN: deactivate (after confirming) or reactivate an account. An inactive user cannot sign in;
 * the data is kept. Emits the new `active` value when it worked, nothing when cancelled or failed.
 */
@Injectable({ providedIn: 'root' })
export class UserActivation {
  private readonly userApi = inject(UserApi);
  private readonly confirm = inject(Confirm);
  private readonly notify = inject(Notify);

  toggle(account: Account): Observable<boolean> {
    const activate = !account.active;
    const confirmed: Observable<void> = activate
      ? of(undefined)
      : this.confirm.ask({
          title: `¿Desactivar a ${account.firstName}?`,
          message: 'No podrá iniciar sesión hasta que reactives su cuenta. Sus datos se conservan.',
          confirmLabel: 'Desactivar cuenta',
          tone: 'danger',
        });
    return confirmed.pipe(
      switchMap(() => this.userApi.setActive(account.id, activate)),
      tap((user) => this.notify.success(user.active ? 'Cuenta reactivada' : 'Cuenta desactivada')),
      switchMap((user) => of(user.active)),
      catchError((error: unknown) => {
        if (error instanceof ApiError && !error.notified) {
          error.notified = true;
          this.notify.error(error.message);
        }
        return EMPTY;
      }),
    );
  }
}

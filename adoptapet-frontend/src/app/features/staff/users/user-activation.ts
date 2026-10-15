import { Injectable, inject } from '@angular/core';
import { UserApi } from '@core/api/user-api';
import { ApiError } from '@core/errors/api-error';
import { UserResponse } from '@core/models/user';
import { Notify } from '@core/ui/notify';
import { EMPTY, Observable, catchError, tap } from 'rxjs';

/**
 * ADMIN: reactivates an account from a list (no confirmation needed: it gives access back).
 * Deactivating has its own page, `/staff/users/:id/deactivate`, where the reason is written.
 * Emits the updated user when it worked, nothing when it failed.
 */
@Injectable({ providedIn: 'root' })
export class UserActivation {
  private readonly userApi = inject(UserApi);
  private readonly notify = inject(Notify);

  activate(id: number): Observable<UserResponse> {
    return this.userApi.activate(id).pipe(
      tap(() => this.notify.success('Cuenta reactivada')),
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

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@core/auth/auth';
import { AuthStore } from '@core/auth/auth-store';
import { toApiError } from '@core/errors/api-error';
import { Notify } from '@core/ui/notify';
import { catchError, throwError } from 'rxjs';
import { apiUrl } from './api-url';

/**
 * Turns every HTTP error into an `ApiError` (Spanish message + field errors).
 * Handled here: 401 (session expired), 403, connection errors and 5xx.
 * 400/404/409 are left to the screen, which knows how to show them (inline, next to the form).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const store = inject(AuthStore);
  const notify = inject(Notify);
  const isLogin = req.url === apiUrl('/auth/login');

  return next(req).pipe(
    catchError((response: unknown) => {
      if (!(response instanceof HttpErrorResponse)) {
        return throwError(() => response);
      }
      const error = toApiError(response);
      if (error.status === 401 && !isLogin && store.isAuthenticated()) {
        auth.expire();
        error.notified = true;
      } else if ((error.status === 403 && !isLogin) || error.status === 0 || error.status >= 500) {
        notify.error(error.message);
        error.notified = true;
      }
      return throwError(() => error);
    }),
  );
};

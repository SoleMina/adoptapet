import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Loading } from '@core/ui/loading';
import { finalize } from 'rxjs';

/** Set it to true on background requests (e.g. notification polling) so they do not show the bar. */
export const SILENT_REQUEST = new HttpContextToken<boolean>(() => false);

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SILENT_REQUEST)) {
    return next(req);
  }
  const loading = inject(Loading);
  loading.start();
  return next(req).pipe(finalize(() => loading.stop()));
};

import { ErrorHandler, Injectable, inject, isDevMode } from '@angular/core';
import { Notify } from '@core/ui/notify';
import { ApiError } from './api-error';

/** Last safety net for errors nobody handled. */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly notify = inject(Notify);

  handleError(error: unknown): void {
    if (isDevMode()) {
      console.error(error);
    }
    if (error instanceof ApiError) {
      if (!error.notified) {
        error.notified = true;
        this.notify.error(error.message);
      }
      return;
    }
    this.notify.error('Ocurrió un error inesperado. Recarga la página e inténtalo de nuevo');
  }
}

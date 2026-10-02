import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '@core/models/problem-detail';
import { translateMessage } from './error-messages';

/**
 * What every failed API call throws after errorInterceptor: status, a Spanish message and the
 * validation errors by field (already translated).
 */
export class ApiError extends Error {
  /** Set when the user was already told (snackbar), so GlobalErrorHandler does not repeat it. */
  notified = false;

  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
    /** Original backend message (English), useful to react to a specific error. */
    readonly detail = '',
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isValidation(): boolean {
    return this.status === 400 && Object.keys(this.fieldErrors).length > 0;
  }
}

export function toApiError(error: HttpErrorResponse): ApiError {
  if (error.status === 0) {
    return new ApiError(
      0,
      'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo',
    );
  }
  const body = isProblemDetail(error.error) ? error.error : null;
  const fieldErrors: Record<string, string> = {};
  for (const [field, message] of Object.entries(body?.errors ?? {})) {
    fieldErrors[field] = translateMessage(message);
  }
  const message = body?.detail ? translateMessage(body.detail) : fallbackMessage(error.status);
  return new ApiError(error.status, message, fieldErrors, body?.detail ?? '');
}

function isProblemDetail(body: unknown): body is ProblemDetail {
  return typeof body === 'object' && body !== null && 'detail' in body;
}

function fallbackMessage(status: number): string {
  if (status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo';
  if (status === 403) return 'No tienes permiso para esta operación';
  if (status === 404) return 'No encontramos lo que buscas';
  if (status >= 500) return 'El servidor tuvo un problema. Inténtalo en unos minutos';
  return 'No se pudo completar la operación';
}

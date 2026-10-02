import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from './api-error';
import { translateMessage } from './error-messages';

describe('toApiError', () => {
  it('translates the ProblemDetail and keeps the original detail', () => {
    const error = toApiError(
      new HttpErrorResponse({
        status: 409,
        error: { status: 409, detail: 'Email is already registered' },
      }),
    );
    expect(error.status).toBe(409);
    expect(error.message).toBe('Ese correo ya está registrado');
    expect(error.detail).toBe('Email is already registered');
    expect(error.isConflict).toBe(true);
  });

  it('translates validation errors by field', () => {
    const error = toApiError(
      new HttpErrorResponse({
        status: 400,
        error: {
          status: 400,
          detail: 'Invalid request data',
          errors: { dni: 'must have 8 digits' },
        },
      }),
    );
    expect(error.isValidation).toBe(true);
    expect(error.fieldErrors).toEqual({ dni: 'Debe tener 8 dígitos' });
  });

  it('explains a connection error and falls back by status', () => {
    expect(toApiError(new HttpErrorResponse({ status: 0 })).message).toContain(
      'No se pudo conectar',
    );
    expect(toApiError(new HttpErrorResponse({ status: 503 })).message).toContain('servidor');
  });
});

describe('translateMessage', () => {
  it('handles exact, prefixed and unknown messages', () => {
    expect(translateMessage('Invalid credentials')).toBe('Usuario o contraseña incorrectos');
    expect(
      translateMessage('The application reached the limit of 2 reschedules. Ask an admin'),
    ).toContain('límite de reprogramaciones');
    expect(translateMessage('size must be between 8 and 72')).toBe(
      'Debe tener entre 8 y 72 caracteres',
    );
    expect(translateMessage('Something new')).toBe('Something new');
  });
});

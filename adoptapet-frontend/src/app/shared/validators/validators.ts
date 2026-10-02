import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

// Same rules as the backend DTOs, so most mistakes are caught before the request.

export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export const AppValidators = {
  /** 8 digits. */
  dni: Validators.pattern(/^\d{8}$/),

  /** 9 digits. */
  phone: Validators.pattern(/^\d{9}$/),

  username: Validators.pattern(USERNAME_PATTERN),

  /** yyyy-MM-dd strictly before today. */
  pastDate(control: AbstractControl<string>): ValidationErrors | null {
    if (!control.value) return null;
    const today = new Date().toISOString().slice(0, 10);
    return control.value < today ? null : { pastDate: true };
  },

  /**
   * Group validator: marks `target` with `mismatch` when it differs from `source`
   * (the error lives on the confirmation field, where the user sees it).
   */
  matchFields(source: string, target: string): ValidatorFn {
    return (group) => {
      const sourceControl = group.get(source);
      const targetControl = group.get(target);
      if (!sourceControl || !targetControl) return null;

      const { mismatch, ...otherErrors } = targetControl.errors ?? {};
      const differs = !!targetControl.value && sourceControl.value !== targetControl.value;
      if (differs && !mismatch) {
        targetControl.setErrors({ ...otherErrors, mismatch: true });
      } else if (!differs && mismatch) {
        targetControl.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
      }
      return null;
    };
  },
};

/** Spanish message for the first error of a control. */
export function errorMessage(errors: ValidationErrors | null): string | null {
  if (!errors) return null;
  if (errors['server']) return errors['server'] as string;
  if (errors['required']) return 'Este campo es obligatorio';
  if (errors['email']) return 'Ingresa un correo válido';
  if (errors['minlength'])
    return `Debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
  if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
  if (errors['min']) return `Debe ser mayor o igual a ${errors['min'].min}`;
  if (errors['max']) return `Debe ser menor o igual a ${errors['max'].max}`;
  if (errors['pastDate']) return 'Debe ser una fecha pasada';
  if (errors['mismatch']) return 'Las contraseñas no coinciden';
  if (errors['pattern']) return patternMessage(String(errors['pattern'].requiredPattern));
  return 'Valor no válido';
}

function patternMessage(pattern: string): string {
  if (pattern.includes('{8}')) return 'Debe tener 8 dígitos';
  if (pattern.includes('{9}')) return 'Debe tener 9 dígitos';
  if (pattern === String(USERNAME_PATTERN))
    return 'Solo letras, números, punto, guion y guion bajo';
  return 'Formato no válido';
}

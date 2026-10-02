import { AbstractControl, FormGroup } from '@angular/forms';
import { ApiError } from './api-error';

/**
 * Puts the backend validation errors on the matching controls (`{ server: 'message' }`), looking into
 * nested groups too. Returns the names of the fields that were found.
 */
export function applyServerErrors(form: FormGroup, error: ApiError): string[] {
  const applied: string[] = [];
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    const control = findControl(form, field);
    if (control) {
      control.setErrors({ ...control.errors, server: message });
      control.markAsTouched();
      applied.push(field);
    }
  }
  return applied;
}

function findControl(group: FormGroup, name: string): AbstractControl | null {
  if (group.contains(name)) {
    return group.get(name);
  }
  for (const child of Object.values(group.controls)) {
    if (child instanceof FormGroup) {
      const found = findControl(child, name);
      if (found) return found;
    }
  }
  return null;
}

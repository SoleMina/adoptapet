import { Pipe, PipeTransform } from '@angular/core';
import { petAgeLabel } from '@core/i18n/labels';

/** `{{ pet | petAge }}` → "2 años", "1 año y 3 meses", "8 meses". */
@Pipe({ name: 'petAge' })
export class PetAgePipe implements PipeTransform {
  transform(pet: { ageYears: number; ageMonths: number }): string {
    return petAgeLabel(pet.ageYears, pet.ageMonths);
  }
}

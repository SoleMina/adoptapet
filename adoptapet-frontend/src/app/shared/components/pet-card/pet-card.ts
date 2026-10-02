import { Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  ADOPTION_STATUS_TONE,
  HEALTH_STATUS_TONE,
  SEX_LABEL,
  adoptionStatusLabel,
  healthStatusLabel,
  speciesLabel,
} from '@core/i18n/labels';
import { PetResponse } from '@core/models/pet';
import { PetAgePipe } from '@shared/pipes/pet-age-pipe';
import { PetPhoto } from '../pet-photo/pet-photo';

export type PetCardVariant = 'catalog' | 'featured';

/**
 * Pet card: photo with the status pill, name, "Perro · Hembra · 2 años" and "Conocer mascota".
 * `catalog`: also repeats the status under the meta line and adds an arrow to the button.
 * `featured` (home): more compact, only the pill.
 */
@Component({
  selector: 'app-pet-card',
  imports: [MatButtonModule, MatIconModule, RouterLink, PetPhoto, PetAgePipe],
  templateUrl: './pet-card.html',
  styleUrl: './pet-card.scss',
  host: { '[attr.data-variant]': 'variant()' },
})
export class PetCard {
  readonly pet = input.required<PetResponse>();
  readonly priority = input(false);
  readonly variant = input<PetCardVariant>('catalog');

  protected readonly meta = computed(() => {
    const pet = this.pet();
    return `${speciesLabel(pet.species)} · ${SEX_LABEL[pet.sex]}`;
  });

  protected readonly status = computed(() => petStatus(this.pet()));
}

/** "Disponible · Sana" and its tone: the adoption status wins when the pet is not available. */
export function petStatus(pet: PetResponse): { text: string; tone: string } {
  const adoption = adoptionStatusLabel(pet.adoptionStatus, pet.sex);
  const health = healthStatusLabel(pet.healthStatus, pet.sex);
  const tone =
    pet.adoptionStatus === 'AVAILABLE'
      ? HEALTH_STATUS_TONE[pet.healthStatus]
      : ADOPTION_STATUS_TONE[pet.adoptionStatus];
  return { text: `${adoption} · ${health}`, tone };
}

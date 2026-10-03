import {
  ADOPTION_STATUS_TONE,
  HEALTH_STATUS_TONE,
  SEX_LABEL,
  Tone,
  adoptionStatusLabel,
  healthStatusLabel,
  petAgeLabel,
  speciesLabel,
  sterilizationLabel,
} from '@core/i18n/labels';
import { PetResponse } from '@core/models/pet';

/** One row of a pet sheet: icon, label and value. */
export interface PetFact {
  icon: string;
  label: string;
  value: string;
}

/** Status chip: "● Disponible", "♡ Sana". `icon` null = colored dot. */
export interface PetBadge {
  icon: string | null;
  text: string;
  tone: Tone;
}

export function petBadges(pet: PetResponse): PetBadge[] {
  return [
    {
      icon: null,
      text: adoptionStatusLabel(pet.adoptionStatus, pet.sex),
      tone: ADOPTION_STATUS_TONE[pet.adoptionStatus],
    },
    {
      icon: 'heart_check',
      text: healthStatusLabel(pet.healthStatus, pet.sex),
      tone: HEALTH_STATUS_TONE[pet.healthStatus],
    },
  ];
}

/** Species, age, sterilization, sex and breed, in the order of the pet detail design. */
export function petFacts(pet: PetResponse): PetFact[] {
  return [
    { icon: 'pets', label: 'Especie', value: speciesLabel(pet.species) },
    { icon: 'cake', label: 'Edad', value: petAgeLabel(pet.ageYears, pet.ageMonths) },
    {
      icon: 'syringe',
      label: 'Esterilización',
      value: sterilizationLabel(pet.sterilizationStatus, pet.sex),
    },
    { icon: pet.sex === 'MALE' ? 'male' : 'female', label: 'Sexo', value: SEX_LABEL[pet.sex] },
    { icon: 'sound_detection_dog_barking', label: 'Raza', value: pet.breed },
  ];
}

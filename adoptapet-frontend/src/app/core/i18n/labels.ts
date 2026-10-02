import { ApplicationStatus, AppointmentStatus } from '@core/models/application';
import { AdoptionStatus, HealthStatus, Sex, SterilizationStatus } from '@core/models/pet';
import { Role } from '@core/models/user';

/** Visual tone of a status, mapped to the `--ap-color-*` tokens. */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** Spanish adjectives agree with the pet: "Sana" / "Sano". */
function bySex(sex: Sex | undefined, female: string, male: string): string {
  return sex === 'MALE' ? male : female;
}

export const SEX_LABEL: Record<Sex, string> = { MALE: 'Macho', FEMALE: 'Hembra' };

export function adoptionStatusLabel(status: AdoptionStatus, sex?: Sex): string {
  switch (status) {
    case 'AVAILABLE':
      return 'Disponible';
    case 'RESERVED':
      return bySex(sex, 'Reservada', 'Reservado');
    case 'ADOPTED':
      return bySex(sex, 'Adoptada', 'Adoptado');
    case 'INACTIVE':
      return bySex(sex, 'Inactiva', 'Inactivo');
  }
}

export function healthStatusLabel(status: HealthStatus, sex?: Sex): string {
  switch (status) {
    case 'HEALTHY':
      return bySex(sex, 'Sana', 'Sano');
    case 'IN_TREATMENT':
      return 'En tratamiento';
    case 'NOT_FIT':
      return bySex(sex, 'No apta', 'No apto');
  }
}

export function sterilizationLabel(status: SterilizationStatus, sex?: Sex): string {
  switch (status) {
    case 'STERILIZED':
      return bySex(sex, 'Esterilizada', 'Esterilizado');
    case 'NOT_STERILIZED':
      return bySex(sex, 'No esterilizada', 'No esterilizado');
    case 'UNKNOWN':
      return 'Esterilización sin confirmar';
  }
}

export const ADOPTION_STATUS_TONE: Record<AdoptionStatus, Tone> = {
  AVAILABLE: 'success',
  RESERVED: 'info',
  ADOPTED: 'info',
  INACTIVE: 'neutral',
};

export const HEALTH_STATUS_TONE: Record<HealthStatus, Tone> = {
  HEALTHY: 'success',
  IN_TREATMENT: 'warning',
  NOT_FIT: 'danger',
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  NO_SHOW: 'No se presentó',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export const APPLICATION_STATUS_TONE: Record<ApplicationStatus, Tone> = {
  PENDING: 'warning',
  APPROVED: 'info',
  REJECTED: 'danger',
  NO_SHOW: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
};

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Programada',
  COMPLETED: 'Realizada',
  NO_SHOW: 'No asistió',
  CANCELLED: 'Cancelada',
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administrador',
  WORKER: 'Trabajador',
  ADOPTER: 'Adoptante',
};

/** Species is free text in the backend; the common English values are shown in Spanish. */
const SPECIES_ES: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  rabbit: 'Conejo',
  bird: 'Ave',
};

export function speciesLabel(species: string): string {
  return SPECIES_ES[species.trim().toLowerCase()] ?? species;
}

/** "2 años", "1 año", "8 meses", "1 año y 3 meses". */
export function petAgeLabel(years: number, months: number): string {
  const y = years === 1 ? '1 año' : `${years} años`;
  const m = months === 1 ? '1 mes' : `${months} meses`;
  if (years > 0 && months > 0) return `${y} y ${m}`;
  if (years > 0) return y;
  return months > 0 ? m : 'Menos de 1 mes';
}

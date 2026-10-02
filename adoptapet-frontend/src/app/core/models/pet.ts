export type AdoptionStatus = 'AVAILABLE' | 'RESERVED' | 'ADOPTED' | 'INACTIVE';
export type HealthStatus = 'HEALTHY' | 'IN_TREATMENT' | 'NOT_FIT';
export type SterilizationStatus = 'STERILIZED' | 'NOT_STERILIZED' | 'UNKNOWN';
export type Sex = 'MALE' | 'FEMALE';

/** Sent as multipart/form-data together with an optional `image` file. */
export interface PetRequest {
  name: string;
  species: string;
  breed: string;
  sex: Sex;
  ageYears: number;
  ageMonths: number;
  healthStatus: HealthStatus;
  sterilizationStatus: SterilizationStatus;
  observations?: string;
  /** Required on update: the version the client last read (optimistic locking). */
  version?: number;
}

export interface PetResponse {
  id: number;
  name: string;
  species: string;
  breed: string;
  sex: Sex;
  ageYears: number;
  ageMonths: number;
  healthStatus: HealthStatus;
  sterilizationStatus: SterilizationStatus;
  adoptionStatus: AdoptionStatus;
  observations: string | null;
  /** Relative to the gateway: `/api/pets/images/{file}`. Use `imageUrl()` from core/http to render it. */
  imageUrl: string | null;
  version: number;
  createdAt: string;
}

export interface PetFilters {
  status?: AdoptionStatus;
  species?: string;
}

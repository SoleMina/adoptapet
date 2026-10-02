export type ApplicationStatus =
  'PENDING' | 'APPROVED' | 'REJECTED' | 'NO_SHOW' | 'COMPLETED' | 'CANCELLED';
export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
export type DocumentType = 'DNI' | 'ADDRESS_PROOF' | 'ACT' | 'SIGNED_ACT';

/** Sent as multipart/form-data together with the `dniFile` and `addressProofFile` files. */
export interface ApplicationRequest {
  petId: number;
  adoptionReason: string;
  housingType: string;
  petExperience: string;
  otherPets?: string;
  householdSize: number;
  comments?: string;
}

export interface AppointmentResponse {
  deliveryDate: string;
  startTime: string;
  endTime: string;
  pickupDeadline: string;
  status: AppointmentStatus;
  observation: string | null;
  cancellationReason: string | null;
}

export interface ApplicationResponse {
  id: number;
  adopterId: number;
  petId: number;
  petName: string;
  petSpecies: string;
  workerId: number | null;
  status: ApplicationStatus;
  adoptionReason: string;
  housingType: string;
  petExperience: string;
  otherPets: string | null;
  householdSize: number;
  comments: string | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
  contingencyReason: string | null;
  contingencyClosedAt: string | null;
  rescheduleCount: number;
  hasDni: boolean;
  hasAddressProof: boolean;
  hasAct: boolean;
  hasSignedAct: boolean;
  appointment: AppointmentResponse | null;
  version: number;
  createdAt: string;
}

/** Delivery appointment used to approve or reschedule. Times are Peru time. */
export interface ScheduleRequest {
  /** yyyy-MM-dd */
  deliveryDate: string;
  /** 10:00 | 14:00 | 16:00 */
  startTime: string;
  /** 12:00 | 16:00 | 18:00 */
  endTime: string;
  /** yyyy-MM-ddTHH:mm */
  pickupDeadline: string;
  /** Required for an ADMIN reschedule once rescheduleCount >= 2. */
  observation?: string;
}

/** Reject, cancel and contingency close. Max 500 characters. */
export interface ReasonRequest {
  reason: string;
}

import { ApplicationStatus } from './application';

export interface AdopterHistoryItem {
  id: number;
  createdAt: string;
  status: ApplicationStatus;
  petName: string;
  petSpecies: string;
}

export interface AdopterSummaryResponse {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  email: string;
  phone: string;
  address: string | null;
  active: boolean;
  totalApplications: number;
  pending: number;
  approved: number;
  noShow: number;
  completed: number;
  rejected: number;
  cancelled: number;
  lastApplicationAt: string | null;
  /** Only filled by GET /adopters/{id}. */
  applications?: AdopterHistoryItem[];
}

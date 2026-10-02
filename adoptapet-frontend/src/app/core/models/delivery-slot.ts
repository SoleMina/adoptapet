export interface SlotAvailabilityResponse {
  label: string;
  startTime: string;
  endTime: string;
  capacity: number;
  reserved: number;
  free: number;
  /** true when it still has room and has not started yet. */
  available: boolean;
  expired: boolean;
}

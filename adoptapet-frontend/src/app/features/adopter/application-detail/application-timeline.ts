import { ApplicationStatus } from '@core/models/application';

/** Look of one step of the timeline. */
export type StepState =
  'done' | 'current' | 'success' | 'warning' | 'error' | 'cancelled' | 'upcoming';

export interface TimelineStep {
  label: string;
  state: StepState;
  /** Material Symbols name, or null for an empty circle. */
  icon: string | null;
}

const LABELS = ['Solicitud enviada', 'Revisión', 'Cita', 'Adopción'];

const ICONS: Record<StepState, string | null> = {
  done: 'check',
  success: 'check',
  current: null, // depends on the step, see CURRENT_ICONS
  warning: 'priority_high',
  error: 'close',
  cancelled: 'remove',
  upcoming: null,
};

/** Icon of the step the application is waiting on. */
const CURRENT_ICONS = [null, 'schedule', 'calendar_month', 'pets'];

/** Where each status stands on: sent → review → appointment → adoption. */
const STATES: Record<ApplicationStatus, StepState[]> = {
  PENDING: ['done', 'current', 'upcoming', 'upcoming'],
  APPROVED: ['done', 'done', 'current', 'upcoming'],
  NO_SHOW: ['done', 'done', 'warning', 'upcoming'],
  COMPLETED: ['success', 'success', 'success', 'success'],
  REJECTED: ['done', 'error', 'upcoming', 'upcoming'],
  CANCELLED: ['done', 'done', 'cancelled', 'upcoming'],
};

export function timelineOf(status: ApplicationStatus): TimelineStep[] {
  return STATES[status].map((state, index) => ({
    label: LABELS[index],
    state,
    icon: state === 'current' ? CURRENT_ICONS[index] : ICONS[state],
  }));
}

import { Tone } from '@core/i18n/labels';
import { ApplicationResponse } from '@core/models/application';
import { NotificationResponse } from '@core/models/notification';

/** Icon and color of a notification, by the event that produced it. */
const LOOK: Record<string, { icon: string; tone: Tone }> = {
  CREATED: { icon: 'task', tone: 'neutral' },
  APPROVED: { icon: 'check', tone: 'success' },
  REJECTED: { icon: 'close', tone: 'danger' },
  RESCHEDULED: { icon: 'event_repeat', tone: 'info' },
  NO_SHOW: { icon: 'priority_high', tone: 'warning' },
  CANCELLED: { icon: 'remove', tone: 'neutral' },
  COMPLETED: { icon: 'favorite', tone: 'success' },
};

export function notificationLook(type: string): { icon: string; tone: Tone } {
  return LOOK[type] ?? { icon: 'notifications', tone: 'neutral' };
}

/**
 * The backend writes notifications in English, so the Spanish text is built here from the event type and
 * the application it belongs to. Without the application the original message is shown.
 */
export function notificationText(
  notification: NotificationResponse,
  application: ApplicationResponse | undefined,
): string {
  if (!application) {
    return notification.message;
  }
  const pet = application.petName;
  const appointment = appointmentText(application);
  switch (notification.type) {
    case 'CREATED':
      return `Recibimos tu solicitud para ${pet}.`;
    case 'APPROVED':
      return `Tu solicitud para ${pet} fue aprobada.${appointment ? ` Cita: ${appointment}.` : ''}`;
    case 'RESCHEDULED':
      return `La entrega de ${pet} fue reprogramada.${appointment ? ` Nueva cita: ${appointment}.` : ''}`;
    case 'REJECTED':
      return `Tu solicitud para ${pet} fue rechazada.${reason(application.rejectionReason)}`;
    case 'NO_SHOW':
      return `No asististe a la entrega de ${pet}. El albergue te contactará para reprogramar.`;
    case 'CANCELLED':
      return `La adopción de ${pet} fue cancelada.${reason(application.cancellationReason)}`;
    case 'COMPLETED':
      return `¡Felicidades! La adopción de ${pet} está completa.`;
    default:
      return notification.message;
  }
}

/** "08/10/2026, 14:00–16:00" (API values are already Peru time). */
function appointmentText(application: ApplicationResponse): string | null {
  const appointment = application.appointment;
  if (!appointment) return null;
  const [year, month, day] = appointment.deliveryDate.split('-');
  return `${day}/${month}/${year}, ${appointment.startTime.slice(0, 5)}–${appointment.endTime.slice(0, 5)}`;
}

function reason(text: string | null): string {
  return text ? ` Motivo: ${text}` : '';
}

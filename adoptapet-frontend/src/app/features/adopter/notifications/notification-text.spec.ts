import { ApplicationResponse } from '@core/models/application';
import { NotificationResponse } from '@core/models/notification';
import { notificationLook, notificationText } from './notification-text';

const notification = (type: string) =>
  ({
    id: 1,
    applicationId: 2,
    type,
    message: 'English message',
    read: false,
  }) as NotificationResponse;

const application = {
  id: 2,
  petName: 'Milo',
  rejectionReason: 'No cumple los requisitos.',
  appointment: { deliveryDate: '2026-10-08', startTime: '14:00:00', endTime: '16:00:00' },
} as ApplicationResponse;

describe('notificationText', () => {
  it('writes the message in Spanish with the pet and the appointment', () => {
    expect(notificationText(notification('CREATED'), application)).toBe(
      'Recibimos tu solicitud para Milo.',
    );
    expect(notificationText(notification('APPROVED'), application)).toBe(
      'Tu solicitud para Milo fue aprobada. Cita: 08/10/2026, 14:00–16:00.',
    );
    expect(notificationText(notification('REJECTED'), application)).toBe(
      'Tu solicitud para Milo fue rechazada. Motivo: No cumple los requisitos.',
    );
  });

  it('keeps the backend message when the application or the type is unknown', () => {
    expect(notificationText(notification('APPROVED'), undefined)).toBe('English message');
    expect(notificationText(notification('SOMETHING_NEW'), application)).toBe('English message');
  });

  it('has a look for every event and a default', () => {
    expect(notificationLook('APPROVED')).toEqual({ icon: 'check', tone: 'success' });
    expect(notificationLook('SOMETHING_NEW').icon).toBe('notifications');
  });
});

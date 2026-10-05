import { timelineOf } from './application-timeline';

const states = (status: Parameters<typeof timelineOf>[0]) =>
  timelineOf(status).map((step) => step.state);

describe('timelineOf', () => {
  it('always has the four steps of an adoption', () => {
    expect(timelineOf('PENDING').map((step) => step.label)).toEqual([
      'Solicitud enviada',
      'Revisión',
      'Cita',
      'Adopción',
    ]);
  });

  it('places each status on the right step', () => {
    expect(states('PENDING')).toEqual(['done', 'current', 'upcoming', 'upcoming']);
    expect(states('APPROVED')).toEqual(['done', 'done', 'current', 'upcoming']);
    expect(states('NO_SHOW')).toEqual(['done', 'done', 'warning', 'upcoming']);
    expect(states('REJECTED')).toEqual(['done', 'error', 'upcoming', 'upcoming']);
    expect(states('CANCELLED')).toEqual(['done', 'done', 'cancelled', 'upcoming']);
    expect(states('COMPLETED')).toEqual(['success', 'success', 'success', 'success']);
  });

  it('shows what the application is waiting on', () => {
    expect(timelineOf('PENDING')[1].icon).toBe('schedule');
    expect(timelineOf('APPROVED')[2].icon).toBe('calendar_month');
    expect(timelineOf('REJECTED')[1].icon).toBe('close');
  });
});

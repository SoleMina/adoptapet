import { limaNow, limaToday } from './lima-date';

describe('limaToday', () => {
  it('gives the date in Peru (UTC-5), not the one of the browser', () => {
    // 03:00 UTC is still the previous day in Lima.
    expect(limaToday(new Date('2026-10-06T03:00:00Z'))).toBe('2026-10-05');
    expect(limaToday(new Date('2026-10-06T05:00:00Z'))).toBe('2026-10-06');
  });
});

describe('limaNow', () => {
  it('has the same shape as the appointment times of the API, in Peru time', () => {
    expect(limaNow(new Date('2026-10-06T03:15:20Z'))).toBe('2026-10-05T22:15:20');
    // comparable as plain strings with "2026-10-05T16:30:00"
    expect(limaNow(new Date('2026-10-05T21:31:00Z')) > '2026-10-05T16:30:00').toBe(true);
    expect(limaNow(new Date('2026-10-05T21:29:00Z')) > '2026-10-05T16:30:00').toBe(false);
  });
});

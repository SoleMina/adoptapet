import { limaToday } from './lima-date';

describe('limaToday', () => {
  it('gives the date in Peru (UTC-5), not the one of the browser', () => {
    // 03:00 UTC is still the previous day in Lima.
    expect(limaToday(new Date('2026-10-06T03:00:00Z'))).toBe('2026-10-05');
    expect(limaToday(new Date('2026-10-06T05:00:00Z'))).toBe('2026-10-06');
  });
});

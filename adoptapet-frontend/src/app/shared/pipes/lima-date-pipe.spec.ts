import { registerLocaleData } from '@angular/common';
import localeEsPE from '@angular/common/locales/es-PE';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LimaDatePipe } from './lima-date-pipe';

describe('LimaDatePipe', () => {
  let pipe: LimaDatePipe;

  beforeEach(() => {
    registerLocaleData(localeEsPE);
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'es-PE' }] });
    pipe = TestBed.runInInjectionContext(() => new LimaDatePipe());
  });

  it('shows API values (already Peru time) without shifting them', () => {
    expect(pipe.transform('2026-10-05')).toBe('05/10/2026');
    expect(pipe.transform('2026-10-05T12:30:00', 'dateTime')).toBe('05/10/2026 12:30');
    expect(pipe.transform('10:00:00', 'time')).toBe('10:00');
  });

  it('converts values with an offset to Lima time', () => {
    expect(pipe.transform('2026-10-05T17:30:00Z', 'time')).toBe('12:30');
  });

  it('returns an empty string for missing values', () => {
    expect(pipe.transform(null)).toBe('');
  });
});

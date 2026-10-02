import { formatDate } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

/** America/Lima has no daylight saving time, so its offset is always -05:00. */
const LIMA_OFFSET = '-0500';

const FORMATS = {
  date: 'dd/MM/yyyy',
  time: 'HH:mm',
  dateTime: 'dd/MM/yyyy HH:mm',
} as const;

/**
 * Shows API dates in Peru time whatever the browser zone is. The API sends them without offset and they are
 * already Peru time. Usage: `{{ createdAt | limaDate }}`, `{{ createdAt | limaDate: 'dateTime' }}`,
 * `{{ '10:00:00' | limaDate: 'time' }}`.
 */
@Pipe({ name: 'limaDate' })
export class LimaDatePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(value: string | null | undefined, format: keyof typeof FORMATS = 'date'): string {
    if (!value) return '';
    return formatDate(toLimaIso(value), FORMATS[format], this.locale, LIMA_OFFSET);
  }
}

/** "10:00:00", "2026-10-05" or "2026-10-05T12:30:00" → an ISO string with the Lima offset. */
function toLimaIso(value: string): string {
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(value)) return value;
  if (/^\d{2}:\d{2}/.test(value)) return `1970-01-01T${value}-05:00`;
  if (value.length === 10) return `${value}T00:00:00-05:00`;
  return `${value}-05:00`;
}

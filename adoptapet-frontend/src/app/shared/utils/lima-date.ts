/**
 * Now in Peru as `yyyy-MM-ddTHH:mm:ss`, the same shape the API uses for appointments, so both can be
 * compared as plain strings.
 */
export function limaNow(now = new Date()): string {
  // sv-SE formats as "yyyy-MM-dd HH:mm:ss".
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Lima',
    dateStyle: 'short',
    timeStyle: 'medium',
  })
    .format(now)
    .replace(' ', 'T');
}

/** Today in Peru as `yyyy-MM-dd`, whatever the zone of the browser is. */
export function limaToday(now = new Date()): string {
  // en-CA formats dates as yyyy-MM-dd.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(now);
}

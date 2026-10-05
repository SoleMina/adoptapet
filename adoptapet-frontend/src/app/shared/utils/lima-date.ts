/** Today in Peru as `yyyy-MM-dd`, whatever the zone of the browser is. */
export function limaToday(now = new Date()): string {
  // en-CA formats dates as yyyy-MM-dd.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(now);
}

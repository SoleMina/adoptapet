/** "Ana", "Torres" → "AT". Used by the avatars. */
export function initialsOf(person: {
  firstName?: string | null;
  lastName?: string | null;
}): string {
  const first = person.firstName?.trim().charAt(0) ?? '';
  const last = person.lastName?.trim().charAt(0) ?? '';
  return `${first}${last}`.toUpperCase();
}

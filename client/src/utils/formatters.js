/**
 * Formats an ISO date/time string to human readable format in user's browser or specified timezone.
 */
export const formatUtcTimeString = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toUTCString().replace('GMT', 'UTC');
};

/**
 * Formats time 24h string ("09:00") to 12h format ("9:00 AM").
 */
export const formatTimeTo12h = (time24) => {
  if (!time24 || typeof time24 !== 'string') return '';
  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const min = minStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${min} ${ampm}`;
};

/**
 * Returns active weekday abbreviation summary string (e.g. "Mon–Fri" or "Mon, Wed, Fri").
 */
export const formatDaysOfWeek = (days = []) => {
  if (!days || days.length === 0) return 'No days selected';
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) {
    return 'Mon–Fri (Weekdays)';
  }
  if (days.length === 7) return 'Everyday (Mon–Sun)';

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days
    .sort((a, b) => a - b)
    .map((d) => dayNames[d - 1])
    .join(', ');
};

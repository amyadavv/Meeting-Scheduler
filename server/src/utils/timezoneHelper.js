import { format, parseISO, isValid } from 'date-fns';
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { InvalidTimezoneError } from '../errors/index.js';

/**
 * Validates whether a string is a valid IANA timezone identifier.
 * Accepts canonical and alias IANA timezones (e.g. Asia/Kolkata, Europe/London, America/Los_Angeles, Australia/Sydney, UTC).
 * Strictly rejects legacy/informal abbreviations (e.g. IST, PST, EST, GMT).
 *
 * @param {string} timezone
 * @returns {boolean}
 */
export const isValidTimezone = (timezone) => {
  if (!timezone || typeof timezone !== 'string') return false;
  const trimmed = timezone.trim();

  // Reject informal 2-4 letter abbreviations except canonical UTC
  if (/^[A-Z]{2,4}$/.test(trimmed) && trimmed !== 'UTC') {
    return false;
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
};

/**
 * Asserts that a timezone is valid; throws InvalidTimezoneError if not.
 * @param {string} timezone
 */
export const assertValidTimezone = (timezone) => {
  if (!isValidTimezone(timezone)) {
    throw new InvalidTimezoneError(timezone);
  }
};

/**
 * Converts a local calendar date and time in a specific IANA timezone into a canonical UTC Date object.
 * Correctly accounts for DST transitions (e.g. America/Los_Angeles on March 8, 2026).
 *
 * @param {string} dateStr - Date formatted as "YYYY-MM-DD"
 * @param {string} timeStr - Time formatted as "HH:mm" (24h)
 * @param {string} timezone - IANA timezone identifier
 * @returns {Date} Canonical UTC Date
 */
export const localTimeToUtc = (dateStr, timeStr, timezone) => {
  assertValidTimezone(timezone);
  const localDateTimeString = `${dateStr}T${timeStr}:00`;
  return fromZonedTime(localDateTimeString, timezone);
};

/**
 * Formats a UTC Date into a participant's local timezone details.
 *
 * @param {Date|string} utcDate - Canonical UTC Date or ISO string
 * @param {string} timezone - Target IANA timezone
 * @returns {Object} Local time metadata
 */
export const utcToLocalDetails = (utcDate, timezone) => {
  assertValidTimezone(timezone);
  const dateObj = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;

  if (!isValid(dateObj)) {
    throw new Error(`Invalid date supplied to utcToLocalDetails: ${utcDate}`);
  }

  const localDate = formatInTimeZone(dateObj, timezone, 'yyyy-MM-dd');
  const localTime = formatInTimeZone(dateObj, timezone, 'HH:mm');
  const localTime12h = formatInTimeZone(dateObj, timezone, 'h:mm a');
  const dayOfWeekName = formatInTimeZone(dateObj, timezone, 'EEEE');
  const dayOfWeekNumber = parseInt(formatInTimeZone(dateObj, timezone, 'i'), 10); // 1 = Mon, 7 = Sun
  const tzAbbrev = formatInTimeZone(dateObj, timezone, 'zzz');

  return {
    localDate,
    localTime,
    localTime12h,
    dayOfWeekName,
    dayOfWeekNumber,
    tzAbbrev
  };
};

/**
 * Formats an interval [startUtc, endUtc) into a comprehensive localized range string for a participant.
 *
 * @param {Date|string} startUtc
 * @param {Date|string} endUtc
 * @param {string} timezone
 * @returns {Object}
 */
export const formatLocalInterval = (startUtc, endUtc, timezone) => {
  const startDetails = utcToLocalDetails(startUtc, timezone);
  const endDetails = utcToLocalDetails(endUtc, timezone);

  const isSameDay = startDetails.localDate === endDetails.localDate;

  const formattedDate = formatInTimeZone(startUtc, timezone, 'EEE, MMM d, yyyy');
  const formattedRange = isSameDay
    ? `${formattedDate}, ${startDetails.localTime12h} – ${endDetails.localTime12h} (${startDetails.tzAbbrev})`
    : `${formattedDate} ${startDetails.localTime12h} – ${endDetails.localDate} ${endDetails.localTime12h} (${startDetails.tzAbbrev})`;

  return {
    timezone,
    localDate: startDetails.localDate,
    localStartTime: startDetails.localTime,
    localEndTime: endDetails.localTime,
    localStartTime12h: startDetails.localTime12h,
    localEndTime12h: endDetails.localTime12h,
    dayOfWeek: startDetails.dayOfWeekName,
    dayOfWeekNumber: startDetails.dayOfWeekNumber,
    tzAbbreviation: startDetails.tzAbbrev,
    formattedLocalRange: formattedRange,
    spansMidnight: !isSameDay
  };
};

/**
 * Returns UTC offset string for a given date and timezone.
 * @param {Date} date
 * @param {string} timezone
 * @returns {string} e.g. "+05:30", "-08:00"
 */
export const getTimezoneOffsetString = (date, timezone) => {
  assertValidTimezone(timezone);
  return formatInTimeZone(date, timezone, 'xxx');
};

import { describe, it, expect } from 'vitest';
import {
  isValidTimezone,
  localTimeToUtc,
  utcToLocalDetails,
  formatLocalInterval
} from '../../src/utils/timezoneHelper.js';

describe('Timezone Helper & DST Transition Unit Tests', () => {
  describe('isValidTimezone', () => {
    it('accepts valid IANA timezone identifiers', () => {
      expect(isValidTimezone('Asia/Kolkata')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
      expect(isValidTimezone('America/Los_Angeles')).toBe(true);
      expect(isValidTimezone('Australia/Sydney')).toBe(true);
      expect(isValidTimezone('UTC')).toBe(true);
    });

    it('rejects invalid or informal timezone identifiers', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(isValidTimezone('IST')).toBe(false);
      expect(isValidTimezone('PST')).toBe(false);
      expect(isValidTimezone('')).toBe(false);
      expect(isValidTimezone(null)).toBe(false);
    });
  });

  describe('DST Transitions - March 8, 2026 US Spring Forward', () => {
    it('accurately converts local time to UTC across the March 8, 2026 DST shift in Los Angeles', () => {
      // In America/Los_Angeles, Daylight Saving Time begins Sunday, March 8, 2026 at 2:00 AM (clocks move forward 1 hour to PDT, UTC-7).
      // Saturday, March 7 (PST = UTC-8): 06:00 AM PST -> 14:00 UTC
      const preDst = localTimeToUtc('2026-03-07', '06:00', 'America/Los_Angeles');
      expect(preDst.toISOString()).toBe('2026-03-07T14:00:00.000Z');

      // Monday, March 9 (PDT = UTC-7): 06:00 AM PDT -> 13:00 UTC
      const postDst = localTimeToUtc('2026-03-09', '06:00', 'America/Los_Angeles');
      expect(postDst.toISOString()).toBe('2026-03-09T13:00:00.000Z');
    });

    it('accurately converts local time for non-DST timezone (Bangalore, Asia/Kolkata UTC+5:30)', () => {
      // 09:00 IST -> 03:30 UTC
      const utcDate = localTimeToUtc('2026-03-09', '09:00', 'Asia/Kolkata');
      expect(utcDate.toISOString()).toBe('2026-03-09T03:30:00.000Z');
    });
  });

  describe('formatLocalInterval', () => {
    it('produces formatted local string and metadata for London', () => {
      const startUtc = new Date('2026-03-09T13:00:00.000Z');
      const endUtc = new Date('2026-03-09T13:45:00.000Z');

      const formatted = formatLocalInterval(startUtc, endUtc, 'Europe/London');
      expect(formatted.timezone).toBe('Europe/London');
      expect(formatted.localDate).toBe('2026-03-09');
      expect(formatted.localStartTime).toBe('13:00');
      expect(formatted.localEndTime).toBe('13:45');
      expect(formatted.localStartTime12h).toBe('1:00 PM');
      expect(formatted.localEndTime12h).toBe('1:45 PM');
      expect(formatted.dayOfWeek).toBe('Monday');
    });

    it('produces formatted local string and metadata for Sydney (next calendar day crossing)', () => {
      // 2026-03-09 23:00 UTC in Sydney (AEDT = UTC+11) is 2026-03-10 10:00 AM AEDT
      const startUtc = new Date('2026-03-09T23:00:00.000Z');
      const endUtc = new Date('2026-03-09T23:45:00.000Z');

      const formatted = formatLocalInterval(startUtc, endUtc, 'Australia/Sydney');
      expect(formatted.localDate).toBe('2026-03-10');
      expect(formatted.localStartTime).toBe('10:00');
      expect(formatted.localEndTime).toBe('10:45');
      expect(formatted.dayOfWeek).toBe('Tuesday');
    });
  });
});

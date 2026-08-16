import { describe, it, expect } from 'vitest';
import {
  mergeIntervals,
  intersectIntervals,
  intersectMultipleIntervals,
  subtractIntervals,
  sliceIntervalsIntoSlots,
  isValidInterval
} from '../../src/utils/intervalMath.js';

describe('Interval Mathematics Unit Tests', () => {
  describe('isValidInterval', () => {
    it('returns true when start < end', () => {
      expect(isValidInterval({ start: 1000, end: 2000 })).toBe(true);
      expect(isValidInterval({ start: new Date('2026-03-09T09:00:00Z'), end: new Date('2026-03-09T10:00:00Z') })).toBe(true);
    });

    it('returns false when start >= end or invalid dates', () => {
      expect(isValidInterval({ start: 2000, end: 1000 })).toBe(false);
      expect(isValidInterval({ start: 1000, end: 1000 })).toBe(false);
      expect(isValidInterval(null)).toBe(false);
    });
  });

  describe('mergeIntervals', () => {
    it('returns empty array when input is empty', () => {
      expect(mergeIntervals([])).toEqual([]);
    });

    it('merges overlapping and adjacent intervals [start, end)', () => {
      const input = [
        { start: 100, end: 200 },
        { start: 200, end: 300 }, // Adjacent boundary: [100, 200) and [200, 300) should merge to [100, 300)
        { start: 250, end: 400 }, // Overlapping
        { start: 500, end: 600 }  // Disjoint
      ];

      const merged = mergeIntervals(input);
      expect(merged).toEqual([
        { start: 100, end: 400 },
        { start: 500, end: 600 }
      ]);
    });
  });

  describe('intersectIntervals', () => {
    it('returns exact intersection of two overlapping intervals', () => {
      const setA = [{ start: 100, end: 300 }];
      const setB = [{ start: 200, end: 400 }];

      const result = intersectIntervals(setA, setB);
      expect(result).toEqual([{ start: 200, end: 300 }]);
    });

    it('returns empty array when intervals are strictly disjoint', () => {
      const setA = [{ start: 100, end: 200 }];
      const setB = [{ start: 200, end: 300 }]; // Boundary touch only, no overlap in half-open interval

      const result = intersectIntervals(setA, setB);
      expect(result).toEqual([]);
    });

    it('handles multiple interval subsets correctly', () => {
      const setA = [
        { start: 100, end: 200 },
        { start: 300, end: 500 }
      ];
      const setB = [
        { start: 150, end: 350 },
        { start: 400, end: 600 }
      ];

      const result = intersectIntervals(setA, setB);
      expect(result).toEqual([
        { start: 150, end: 200 },
        { start: 300, end: 350 },
        { start: 400, end: 500 }
      ]);
    });
  });

  describe('intersectMultipleIntervals', () => {
    it('intersects 4 sets of participant intervals', () => {
      const p1 = [{ start: 100, end: 500 }];
      const p2 = [{ start: 200, end: 600 }];
      const p3 = [{ start: 250, end: 700 }];
      const p4 = [{ start: 220, end: 450 }];

      const result = intersectMultipleIntervals([p1, p2, p3, p4]);
      expect(result).toEqual([{ start: 250, end: 450 }]);
    });

    it('returns empty array if any single participant is completely disjoint', () => {
      const p1 = [{ start: 100, end: 300 }];
      const p2 = [{ start: 200, end: 400 }];
      const p3 = [{ start: 500, end: 600 }]; // Disjoint

      const result = intersectMultipleIntervals([p1, p2, p3]);
      expect(result).toEqual([]);
    });
  });

  describe('subtractIntervals', () => {
    it('subtracts a meeting block from the middle of availability', () => {
      // Available 09:00 (540m) to 18:00 (1080m), Meeting 13:00 (780m) to 14:00 (840m)
      const working = [{ start: 540, end: 1080 }];
      const meeting = [{ start: 780, end: 840 }];

      const free = subtractIntervals(working, meeting);
      expect(free).toEqual([
        { start: 540, end: 780 },
        { start: 840, end: 1080 }
      ]);
    });

    it('subtracts multiple overlapping and non-overlapping meeting blocks', () => {
      const working = [{ start: 100, end: 1000 }];
      const meetings = [
        { start: 100, end: 200 }, // Start clip
        { start: 400, end: 500 }, // Middle clip
        { start: 900, end: 1000 } // End clip
      ];

      const free = subtractIntervals(working, meetings);
      expect(free).toEqual([
        { start: 200, end: 400 },
        { start: 500, end: 900 }
      ]);
    });

    it('returns empty array when meetings fully encompass working hours', () => {
      const working = [{ start: 500, end: 600 }];
      const meetings = [{ start: 400, end: 700 }];

      const free = subtractIntervals(working, meetings);
      expect(free).toEqual([]);
    });
  });

  describe('sliceIntervalsIntoSlots', () => {
    it('slices a 2-hour window into 45-minute slots with 15-minute granularity', () => {
      // 09:00 (0ms) to 11:00 (120 mins)
      const start = new Date('2026-03-09T09:00:00.000Z');
      const end = new Date('2026-03-09T11:00:00.000Z');

      const slots = sliceIntervalsIntoSlots([{ start, end }], 45, 15);

      // Window: 120 mins.
      // Slot 1: 09:00–09:45
      // Slot 2: 09:15–10:00
      // Slot 3: 09:30–10:15
      // Slot 4: 09:45–10:30
      // Slot 5: 10:00–10:45
      // Slot 6: 10:15–11:00
      expect(slots).toHaveLength(6);
      expect(slots[0].start.toISOString()).toBe('2026-03-09T09:00:00.000Z');
      expect(slots[0].end.toISOString()).toBe('2026-03-09T09:45:00.000Z');
      expect(slots[5].start.toISOString()).toBe('2026-03-09T10:15:00.000Z');
      expect(slots[5].end.toISOString()).toBe('2026-03-09T11:00:00.000Z');
    });

    it('ignores intervals shorter than the required meeting duration', () => {
      const start = new Date('2026-03-09T09:00:00.000Z');
      const end = new Date('2026-03-09T09:30:00.000Z'); // 30 mins, but requested 45 mins

      const slots = sliceIntervalsIntoSlots([{ start, end }], 45, 15);
      expect(slots).toEqual([]);
    });
  });
});

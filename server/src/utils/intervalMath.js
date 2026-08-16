/**
 * Pure mathematical functions for operating on canonical half-open time intervals [start, end).
 * All functions operate on millisecond timestamps or Date objects.
 * Half-open semantics ensure zero boundary double-booking errors:
 * [12:00, 13:00) and [13:00, 14:00) do NOT overlap.
 */

/**
 * Normalizes an interval into epoch milliseconds { start: number, end: number }
 * @param {{ start: Date|number, end: Date|number }} interval
 * @returns {{ start: number, end: number }}
 */
export const toEpochInterval = (interval) => {
  const start = interval.start instanceof Date ? interval.start.getTime() : Number(interval.start);
  const end = interval.end instanceof Date ? interval.end.getTime() : Number(interval.end);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new Error('Invalid interval: timestamps must be valid dates or numbers');
  }

  return { start, end };
};

/**
 * Checks if an interval is valid (start < end).
 * @param {{ start: Date|number, end: Date|number }} interval
 * @returns {boolean}
 */
export const isValidInterval = (interval) => {
  if (!interval) return false;
  const { start, end } = toEpochInterval(interval);
  return start < end;
};

/**
 * Merges overlapping or contiguous intervals into a minimal sorted disjoint set.
 * @param {Array<{ start: Date|number, end: Date|number }>} intervals
 * @returns {Array<{ start: number, end: number }>}
 */
export const mergeIntervals = (intervals) => {
  if (!Array.isArray(intervals) || intervals.length === 0) {
    return [];
  }

  const valid = intervals
    .map(toEpochInterval)
    .filter((inv) => inv.start < inv.end)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  if (valid.length === 0) return [];

  const merged = [valid[0]];

  for (let i = 1; i < valid.length; i++) {
    const current = valid[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      // Overlapping or adjacent, merge
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }

  return merged;
};

/**
 * Calculates the intersection of two disjoint sorted interval sets [start, end).
 * Uses an efficient two-pointer sweep algorithm O(N + M).
 *
 * @param {Array<{ start: Date|number, end: Date|number }>} setA
 * @param {Array<{ start: Date|number, end: Date|number }>} setB
 * @returns {Array<{ start: number, end: number }>}
 */
export const intersectIntervals = (setA, setB) => {
  const a = mergeIntervals(setA);
  const b = mergeIntervals(setB);

  const result = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    const overlapStart = Math.max(a[i].start, b[j].start);
    const overlapEnd = Math.min(a[i].end, b[j].end);

    if (overlapStart < overlapEnd) {
      result.push({ start: overlapStart, end: overlapEnd });
    }

    if (a[i].end < b[j].end) {
      i++;
    } else {
      j++;
    }
  }

  return result;
};

/**
 * Intersects multiple sets of intervals (e.g. availability across N participants).
 * @param {Array<Array<{ start: Date|number, end: Date|number }>>} listOfSets
 * @returns {Array<{ start: number, end: number }>}
 */
export const intersectMultipleIntervals = (listOfSets) => {
  if (!Array.isArray(listOfSets) || listOfSets.length === 0) {
    return [];
  }

  if (listOfSets.length === 1) {
    return mergeIntervals(listOfSets[0]);
  }

  let currentIntersection = mergeIntervals(listOfSets[0]);

  for (let i = 1; i < listOfSets.length; i++) {
    currentIntersection = intersectIntervals(currentIntersection, listOfSets[i]);
    if (currentIntersection.length === 0) {
      return []; // Early exit if no common overlap remains
    }
  }

  return currentIntersection;
};

/**
 * Subtracts blocked/busy intervals from source availability intervals [start, end).
 * For example: source 09:00–18:00 minus blocked 13:00–14:00 gives [09:00, 13:00) and [14:00, 18:00).
 *
 * @param {Array<{ start: Date|number, end: Date|number }>} sourceIntervals
 * @param {Array<{ start: Date|number, end: Date|number }>} blockedIntervals
 * @returns {Array<{ start: number, end: number }>} Free intervals
 */
export const subtractIntervals = (sourceIntervals, blockedIntervals) => {
  const sources = mergeIntervals(sourceIntervals);
  const blocked = mergeIntervals(blockedIntervals);

  if (sources.length === 0) return [];
  if (blocked.length === 0) return sources;

  const freeIntervals = [];

  for (const source of sources) {
    let currentStart = source.start;

    for (const block of blocked) {
      // If block ends before or at currentStart, ignore
      if (block.end <= currentStart) continue;

      // If block starts after or at source.end, stop comparing this source
      if (block.start >= source.end) break;

      // If there is free time before the block starts
      if (currentStart < block.start) {
        freeIntervals.push({ start: currentStart, end: Math.min(block.start, source.end) });
      }

      // Advance current start to the end of the block
      currentStart = Math.max(currentStart, block.end);

      // If we've passed the end of the source interval, nothing left
      if (currentStart >= source.end) break;
    }

    // If remaining time exists after all relevant blocks
    if (currentStart < source.end) {
      freeIntervals.push({ start: currentStart, end: source.end });
    }
  }

  return freeIntervals;
};

/**
 * Slices contiguous free intervals into candidate meeting slots of exact duration.
 *
 * @param {Array<{ start: Date|number, end: Date|number }>} intervals
 * @param {number} durationMinutes - Required meeting length (e.g. 45)
 * @param {number} [stepMinutes=15] - Alignment step (e.g. 15 for 09:00, 09:15, 09:30)
 * @returns {Array<{ start: Date, end: Date, durationMinutes: number }>}
 */
export const sliceIntervalsIntoSlots = (intervals, durationMinutes, stepMinutes = 15) => {
  const free = mergeIntervals(intervals);
  const durationMs = durationMinutes * 60 * 1000;
  const stepMs = (stepMinutes || 15) * 60 * 1000;

  const slots = [];

  for (const interval of free) {
    const intervalDuration = interval.end - interval.start;
    if (intervalDuration < durationMs) continue;

    for (let cursor = interval.start; cursor + durationMs <= interval.end; cursor += stepMs) {
      slots.push({
        start: new Date(cursor),
        end: new Date(cursor + durationMs),
        durationMinutes
      });
    }
  }

  // Deterministic chronological sort
  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
};

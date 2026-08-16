import { addDays, format, parseISO, eachDayOfInterval } from 'date-fns';
import { participantRepository } from '../repositories/participantRepository.js';
import { meetingRepository } from '../repositories/meetingRepository.js';
import { NotFoundError, BusinessRuleError } from '../errors/index.js';
import {
  mergeIntervals,
  intersectIntervals,
  intersectMultipleIntervals,
  subtractIntervals,
  sliceIntervalsIntoSlots
} from '../utils/intervalMath.js';
import {
  localTimeToUtc,
  formatLocalInterval,
  utcToLocalDetails,
  assertValidTimezone
} from '../utils/timezoneHelper.js';

export const schedulingService = {
  /**
   * Generates participant's available UTC intervals across the specified date range.
   * Accounts for weekly recurring working hours, local calendar days, and DST transitions.
   *
   * @param {Object} participant - Participant document
   * @param {string} startDateStr - "YYYY-MM-DD"
   * @param {string} endDateStr - "YYYY-MM-DD"
   * @returns {Array<{ start: number, end: number }>} Array of epoch ms intervals
   */
  calculateParticipantWorkingIntervals: (participant, startDateStr, endDateStr) => {
    const { timezone, availability } = participant;
    assertValidTimezone(timezone);

    const { startTime, endTime, daysOfWeek = [1, 2, 3, 4, 5] } = availability;

    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    // Expand search by 1 day on each side to catch UTC overlaps spanning local day boundaries
    const searchStartDay = addDays(startDate, -1);
    const searchEndDay = addDays(endDate, 1);

    const calendarDays = eachDayOfInterval({ start: searchStartDay, end: searchEndDay });
    const workingIntervals = [];

    for (const day of calendarDays) {
      const dateStr = format(day, 'yyyy-MM-dd');

      // Check the day of week in the participant's local timezone for this date
      const localStartUtc = localTimeToUtc(dateStr, startTime, timezone);
      const localDetails = utcToLocalDetails(localStartUtc, timezone);

      if (daysOfWeek.includes(localDetails.dayOfWeekNumber)) {
        const localEndUtc = localTimeToUtc(dateStr, endTime, timezone);

        if (localStartUtc.getTime() < localEndUtc.getTime()) {
          workingIntervals.push({
            start: localStartUtc.getTime(),
            end: localEndUtc.getTime()
          });
        }
      }
    }

    return mergeIntervals(workingIntervals);
  },

  /**
   * Computes a participant's net free intervals by subtracting busy meeting blocks.
   */
  calculateParticipantFreeIntervals: (participant, workingIntervals, meetings) => {
    const participantMeetings = meetings.filter(
      (m) => m.participantId.toString() === participant._id.toString()
    );

    const busyIntervals = participantMeetings.map((m) => ({
      start: new Date(m.startTime).getTime(),
      end: new Date(m.endTime).getTime()
    }));

    return subtractIntervals(workingIntervals, busyIntervals);
  },

  /**
   * Main scheduling calculation for a group of participants.
   */
  findAvailableSlots: async ({
    participantIds,
    startDate,
    endDate,
    durationMinutes = 45,
    granularityMinutes = 15
  }) => {
    // 1. Fetch participants
    const participants = await participantRepository.findMultipleByIds(participantIds);
    if (participants.length !== participantIds.length) {
      const foundIds = participants.map((p) => p._id.toString());
      const missingIds = participantIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundError('Participants', missingIds.join(', '));
    }

    // 2. Fetch all meetings for these participants spanning the search window (+/- 2 days buffer)
    const windowStartUtc = new Date(`${startDate}T00:00:00.000Z`);
    const windowEndUtc = new Date(`${endDate}T23:59:59.999Z`);
    const bufferStartUtc = addDays(windowStartUtc, -2);
    const bufferEndUtc = addDays(windowEndUtc, 2);

    const existingMeetings = await meetingRepository.findByParticipantIdsAndDateRange(
      participantIds,
      bufferStartUtc,
      bufferEndUtc
    );

    // 3. Compute free intervals per participant
    const participantFreeMap = new Map();
    const participantFreeLists = [];

    for (const participant of participants) {
      const working = schedulingService.calculateParticipantWorkingIntervals(
        participant,
        startDate,
        endDate
      );
      const free = schedulingService.calculateParticipantFreeIntervals(
        participant,
        working,
        existingMeetings
      );

      participantFreeMap.set(participant._id.toString(), {
        participant,
        workingIntervals: working,
        freeIntervals: free
      });
      participantFreeLists.push(free);
    }

    // 4. Intersect free intervals across ALL participants
    const universalFreeIntervals = intersectMultipleIntervals(participantFreeLists);

    // Filter to ensure slots strictly start within the requested search date boundaries in UTC
    const boundStartMs = windowStartUtc.getTime();
    const boundEndMs = windowEndUtc.getTime();

    const boundedUniversalIntervals = universalFreeIntervals
      .map((inv) => ({
        start: Math.max(inv.start, boundStartMs),
        end: Math.min(inv.end, boundEndMs)
      }))
      .filter((inv) => inv.start < inv.end);

    // 5. Slice intervals into candidate slots of durationMinutes
    const rawSlots = sliceIntervalsIntoSlots(
      boundedUniversalIntervals,
      durationMinutes,
      granularityMinutes
    );

    // 6. Enrich slots with localized participant representations
    const formattedSlots = rawSlots.map((slot) => {
      const participantTimes = participants.map((p) => {
        const localRange = formatLocalInterval(slot.start, slot.end, p.timezone);
        return {
          participantId: p._id.toString(),
          name: p.name,
          location: p.location,
          timezone: p.timezone,
          ...localRange
        };
      });

      return {
        slotId: `${slot.start.toISOString()}_${durationMinutes}m`,
        startUtc: slot.start.toISOString(),
        endUtc: slot.end.toISOString(),
        durationMinutes,
        participantTimes
      };
    });

    const hasUniversalSlots = formattedSlots.length > 0;

    // 7. If no universal slots exist, compute intelligent diagnostics and subset suggestions
    let alternatives = null;
    if (!hasUniversalSlots) {
      alternatives = await schedulingService.generateAlternatives({
        participants,
        participantFreeMap,
        startDate,
        endDate,
        durationMinutes,
        granularityMinutes
      });
    }

    return {
      durationMinutes,
      granularityMinutes,
      searchWindow: {
        startDate,
        endDate,
        windowStartUtc: windowStartUtc.toISOString(),
        windowEndUtc: windowEndUtc.toISOString()
      },
      totalSlotsFound: formattedSlots.length,
      hasUniversalSlots,
      slots: formattedSlots,
      alternatives
    };
  },

  /**
   * Computes diagnostics and viable subset alternatives when all participants cannot meet simultaneously.
   */
  generateAlternatives: async ({
    participants,
    participantFreeMap,
    startDate,
    endDate,
    durationMinutes,
    granularityMinutes
  }) => {
    const totalParticipants = participants.length;
    const subsetSuggestions = [];
    const pairDiagnostics = [];

    // 1. Pairwise overlap analysis
    const viablePairs = [];
    for (let i = 0; i < totalParticipants; i++) {
      for (let j = i + 1; j < totalParticipants; j++) {
        const pA = participants[i];
        const pB = participants[j];

        const freeA = participantFreeMap.get(pA._id.toString()).freeIntervals;
        const freeB = participantFreeMap.get(pB._id.toString()).freeIntervals;

        const pairOverlap = intersectIntervals(freeA, freeB);
        const pairSlots = sliceIntervalsIntoSlots(pairOverlap, durationMinutes, granularityMinutes);

        if (pairSlots.length === 0) {
          pairDiagnostics.push({
            type: 'NO_PAIRWISE_OVERLAP',
            participants: [pA.name, pB.name],
            locations: [pA.location, pB.location],
            timezones: [pA.timezone, pB.timezone],
            reason: `${pA.name} (${pA.location}, ${pA.timezone}) and ${pB.name} (${pB.location}, ${pB.timezone}) have zero overlapping working availability during this period.`
          });
        } else {
          viablePairs.push({
            participants: [pA, pB],
            slots: pairSlots
          });
        }
      }
    }

    // 2. Try (N-1) subsets if 3 or more participants
    if (totalParticipants >= 3) {
      for (let excludeIdx = 0; excludeIdx < totalParticipants; excludeIdx++) {
        const excludedParticipant = participants[excludeIdx];
        const includedParticipants = participants.filter((_, idx) => idx !== excludeIdx);

        const includedFreeLists = includedParticipants.map(
          (p) => participantFreeMap.get(p._id.toString()).freeIntervals
        );

        const subsetOverlap = intersectMultipleIntervals(includedFreeLists);
        const subsetSlots = sliceIntervalsIntoSlots(
          subsetOverlap,
          durationMinutes,
          granularityMinutes
        );

        if (subsetSlots.length > 0) {
          const sampleSlots = subsetSlots.slice(0, 5).map((slot) => {
            const participantTimes = includedParticipants.map((p) => {
              const localRange = formatLocalInterval(slot.start, slot.end, p.timezone);
              return {
                participantId: p._id.toString(),
                name: p.name,
                location: p.location,
                timezone: p.timezone,
                ...localRange
              };
            });

            const excludedLocal = formatLocalInterval(
              slot.start,
              slot.end,
              excludedParticipant.timezone
            );

            return {
              slotId: `${slot.start.toISOString()}_${durationMinutes}m`,
              startUtc: slot.start.toISOString(),
              endUtc: slot.end.toISOString(),
              durationMinutes,
              participantTimes,
              excludedParticipantTime: {
                name: excludedParticipant.name,
                location: excludedParticipant.location,
                timezone: excludedParticipant.timezone,
                ...excludedLocal
              }
            };
          });

          subsetSuggestions.push({
            excludedParticipant: {
              id: excludedParticipant._id.toString(),
              name: excludedParticipant.name,
              location: excludedParticipant.location,
              timezone: excludedParticipant.timezone
            },
            includedParticipantCount: includedParticipants.length,
            totalSlotsAvailable: subsetSlots.length,
            suggestedSlots: sampleSlots
          });
        }
      }
    }

    // 3. If (N-1) subsets also produced 0 results (e.g. 4 globally opposed timezones),
    // supply the best viable pairwise clusters so the coordinator is never left without actionable options
    if (subsetSuggestions.length === 0 && viablePairs.length > 0) {
      for (const pair of viablePairs) {
        const [p1, p2] = pair.participants;
        const excluded = participants.filter((p) => p._id.toString() !== p1._id.toString() && p._id.toString() !== p2._id.toString());

        const sampleSlots = pair.slots.slice(0, 3).map((slot) => {
          const participantTimes = [p1, p2].map((p) => {
            const localRange = formatLocalInterval(slot.start, slot.end, p.timezone);
            return {
              participantId: p._id.toString(),
              name: p.name,
              location: p.location,
              timezone: p.timezone,
              ...localRange
            };
          });

          return {
            slotId: `${slot.start.toISOString()}_${durationMinutes}m`,
            startUtc: slot.start.toISOString(),
            endUtc: slot.end.toISOString(),
            durationMinutes,
            participantTimes
          };
        });

        subsetSuggestions.push({
          excludedParticipant: {
            name: excluded.map((e) => e.name).join(', '),
            location: excluded.map((e) => e.location).join(', '),
            timezone: excluded.map((e) => e.timezone).join(', ')
          },
          includedParticipantCount: 2,
          totalSlotsAvailable: pair.slots.length,
          suggestedSlots: sampleSlots
        });
      }
    }

    let summaryExplanation = 'No mutually available slot was found for all selected participants.';
    if (pairDiagnostics.length > 0) {
      summaryExplanation = `No universal slot found. Major timezone divergence detected between ${pairDiagnostics
        .slice(0, 3)
        .map((d) => `${d.participants[0]} (${d.locations[0]}) and ${d.participants[1]} (${d.locations[1]})`)
        .join(', ')}.`;
    }

    return {
      explanation: summaryExplanation,
      pairDiagnostics,
      subsetSuggestions
    };
  }
};

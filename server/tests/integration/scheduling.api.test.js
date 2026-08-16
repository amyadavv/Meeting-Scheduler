import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import '../setup.js';
import { app } from '../../src/app.js';
import { Participant } from '../../src/models/Participant.js';
import { Meeting } from '../../src/models/Meeting.js';
import { INITIAL_PARTICIPANTS } from '../../src/constants/timezones.js';
import { ERROR_CODES } from '../../src/constants/errorCodes.js';

describe('Scheduling API Integration Tests (8–14 March 2026 Assignment Scenario)', () => {
  let maya, tom, sara, jack;

  beforeEach(async () => {
    const participants = await Participant.create(INITIAL_PARTICIPANTS);
    maya = participants.find((p) => p.name === 'Maya');
    tom = participants.find((p) => p.name === 'Tom');
    sara = participants.find((p) => p.name === 'Sara');
    jack = participants.find((p) => p.name === 'Jack');
  });

  describe('POST /api/scheduling/slots (Happy Path & Multi-Participant)', () => {
    it('successfully finds 45-minute meeting slots between Maya (Bangalore) and Tom (London)', async () => {
      // Maya: 09:00–18:00 IST (03:30–12:30 UTC)
      // Tom:  08:00–17:00 GMT (08:00–17:00 UTC)
      // Overlap: 08:00–12:30 UTC (4.5 hours daily on weekdays Mon-Fri)
      const res = await request(app)
        .post('/api/scheduling/slots')
        .send({
          participantIds: [maya._id.toString(), tom._id.toString()],
          startDate: '2026-03-08',
          endDate: '2026-03-14',
          durationMinutes: 45,
          granularityMinutes: 15
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.hasUniversalSlots).toBe(true);
      expect(res.body.data.totalSlotsFound).toBeGreaterThan(0);
      expect(res.body.data.durationMinutes).toBe(45);

      const firstSlot = res.body.data.slots[0];
      expect(firstSlot.slotId).toBeDefined();
      expect(firstSlot.durationMinutes).toBe(45);
      expect(firstSlot.participantTimes).toHaveLength(2);

      const mayaTime = firstSlot.participantTimes.find((p) => p.name === 'Maya');
      const tomTime = firstSlot.participantTimes.find((p) => p.name === 'Tom');

      expect(mayaTime.timezone).toBe('Asia/Kolkata');
      expect(mayaTime.localStartTime).toBeDefined();
      expect(mayaTime.formattedLocalRange).toContain('IST');

      expect(tomTime.timezone).toBe('Europe/London');
      expect(tomTime.localStartTime).toBeDefined();
      expect(tomTime.formattedLocalRange).toContain('GMT');
    });

    it('eliminates slots that collide with a participant pre-existing meeting', async () => {
      // Find initial slots for Maya and Tom
      const initialRes = await request(app)
        .post('/api/scheduling/slots')
        .send({
          participantIds: [maya._id.toString(), tom._id.toString()],
          startDate: '2026-03-09',
          endDate: '2026-03-09',
          durationMinutes: 45,
          granularityMinutes: 15
        })
        .expect(200);

      const initialCount = initialRes.body.data.totalSlotsFound;

      // Add a meeting for Maya blocking 08:00 to 10:00 UTC on March 9
      await Meeting.create({
        participantId: maya._id,
        title: 'Maya Blocked Block',
        startTime: new Date('2026-03-09T08:00:00.000Z'),
        endTime: new Date('2026-03-09T10:00:00.000Z')
      });

      const updatedRes = await request(app)
        .post('/api/scheduling/slots')
        .send({
          participantIds: [maya._id.toString(), tom._id.toString()],
          startDate: '2026-03-09',
          endDate: '2026-03-09',
          durationMinutes: 45,
          granularityMinutes: 15
        })
        .expect(200);

      expect(updatedRes.body.data.totalSlotsFound).toBeLessThan(initialCount);

      // Verify no suggested slot overlaps with the 08:00-10:00 UTC meeting
      for (const slot of updatedRes.body.data.slots) {
        const slotStart = new Date(slot.startUtc).getTime();
        const slotEnd = new Date(slot.endUtc).getTime();
        const meetingStart = new Date('2026-03-09T08:00:00.000Z').getTime();
        const meetingEnd = new Date('2026-03-09T10:00:00.000Z').getTime();

        const overlaps = Math.max(slotStart, meetingStart) < Math.min(slotEnd, meetingEnd);
        expect(overlaps).toBe(false);
      }
    });

    it('handles 4-way global timezone conflict with structured diagnostics and (N-1) alternatives', async () => {
      // 4 global participants across 19 hours: Bangalore, London, SF, Sydney
      const res = await request(app)
        .post('/api/scheduling/slots')
        .send({
          participantIds: [maya._id.toString(), tom._id.toString(), sara._id.toString(), jack._id.toString()],
          startDate: '2026-03-08',
          endDate: '2026-03-14',
          durationMinutes: 45,
          granularityMinutes: 15
        })
        .expect(200);

      expect(res.body.success).toBe(true);

      if (!res.body.data.hasUniversalSlots) {
        // Must provide meaningful alternatives and diagnostics rather than an empty void
        expect(res.body.data.totalSlotsFound).toBe(0);
        expect(res.body.data.alternatives).not.toBeNull();
        expect(res.body.data.alternatives.explanation).toBeDefined();
        expect(res.body.data.alternatives.pairDiagnostics.length).toBeGreaterThan(0);
        expect(res.body.data.alternatives.subsetSuggestions.length).toBeGreaterThan(0);

        // Verify subset suggestion contains sample slots and excluded participant details
        const subset = res.body.data.alternatives.subsetSuggestions[0];
        expect(subset.excludedParticipant.name).toBeDefined();
        expect(subset.suggestedSlots.length).toBeGreaterThan(0);
      }
    });
  });

  describe('POST /api/scheduling/slots (Validation & Failure Modes)', () => {
    it('rejects inverted date range (endDate < startDate) with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/scheduling/slots')
        .send({
          participantIds: [maya._id.toString()],
          startDate: '2026-03-14',
          endDate: '2026-03-08', // Invalid: before start
          durationMinutes: 45
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('rejects invalid meeting duration (< 15 mins or > 480 mins)', async () => {
      const res = await request(app)
        .post('/api/scheduling/slots')
        .send({
          participantIds: [maya._id.toString()],
          startDate: '2026-03-08',
          endDate: '2026-03-14',
          durationMinutes: 5 // Invalid: min is 15
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('returns 404 if any participantId does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post('/api/scheduling/slots')
        .send({
          participantIds: [maya._id.toString(), fakeId],
          startDate: '2026-03-08',
          endDate: '2026-03-14',
          durationMinutes: 45
        })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });
});

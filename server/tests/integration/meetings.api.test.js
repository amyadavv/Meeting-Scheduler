import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { Participant } from '../../src/models/Participant.js';
import { Meeting } from '../../src/models/Meeting.js';
import { ERROR_CODES } from '../../src/constants/errorCodes.js';

describe('Meetings API Integration Tests', () => {
  let testParticipant;

  beforeEach(async () => {
    testParticipant = await Participant.create({
      name: 'Maya',
      email: 'maya.meet@test.com',
      location: 'Bangalore',
      timezone: 'Asia/Kolkata',
      availability: {
        startTime: '09:00',
        endTime: '18:00',
        daysOfWeek: [1, 2, 3, 4, 5]
      }
    });
  });

  describe('POST /api/participants/:id/meetings', () => {
    it('creates a valid meeting / busy block for a participant', async () => {
      const res = await request(app)
        .post(`/api/participants/${testParticipant._id}/meetings`)
        .send({
          title: 'Architecture Review',
          startTime: '2026-03-09T13:00:00.000Z',
          endTime: '2026-03-09T14:00:00.000Z'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Architecture Review');

      const dbMeeting = await Meeting.findById(res.body.data.id);
      expect(dbMeeting).not.toBeNull();
      expect(dbMeeting.participantId.toString()).toBe(testParticipant._id.toString());
    });

    it('rejects inverted meeting time (endTime <= startTime) with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/participants/${testParticipant._id}/meetings`)
        .send({
          title: 'Invalid Time Meeting',
          startTime: '2026-03-09T15:00:00.000Z',
          endTime: '2026-03-09T14:00:00.000Z' // End before start
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('rejects meeting creation for non-existent participant with 404', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post(`/api/participants/${fakeId}/meetings`)
        .send({
          title: 'Ghost Meeting',
          startTime: '2026-03-09T13:00:00.000Z',
          endTime: '2026-03-09T14:00:00.000Z'
        })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  describe('DELETE /api/meetings/:id', () => {
    it('deletes an existing meeting', async () => {
      const meeting = await Meeting.create({
        participantId: testParticipant._id,
        title: 'Team Sync',
        startTime: new Date('2026-03-09T10:00:00.000Z'),
        endTime: new Date('2026-03-09T11:00:00.000Z')
      });

      const res = await request(app).delete(`/api/meetings/${meeting._id}`).expect(200);
      expect(res.body.success).toBe(true);

      const inDb = await Meeting.findById(meeting._id);
      expect(inDb).toBeNull();
    });
  });
});

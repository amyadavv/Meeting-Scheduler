import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { Participant } from '../../src/models/Participant.js';
import { ERROR_CODES } from '../../src/constants/errorCodes.js';

describe('Participants API Integration Tests', () => {
  const validParticipant = {
    name: 'Maya',
    email: 'maya@example.com',
    location: 'Bangalore',
    timezone: 'Asia/Kolkata',
    availability: {
      startTime: '09:00',
      endTime: '18:00',
      daysOfWeek: [1, 2, 3, 4, 5]
    }
  };

  describe('POST /api/participants (Happy Path & Hard Corners)', () => {
    it('creates a new valid participant with 201 Created', async () => {
      const res = await request(app)
        .post('/api/participants')
        .send(validParticipant)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Maya');
      expect(res.body.data.email).toBe('maya@example.com');
      expect(res.body.data.timezone).toBe('Asia/Kolkata');

      // Verify database state directly
      const dbRecord = await Participant.findOne({ email: 'maya@example.com' });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord.location).toBe('Bangalore');
    });

    it('rejects duplicate email with 409 Conflict and CONFLICT error code', async () => {
      // First insert
      await request(app).post('/api/participants').send(validParticipant).expect(201);

      // Duplicate insert attempt
      const res = await request(app)
        .post('/api/participants')
        .send({
          ...validParticipant,
          name: 'Maya Duplicate'
        })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODES.CONFLICT);
      expect(res.body.error.message).toContain('already exists');
    });

    it('rejects invalid IANA timezone with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/participants')
        .send({
          ...validParticipant,
          email: 'invalid_tz@example.com',
          timezone: 'Not/A_Real_Timezone'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('rejects inverted availability hours (startTime >= endTime) with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/participants')
        .send({
          ...validParticipant,
          email: 'inverted@example.com',
          availability: {
            startTime: '18:00',
            endTime: '09:00', // Invalid: endTime before startTime
            daysOfWeek: [1, 2, 3, 4, 5]
          }
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('GET /api/participants & GET /api/participants/:id', () => {
    it('returns all participants sorted by name', async () => {
      await Participant.create([
        { name: 'Tom', email: 'tom@test.com', location: 'London', timezone: 'Europe/London' },
        { name: 'Maya', email: 'maya@test.com', location: 'Bangalore', timezone: 'Asia/Kolkata' }
      ]);

      const res = await request(app).get('/api/participants').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe('Maya');
      expect(res.body.data[1].name).toBe('Tom');
    });

    it('returns 404 Not Found for non-existent participant ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/participants/${fakeId}`).expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  describe('PUT /api/participants/:id & DELETE /api/participants/:id', () => {
    it('updates participant location and working hours', async () => {
      const created = await Participant.create(validParticipant);

      const res = await request(app)
        .put(`/api/participants/${created._id}`)
        .send({
          location: 'Bangalore North',
          availability: {
            startTime: '10:00',
            endTime: '19:00',
            daysOfWeek: [1, 2, 3, 4, 5]
          }
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.location).toBe('Bangalore North');
      expect(res.body.data.availability.startTime).toBe('10:00');
    });

    it('deletes participant and returns success', async () => {
      const created = await Participant.create(validParticipant);

      const res = await request(app).delete(`/api/participants/${created._id}`).expect(200);
      expect(res.body.success).toBe(true);

      const inDb = await Participant.findById(created._id);
      expect(inDb).toBeNull();
    });
  });
});

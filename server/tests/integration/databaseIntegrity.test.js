import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import '../setup.js';
import { Participant } from '../../src/models/Participant.js';
import { Meeting } from '../../src/models/Meeting.js';

describe('Database Structural Integrity Tests', () => {
  beforeEach(async () => {
    // Explicitly await index build on collections
    await Participant.init();
    await Meeting.init();
  });

  it('enforces email uniqueness at the MongoDB index layer (MongoServerError: 11000)', async () => {
    // 1. Create first document
    await Participant.create({
      name: 'Maya',
      email: 'maya.unique@test.com',
      location: 'Bangalore',
      timezone: 'Asia/Kolkata',
      availability: {
        startTime: '09:00',
        endTime: '18:00',
        daysOfWeek: [1, 2, 3, 4, 5]
      }
    });

    // 2. Attempt to bypass service layer and insert duplicate directly into Mongoose
    let error;
    try {
      await Participant.create({
        name: 'Maya Clone',
        email: 'maya.unique@test.com',
        location: 'Bangalore Duplicate',
        timezone: 'Asia/Kolkata',
        availability: {
          startTime: '09:00',
          endTime: '18:00',
          daysOfWeek: [1, 2, 3, 4, 5]
        }
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    // Verify MongoDB duplicate key error code 11000
    expect(error.code).toBe(11000);
  });

  it('rejects invalid IANA timezone at the Mongoose schema validator layer', async () => {
    let error;
    try {
      await Participant.create({
        name: 'Invalid TZ User',
        email: 'invalid.tz@test.com',
        location: 'Nowhere',
        timezone: 'Invalid/NonExistent_Zone',
        availability: {
          startTime: '09:00',
          endTime: '18:00',
          daysOfWeek: [1, 2, 3, 4, 5]
        }
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe('ValidationError');
    expect(error.errors.timezone).toBeDefined();
  });

  it('rejects inverted availability hours at the Mongoose pre-validate layer', async () => {
    let error;
    try {
      await Participant.create({
        name: 'Inverted Availability User',
        email: 'inverted.avail@test.com',
        location: 'Test',
        timezone: 'Asia/Kolkata',
        availability: {
          startTime: '19:00',
          endTime: '08:00', // Invalid: end before start
          daysOfWeek: [1, 2, 3, 4, 5]
        }
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe('ValidationError');
  });

  it('rejects inverted meeting time range at the Mongoose pre-validate hook layer', async () => {
    const participant = await Participant.create({
      name: 'Sara',
      email: 'sara.meeting@test.com',
      location: 'San Francisco',
      timezone: 'America/Los_Angeles'
    });

    let error;
    try {
      await Meeting.create({
        participantId: participant._id,
        title: 'Inverted Range Meeting',
        startTime: new Date('2026-03-09T16:00:00.000Z'),
        endTime: new Date('2026-03-09T14:00:00.000Z') // Invalid: end is before start
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe('ValidationError');
    expect(error.errors.endTime).toBeDefined();
  });
});

import { z } from 'zod';
import { isValidTimezone } from '../utils/timezoneHelper.js';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const availabilitySchema = z
  .object({
    startTime: z.string().regex(timeRegex, 'startTime must be in HH:mm 24h format (e.g. 09:00)'),
    endTime: z.string().regex(timeRegex, 'endTime must be in HH:mm 24h format (e.g. 18:00)'),
    daysOfWeek: z
      .array(z.number().int().min(1).max(7))
      .min(1, 'At least one active working day must be specified')
      .default([1, 2, 3, 4, 5])
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Availability endTime must be strictly after startTime',
    path: ['endTime']
  });

export const createParticipantSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  location: z.string().trim().min(2, 'Location must be at least 2 characters').max(100, 'Location cannot exceed 100 characters'),
  timezone: z.string().trim().refine(isValidTimezone, {
    message: 'Must be a valid IANA timezone identifier (e.g., Asia/Kolkata, Europe/London)'
  }),
  availability: availabilitySchema.optional()
});

export const updateParticipantSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  location: z.string().trim().min(2).max(100).optional(),
  timezone: z
    .string()
    .trim()
    .refine(isValidTimezone, {
      message: 'Must be a valid IANA timezone identifier (e.g., Asia/Kolkata)'
    })
    .optional(),
  availability: availabilitySchema.optional()
});

export const participantIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid participant ID format (must be 24-character hexadecimal ObjectId)')
});

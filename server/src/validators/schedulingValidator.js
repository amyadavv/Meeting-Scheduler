import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const searchSlotsSchema = z
  .object({
    participantIds: z
      .array(z.string().regex(objectIdRegex, 'Each participantId must be a valid 24-character hexadecimal ObjectId'))
      .min(1, 'At least one participantId is required for scheduling'),
    startDate: z
      .string()
      .regex(dateRegex, 'startDate must be formatted as YYYY-MM-DD (e.g. 2026-03-08)'),
    endDate: z
      .string()
      .regex(dateRegex, 'endDate must be formatted as YYYY-MM-DD (e.g. 2026-03-14)'),
    durationMinutes: z
      .number()
      .int('durationMinutes must be an integer')
      .min(15, 'Meeting duration must be at least 15 minutes')
      .max(480, 'Meeting duration cannot exceed 480 minutes (8 hours)')
      .default(45),
    granularityMinutes: z
      .number()
      .int()
      .min(5, 'Granularity step must be at least 5 minutes')
      .max(60, 'Granularity step cannot exceed 60 minutes')
      .default(15)
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate']
  })
  .refine(
    (data) => {
      const start = new Date(`${data.startDate}T00:00:00Z`).getTime();
      const end = new Date(`${data.endDate}T23:59:59Z`).getTime();
      const diffDays = (end - start) / (1000 * 60 * 60 * 24);
      return diffDays <= 60; // Max search window of 60 days
    },
    {
      message: 'Search window cannot exceed 60 days',
      path: ['endDate']
    }
  );

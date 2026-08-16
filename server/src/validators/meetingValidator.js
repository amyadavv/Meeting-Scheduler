import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createMeetingSchema = z
  .object({
    participantId: z
      .string()
      .regex(objectIdRegex, 'Invalid participant ID format')
      .optional(),
    title: z.string().trim().min(1, 'Title cannot be empty').max(200).default('Busy Block'),
    startTime: z.string().datetime({ message: 'startTime must be a valid ISO-8601 date string' }),
    endTime: z.string().datetime({ message: 'endTime must be a valid ISO-8601 date string' })
  })
  .refine((data) => new Date(data.startTime).getTime() < new Date(data.endTime).getTime(), {
    message: 'Meeting endTime must be strictly after startTime',
    path: ['endTime']
  });

export const meetingIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid meeting ID format (must be 24-character hexadecimal ObjectId)')
});

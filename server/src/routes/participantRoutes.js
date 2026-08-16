import { Router } from 'express';
import { participantController } from '../controllers/participantController.js';
import { meetingController } from '../controllers/meetingController.js';
import { validate } from '../middleware/validate.js';
import {
  createParticipantSchema,
  updateParticipantSchema,
  participantIdParamSchema
} from '../validators/participantValidator.js';
import { createMeetingSchema } from '../validators/meetingValidator.js';

export const participantRoutes = Router();

participantRoutes
  .route('/')
  .get(participantController.getAll)
  .post(validate({ body: createParticipantSchema }), participantController.create);

participantRoutes
  .route('/:id')
  .get(validate({ params: participantIdParamSchema }), participantController.getById)
  .put(
    validate({ params: participantIdParamSchema, body: updateParticipantSchema }),
    participantController.update
  )
  .delete(validate({ params: participantIdParamSchema }), participantController.delete);

// Nested participant meeting routes
participantRoutes
  .route('/:id/meetings')
  .get(validate({ params: participantIdParamSchema }), meetingController.getByParticipant)
  .post(
    validate({ params: participantIdParamSchema, body: createMeetingSchema }),
    meetingController.create
  );

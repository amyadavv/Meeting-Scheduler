import { Router } from 'express';
import { meetingController } from '../controllers/meetingController.js';
import { validate } from '../middleware/validate.js';
import { createMeetingSchema, meetingIdParamSchema } from '../validators/meetingValidator.js';

export const meetingRoutes = Router();

meetingRoutes
  .route('/')
  .get(meetingController.getAll)
  .post(validate({ body: createMeetingSchema }), meetingController.create);

meetingRoutes
  .route('/:id')
  .delete(validate({ params: meetingIdParamSchema }), meetingController.delete);

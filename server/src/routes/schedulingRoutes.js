import { Router } from 'express';
import { schedulingController } from '../controllers/schedulingController.js';
import { validate } from '../middleware/validate.js';
import { searchSlotsSchema } from '../validators/schedulingValidator.js';

export const schedulingRoutes = Router();

schedulingRoutes.post(
  '/slots',
  validate({ body: searchSlotsSchema }),
  schedulingController.findSlots
);

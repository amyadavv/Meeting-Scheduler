import { Router } from 'express';
import { healthRoutes } from './healthRoutes.js';
import { participantRoutes } from './participantRoutes.js';
import { meetingRoutes } from './meetingRoutes.js';
import { schedulingRoutes } from './schedulingRoutes.js';
import { seedRoutes } from './seedRoutes.js';

export const apiRouter = Router();

apiRouter.use('/', healthRoutes);
apiRouter.use('/participants', participantRoutes);
apiRouter.use('/meetings', meetingRoutes);
apiRouter.use('/scheduling', schedulingRoutes);
apiRouter.use('/seed', seedRoutes);

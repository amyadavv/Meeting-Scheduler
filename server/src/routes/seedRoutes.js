import { Router } from 'express';
import { seedController } from '../controllers/seedController.js';

export const seedRoutes = Router();

seedRoutes.post('/', seedController.seed);

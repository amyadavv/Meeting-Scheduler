import morgan from 'morgan';
import { env } from '../config/env.js';

// Custom token for response time in ms
export const requestLogger = env.isTest
  ? (req, res, next) => next() // Silent during tests
  : morgan(':method :url :status :res[content-length] - :response-time ms');

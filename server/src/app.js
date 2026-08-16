import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';
import { NotFoundError } from './errors/index.js';

export const createApp = () => {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration - Supports local, production CLIENT_URL, and Vercel deployments
  app.use(
    cors({
      origin: (origin, callback) => {
        if (
          !origin ||
          origin === env.CLIENT_URL ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost') ||
          env.isDevelopment ||
          env.isTest
        ) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for origin: ${origin}`));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    })
  );

  // Body parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Logging
  app.use(requestLogger);

  // Rate limiting (applied to all /api routes)
  app.use('/api', apiRateLimiter);

  // Mount API Router
  app.use('/api', apiRouter);

  // Catch-all 404 handler for unmatched routes
  app.use((req, res, next) => {
    next(new NotFoundError('Route', `${req.method} ${req.originalUrl}`));
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};

export const app = createApp();

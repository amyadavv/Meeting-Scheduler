import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { formatErrorResponse } from '../utils/responseEnvelope.js';

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.isTest ? 10000 : env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
      formatErrorResponse({
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests created from this IP, please try again later.',
        details: [{ windowMs: env.RATE_LIMIT_WINDOW_MS, maxAllowed: env.RATE_LIMIT_MAX }]
      })
    );
  }
});

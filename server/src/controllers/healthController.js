import mongoose from 'mongoose';
import { formatSuccessResponse } from '../utils/responseEnvelope.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export const healthController = {
  getHealth: (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const payload = {
      status: 'healthy',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatusMap[dbState] || 'unknown',
        connected: dbState === 1
      }
    };

    return res.status(HTTP_STATUS.OK).json(formatSuccessResponse(payload));
  }
};

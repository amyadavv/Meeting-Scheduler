import { AppError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { formatErrorResponse } from '../utils/responseEnvelope.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose duplicate key error (MongoServerError: E11000)
  if (err.code === 11000) {
    const keys = Object.keys(err.keyPattern || err.keyValue || {});
    const duplicateField = keys.length > 0 ? keys[0] : 'field';
    const duplicateValue = err.keyValue ? err.keyValue[duplicateField] : '';
    
    error = new AppError(
      `A participant with ${duplicateField} '${duplicateValue}' already exists.`,
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.CONFLICT,
      [{ field: duplicateField, value: duplicateValue, message: `${duplicateField} must be unique` }]
    );
  }

  // Handle Mongoose schema validation errors
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    error = new AppError(
      'Database schema validation failed',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      details
    );
  }

  // Handle Mongoose invalid ObjectId CastError
  if (err.name === 'CastError') {
    error = new AppError(
      `Invalid ${err.path}: '${err.value}'`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      [{ field: err.path, value: err.value, message: 'Malformed identifier format' }]
    );
  }

  // Handle malformed JSON body parser error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError(
      'Malformed JSON payload in request body',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const errorCode = error.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR;
  const message = error.isOperational ? error.message : 'An unexpected internal error occurred';
  const details = error.details || [];

  // Log unhandled server errors (500)
  if (!error.isOperational && !env.isTest) {
    process.stderr.write(`[UNHANDLED ERROR] ${err.name}: ${err.message}\n${err.stack}\n`);
  }

  return res.status(statusCode).json(
    formatErrorResponse({
      code: errorCode,
      message,
      details
    })
  );
};

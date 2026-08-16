import { AppError } from './AppError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export class ValidationError extends AppError {
  constructor(message = 'Request validation failed', details = []) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', identifier = '') {
    const msg = identifier ? `${resource} with identifier '${identifier}' was not found` : `${resource} not found`;
    super(msg, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'A conflicting resource already exists', details = []) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, details);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message = 'Business rule invariant violation', details = []) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.BUSINESS_RULE_VIOLATION, details);
  }
}

export class InvalidTimezoneError extends AppError {
  constructor(timezone) {
    super(
      `Invalid or unsupported IANA timezone identifier: '${timezone}'`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_TIMEZONE,
      [{ field: 'timezone', value: timezone, message: 'Must be a valid IANA timezone name (e.g., Asia/Kolkata)' }]
    );
  }
}

import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * Standardizes successful API responses across all endpoints.
 * @param {*} data - Payload returned by the service
 * @param {Object} [meta] - Optional metadata (e.g. pagination, summary)
 * @returns {Object} Uniform envelope { success: true, data, [meta] }
 */
export const formatSuccessResponse = (data = {}, meta = null) => {
  const response = {
    success: true,
    data
  };

  if (meta && Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return response;
};

/**
 * Standardizes error API responses across all endpoints.
 * @param {Object} options
 * @param {string} options.code - Application error code
 * @param {string} options.message - Human-readable error message
 * @param {Array} [options.details] - Detailed validation or field errors
 * @returns {Object} Uniform envelope { success: false, error: { code, message, details } }
 */
export const formatErrorResponse = ({
  code = ERROR_CODES.INTERNAL_SERVER_ERROR,
  message = 'An unexpected internal error occurred',
  details = []
}) => {
  return {
    success: false,
    error: {
      code,
      message,
      details: Array.isArray(details) ? details : [details]
    }
  };
};

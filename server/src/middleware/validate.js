import { ValidationError } from '../errors/index.js';

/**
 * Middleware factory for validating Express request payloads against Zod schemas.
 * @param {Object} schemas - { body, query, params }
 */
export const validate = (schemas = {}) => {
  return async (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error.errors && Array.isArray(error.errors)) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        return next(new ValidationError('Request validation failed', details));
      }
      next(error);
    }
  };
};

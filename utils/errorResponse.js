/**
 * Custom error classes for the API
 */

/**
 * Base error class for API errors
 * @extends Error
 */
class ApiError extends Error {
  /**
   * Create an API error
   * @param {String} message - Error message
   * @param {Number} statusCode - HTTP status code
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found error (404)
 * @extends ApiError
 */
class NotFoundError extends ApiError {
  /**
   * Create a not found error
   * @param {String} message - Error message
   */
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Bad request error (400)
 * @extends ApiError
 */
class BadRequestError extends ApiError {
  /**
   * Create a bad request error
   * @param {String} message - Error message
   */
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

/**
 * Unauthorized error (401)
 * @extends ApiError
 */
class UnauthorizedError extends ApiError {
  /**
   * Create an unauthorized error
   * @param {String} message - Error message
   */
  constructor(message = 'Unauthorized access') {
    super(message, 401);
  }
}

/**
 * Forbidden error (403)
 * @extends ApiError
 */
class ForbiddenError extends ApiError {
  /**
   * Create a forbidden error
   * @param {String} message - Error message
   */
  constructor(message = 'Forbidden access') {
    super(message, 403);
  }
}

/**
 * Validation error (422)
 * @extends ApiError
 */
class ValidationError extends ApiError {
  /**
   * Create a validation error
   * @param {String} message - Error message
   */
  constructor(message = 'Validation failed') {
    super(message, 422);
  }
}

module.exports = {
  ApiError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError
};
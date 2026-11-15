const { sendError } = require('../utils/response');

/**
 * Centralized error handling middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Handle JSON parse errors from body-parser/express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 400, 'Invalid JSON format in request body');
  }

  // Handle SQLite specific errors from better-sqlite3
  if (err && err.code) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return sendError(res, 409, 'A record with this unique value already exists');
    }
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return sendError(
        res,
        400,
        'Foreign key constraint violation: referenced entity does not exist or has active dependencies'
      );
    }
    if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
      return sendError(res, 400, 'Value does not meet database constraint requirements');
    }
  }

  // Custom status code if provided on error object
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  return sendError(res, statusCode, message);
};

module.exports = errorHandler;

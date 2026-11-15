/**
 * Response Utility
 * Standardizes API responses across LabKit Central.
 */

const sendSuccess = (res, statusCode = 200, message = 'Operation successful', data = undefined) => {
  const payload = {
    success: true,
    message
  };

  if (data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

const sendError = (res, statusCode = 500, message = 'Internal server error') => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  sendSuccess,
  sendError
};

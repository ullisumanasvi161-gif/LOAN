const { sendError } = require('../utils/response');

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email.trim());
};

/**
 * Middleware: Validate numeric route ID parameter
 */
const validateIdParam = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return sendError(res, 400, 'Invalid ID parameter. ID must be a positive integer.');
  }
  req.validatedId = id;
  next();
};

/**
 * Middleware: Validate Researcher creation payload
 * Requirements:
 * - Name is required
 * - Email is required & valid format
 * - Department is required
 */
const validateCreateResearcher = (req, res, next) => {
  const { name, email, department } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return sendError(res, 400, 'Name is required and cannot be empty');
  }

  if (!email || typeof email !== 'string' || email.trim() === '') {
    return sendError(res, 400, 'Email is required');
  }

  if (!isValidEmail(email)) {
    return sendError(res, 400, 'Email must have a valid format (e.g., user@example.com)');
  }

  if (!department || typeof department !== 'string' || department.trim() === '') {
    return sendError(res, 400, 'Department is required and cannot be empty');
  }

  next();
};

/**
 * Middleware: Validate Researcher update payload
 */
const validateUpdateResearcher = (req, res, next) => {
  const { name, email, department } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return sendError(res, 400, 'Name cannot be empty');
    }
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !isValidEmail(email)) {
      return sendError(res, 400, 'Email must have a valid format (e.g., user@example.com)');
    }
  }

  if (department !== undefined) {
    if (typeof department !== 'string' || department.trim() === '') {
      return sendError(res, 400, 'Department cannot be empty');
    }
  }

  // At least one field must be provided for update
  if (name === undefined && email === undefined && department === undefined) {
    return sendError(res, 400, 'At least one field (name, email, department) must be provided for update');
  }

  next();
};

/**
 * Middleware: Validate Microscope creation payload
 * Requirements:
 * - Name is required
 * - Type is required
 * - Status must be available, borrowed, or maintenance
 */
const validateCreateMicroscope = (req, res, next) => {
  const { name, type, status } = req.body;
  const allowedStatuses = ['available', 'borrowed', 'maintenance'];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return sendError(res, 400, 'Microscope name is required and cannot be empty');
  }

  if (!type || typeof type !== 'string' || type.trim() === '') {
    return sendError(res, 400, 'Microscope type is required and cannot be empty');
  }

  if (!status || !allowedStatuses.includes(status)) {
    return sendError(
      res,
      400,
      `Status is required and must be one of: ${allowedStatuses.join(', ')}`
    );
  }

  next();
};

/**
 * Middleware: Validate Microscope update payload
 */
const validateUpdateMicroscope = (req, res, next) => {
  const { name, type, brand, status } = req.body;
  const allowedStatuses = ['available', 'borrowed', 'maintenance'];

  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    return sendError(res, 400, 'Microscope name cannot be empty');
  }

  if (type !== undefined && (typeof type !== 'string' || type.trim() === '')) {
    return sendError(res, 400, 'Microscope type cannot be empty');
  }

  if (status !== undefined && !allowedStatuses.includes(status)) {
    return sendError(
      res,
      400,
      `Status must be one of: ${allowedStatuses.join(', ')}`
    );
  }

  if (
    name === undefined &&
    type === undefined &&
    brand === undefined &&
    status === undefined
  ) {
    return sendError(res, 400, 'At least one field must be provided for update');
  }

  next();
};

/**
 * Middleware: Validate Loan creation payload
 * Requirements:
 * - researcher_id is required
 * - microscope_id is required
 */
const validateCreateLoan = (req, res, next) => {
  const { researcher_id, microscope_id } = req.body;

  if (researcher_id === undefined || researcher_id === null) {
    return sendError(res, 400, 'researcher_id is required');
  }

  const rId = Number(researcher_id);
  if (!Number.isInteger(rId) || rId <= 0) {
    return sendError(res, 400, 'researcher_id must be a valid positive integer');
  }

  if (microscope_id === undefined || microscope_id === null) {
    return sendError(res, 400, 'microscope_id is required');
  }

  const mId = Number(microscope_id);
  if (!Number.isInteger(mId) || mId <= 0) {
    return sendError(res, 400, 'microscope_id must be a valid positive integer');
  }

  req.body.researcher_id = rId;
  req.body.microscope_id = mId;

  next();
};

/**
 * Middleware: Validate Loan status update payload
 */
const validateLoanStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  const allowedStatuses = ['pending', 'approved', 'done'];

  if (!status || typeof status !== 'string') {
    return sendError(res, 400, 'Status is required in request body');
  }

  const normalizedStatus = status.trim().toLowerCase();
  if (!allowedStatuses.includes(normalizedStatus)) {
    return sendError(res, 400, 'Invalid status change');
  }

  req.body.status = normalizedStatus;
  next();
};

module.exports = {
  validateIdParam,
  validateCreateResearcher,
  validateUpdateResearcher,
  validateCreateMicroscope,
  validateUpdateMicroscope,
  validateCreateLoan,
  validateLoanStatusUpdate
};

const db = require('../database/database');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Retrieve all researchers
 * GET /researchers
 */
const getAllResearchers = (req, res, next) => {
  try {
    const researchers = db.prepare('SELECT * FROM Researchers ORDER BY id ASC').all();
    return sendSuccess(res, 200, 'Researchers retrieved successfully', researchers);
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieve a single researcher by ID
 * GET /researchers/:id
 */
const getResearcherById = (req, res, next) => {
  try {
    const { id } = req.params;
    const researcher = db.prepare('SELECT * FROM Researchers WHERE id = ?').get(id);

    if (!researcher) {
      return sendError(res, 404, 'Researcher not found');
    }

    return sendSuccess(res, 200, 'Researcher retrieved successfully', researcher);
  } catch (error) {
    return next(error);
  }
};

/**
 * Add a new researcher
 * POST /researchers
 */
const createResearcher = (req, res, next) => {
  try {
    const { name, email, department } = req.body;

    // Check for duplicate email
    const existing = db.prepare('SELECT id FROM Researchers WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (existing) {
      return sendError(res, 409, 'A researcher with this email already exists');
    }

    const stmt = db.prepare(`
      INSERT INTO Researchers (name, email, department)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(name.trim(), email.trim(), department.trim());
    const newResearcher = db.prepare('SELECT * FROM Researchers WHERE id = ?').get(result.lastInsertRowid);

    return sendSuccess(res, 201, 'Researcher created successfully', newResearcher);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update researcher details
 * PUT /researchers/:id
 */
const updateResearcher = (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, department } = req.body;

    const existingResearcher = db.prepare('SELECT * FROM Researchers WHERE id = ?').get(id);
    if (!existingResearcher) {
      return sendError(res, 404, 'Researcher not found');
    }

    // Check duplicate email if email changed
    if (email && email.trim().toLowerCase() !== existingResearcher.email.toLowerCase()) {
      const emailConflict = db.prepare('SELECT id FROM Researchers WHERE LOWER(email) = LOWER(?) AND id != ?').get(email.trim(), id);
      if (emailConflict) {
        return sendError(res, 409, 'Email is already in use by another researcher');
      }
    }

    const updatedName = name !== undefined ? name.trim() : existingResearcher.name;
    const updatedEmail = email !== undefined ? email.trim() : existingResearcher.email;
    const updatedDepartment = department !== undefined ? department.trim() : existingResearcher.department;

    db.prepare(`
      UPDATE Researchers
      SET name = ?, email = ?, department = ?
      WHERE id = ?
    `).run(updatedName, updatedEmail, updatedDepartment, id);

    const updatedResearcher = db.prepare('SELECT * FROM Researchers WHERE id = ?').get(id);

    return sendSuccess(res, 200, 'Researcher updated successfully', updatedResearcher);
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a researcher
 * DELETE /researchers/:id
 */
const deleteResearcher = (req, res, next) => {
  try {
    const { id } = req.params;

    const existingResearcher = db.prepare('SELECT * FROM Researchers WHERE id = ?').get(id);
    if (!existingResearcher) {
      return sendError(res, 404, 'Researcher not found');
    }

    // Check if researcher has associated loans to provide clear message before FK constraint
    const activeLoans = db.prepare('SELECT count(*) as count FROM Loans WHERE researcher_id = ?').get(id);
    if (activeLoans && activeLoans.count > 0) {
      return sendError(
        res,
        400,
        'Cannot delete researcher with existing loan records. Delete associated loans first.'
      );
    }

    db.prepare('DELETE FROM Researchers WHERE id = ?').run(id);

    return sendSuccess(res, 200, 'Researcher deleted successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllResearchers,
  getResearcherById,
  createResearcher,
  updateResearcher,
  deleteResearcher
};

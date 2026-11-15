const db = require('../database/database');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Retrieve all microscopes with optional search filters
 * GET /microscopes
 * Supports query parameters:
 *  - ?type=compound
 *  - ?status=available
 */
const getAllMicroscopes = (req, res, next) => {
  try {
    const { type, status } = req.query;

    let sql = 'SELECT * FROM Microscopes WHERE 1=1';
    const params = [];

    if (type && typeof type === 'string' && type.trim() !== '') {
      sql += ' AND LOWER(type) = LOWER(?)';
      params.push(type.trim());
    }

    if (status && typeof status === 'string' && status.trim() !== '') {
      sql += ' AND LOWER(status) = LOWER(?)';
      params.push(status.trim());
    }

    sql += ' ORDER BY id ASC';

    const microscopes = db.prepare(sql).all(...params);
    return sendSuccess(res, 200, 'Microscopes retrieved successfully', microscopes);
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieve a single microscope by ID
 * GET /microscopes/:id
 */
const getMicroscopeById = (req, res, next) => {
  try {
    const { id } = req.params;
    const microscope = db.prepare('SELECT * FROM Microscopes WHERE id = ?').get(id);

    if (!microscope) {
      return sendError(res, 404, 'Microscope not found');
    }

    return sendSuccess(res, 200, 'Microscope retrieved successfully', microscope);
  } catch (error) {
    return next(error);
  }
};

/**
 * Add a new microscope
 * POST /microscopes
 */
const createMicroscope = (req, res, next) => {
  try {
    const { name, type, brand, status } = req.body;

    const stmt = db.prepare(`
      INSERT INTO Microscopes (name, type, brand, status)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      type.trim().toLowerCase(),
      brand ? brand.trim() : null,
      status.trim().toLowerCase()
    );

    const newMicroscope = db.prepare('SELECT * FROM Microscopes WHERE id = ?').get(result.lastInsertRowid);

    return sendSuccess(res, 201, 'Microscope created successfully', newMicroscope);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update microscope details
 * PUT /microscopes/:id
 */
const updateMicroscope = (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, brand, status } = req.body;

    const existing = db.prepare('SELECT * FROM Microscopes WHERE id = ?').get(id);
    if (!existing) {
      return sendError(res, 404, 'Microscope not found');
    }

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedType = type !== undefined ? type.trim().toLowerCase() : existing.type;
    const updatedBrand = brand !== undefined ? (brand ? brand.trim() : null) : existing.brand;
    const updatedStatus = status !== undefined ? status.trim().toLowerCase() : existing.status;

    db.prepare(`
      UPDATE Microscopes
      SET name = ?, type = ?, brand = ?, status = ?
      WHERE id = ?
    `).run(updatedName, updatedType, updatedBrand, updatedStatus, id);

    const updatedMicroscope = db.prepare('SELECT * FROM Microscopes WHERE id = ?').get(id);

    return sendSuccess(res, 200, 'Microscope updated successfully', updatedMicroscope);
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a microscope
 * DELETE /microscopes/:id
 */
const deleteMicroscope = (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM Microscopes WHERE id = ?').get(id);
    if (!existing) {
      return sendError(res, 404, 'Microscope not found');
    }

    // Check if microscope has associated loans
    const activeLoans = db.prepare('SELECT count(*) as count FROM Loans WHERE microscope_id = ?').get(id);
    if (activeLoans && activeLoans.count > 0) {
      return sendError(
        res,
        400,
        'Cannot delete microscope with existing loan records. Delete associated loans first.'
      );
    }

    db.prepare('DELETE FROM Microscopes WHERE id = ?').run(id);

    return sendSuccess(res, 200, 'Microscope deleted successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllMicroscopes,
  getMicroscopeById,
  createMicroscope,
  updateMicroscope,
  deleteMicroscope
};

const db = require('../database/database');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Retrieve all loans
 * GET /loans
 */
const getAllLoans = (req, res, next) => {
  try {
    const loans = db.prepare('SELECT * FROM Loans ORDER BY id ASC').all();
    return sendSuccess(res, 200, 'Loans retrieved successfully', loans);
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieve a single loan by ID
 * GET /loans/:id
 */
const getLoanById = (req, res, next) => {
  try {
    const { id } = req.params;
    const loan = db.prepare('SELECT * FROM Loans WHERE id = ?').get(id);

    if (!loan) {
      return sendError(res, 404, 'Loan not found');
    }

    return sendSuccess(res, 200, 'Loan retrieved successfully', loan);
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieve detailed loans with JOIN across Researchers, Microscopes, and Loans
 * GET /loans/details
 * Important Assignment Requirement (Section 6.D):
 * Returns Loan ID, Researcher ID, Researcher name, Researcher email,
 * Microscope ID, Microscope name, Microscope type, Loan date, Loan status.
 */
const getLoanDetails = (req, res, next) => {
  try {
    const query = `
      SELECT 
        Loans.id AS id,
        Loans.id AS loan_id,
        Researchers.id AS researcher_id,
        Researchers.name AS researcher_name,
        Researchers.email AS researcher_email,
        Microscopes.id AS microscope_id,
        Microscopes.name AS microscope_name,
        Microscopes.type AS microscope_type,
        Loans.loan_date,
        Loans.status
      FROM Loans
      INNER JOIN Researchers ON Loans.researcher_id = Researchers.id
      INNER JOIN Microscopes ON Loans.microscope_id = Microscopes.id
      ORDER BY Loans.id ASC
    `;

    const details = db.prepare(query).all();
    return sendSuccess(res, 200, 'Loan details retrieved successfully', details);
  } catch (error) {
    return next(error);
  }
};

/**
 * Create a new loan
 * POST /loans
 * Requirements:
 * - Validate researcher_id and microscope_id exist
 * - Microscope must be available
 * - Automatically assign status as 'pending'
 * - Return HTTP 201
 */
const createLoan = (req, res, next) => {
  try {
    const { researcher_id, microscope_id } = req.body;

    // Check if researcher exists
    const researcher = db.prepare('SELECT id FROM Researchers WHERE id = ?').get(researcher_id);
    if (!researcher) {
      return sendError(res, 400, 'Researcher does not exist');
    }

    // Check if microscope exists
    const microscope = db.prepare('SELECT id, status FROM Microscopes WHERE id = ?').get(microscope_id);
    if (!microscope) {
      return sendError(res, 400, 'Microscope does not exist');
    }

    // Check microscope availability
    if (microscope.status !== 'available') {
      return sendError(res, 400, 'Microscope is currently not available for loan');
    }

    // Insert loan with status 'pending'
    const stmt = db.prepare(`
      INSERT INTO Loans (researcher_id, microscope_id, status)
      VALUES (?, ?, 'pending')
    `);

    const result = stmt.run(researcher_id, microscope_id);
    const newLoan = db.prepare('SELECT * FROM Loans WHERE id = ?').get(result.lastInsertRowid);

    return sendSuccess(res, 201, 'Loan created successfully', newLoan);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update loan information
 * PUT /loans/:id
 */
const updateLoan = (req, res, next) => {
  try {
    const { id } = req.params;
    const { loan_date } = req.body;

    const existingLoan = db.prepare('SELECT * FROM Loans WHERE id = ?').get(id);
    if (!existingLoan) {
      return sendError(res, 404, 'Loan not found');
    }

    const updatedDate = loan_date !== undefined ? loan_date : existingLoan.loan_date;

    db.prepare(`
      UPDATE Loans
      SET loan_date = ?
      WHERE id = ?
    `).run(updatedDate, id);

    const updated = db.prepare('SELECT * FROM Loans WHERE id = ?').get(id);
    return sendSuccess(res, 200, 'Loan updated successfully', updated);
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a loan
 * DELETE /loans/:id
 */
const deleteLoan = (req, res, next) => {
  try {
    const { id } = req.params;

    const loan = db.prepare('SELECT * FROM Loans WHERE id = ?').get(id);
    if (!loan) {
      return sendError(res, 404, 'Loan not found');
    }

    // If loan is approved/active, restore microscope to available
    const transaction = db.transaction(() => {
      if (loan.status === 'approved') {
        db.prepare("UPDATE Microscopes SET status = 'available' WHERE id = ?").run(loan.microscope_id);
      }
      db.prepare('DELETE FROM Loans WHERE id = ?').run(id);
    });

    transaction();

    return sendSuccess(res, 200, 'Loan deleted successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * IMPORTANT – Loan Status Workflow (Section 7)
 * PATCH /loans/:id/status
 * Transitions allowed:
 *  pending -> approved
 *  approved -> done
 * Invalid transitions: return HTTP 400 with "Invalid status change"
 */
const updateLoanStatus = (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: targetStatus } = req.body;

    const loan = db.prepare('SELECT * FROM Loans WHERE id = ?').get(id);
    if (!loan) {
      return sendError(res, 404, 'Loan not found');
    }

    const currentStatus = loan.status;

    // Strict validation of the one-step forward rule:
    // 1. pending -> approved
    // 2. approved -> done
    const isValidTransition =
      (currentStatus === 'pending' && targetStatus === 'approved') ||
      (currentStatus === 'approved' && targetStatus === 'done');

    if (!isValidTransition) {
      return sendError(res, 400, 'Invalid status change');
    }

    // Perform atomic status change and update microscope status accordingly
    const transaction = db.transaction(() => {
      // Update loan status
      db.prepare('UPDATE Loans SET status = ? WHERE id = ?').run(targetStatus, id);

      if (targetStatus === 'approved') {
        // When loan is approved, mark microscope as borrowed
        db.prepare("UPDATE Microscopes SET status = 'borrowed' WHERE id = ?").run(loan.microscope_id);
      } else if (targetStatus === 'done') {
        // When loan is completed, release microscope back to available
        db.prepare("UPDATE Microscopes SET status = 'available' WHERE id = ?").run(loan.microscope_id);
      }
    });

    transaction();

    return sendSuccess(res, 200, 'Loan status updated successfully', {
      id: Number(id),
      status: targetStatus
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllLoans,
  getLoanById,
  getLoanDetails,
  createLoan,
  updateLoan,
  deleteLoan,
  updateLoanStatus
};

const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const {
  validateIdParam,
  validateCreateLoan,
  validateLoanStatusUpdate
} = require('../middleware/validation');

// GET /loans - Retrieve all loans
router.get('/', loanController.getAllLoans);

// GET /loans/details - Important JOIN endpoint across Loans, Researchers, and Microscopes
// Placed before /:id so Express resolves 'details' before parameterized route
router.get('/details', loanController.getLoanDetails);

// GET /loans/:id - Retrieve a particular loan
router.get('/:id', validateIdParam, loanController.getLoanById);

// POST /loans - Create a new loan (status automatically 'pending', 201 Created)
router.post('/', validateCreateLoan, loanController.createLoan);

// PUT /loans/:id - Update loan information
router.put('/:id', validateIdParam, loanController.updateLoan);

// DELETE /loans/:id - Delete a loan
router.delete('/:id', validateIdParam, loanController.deleteLoan);

// PATCH /loans/:id/status - Status workflow transition (pending -> approved -> done)
router.patch('/:id/status', validateIdParam, validateLoanStatusUpdate, loanController.updateLoanStatus);

module.exports = router;

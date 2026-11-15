const express = require('express');
const router = express.Router();
const microscopeController = require('../controllers/microscopeController');
const {
  validateIdParam,
  validateCreateMicroscope,
  validateUpdateMicroscope
} = require('../middleware/validation');

// GET /microscopes - Retrieve all microscopes (supports ?type=... and ?status=... filters)
router.get('/', microscopeController.getAllMicroscopes);

// GET /microscopes/:id - Retrieve one microscope
router.get('/:id', validateIdParam, microscopeController.getMicroscopeById);

// POST /microscopes - Add a microscope
router.post('/', validateCreateMicroscope, microscopeController.createMicroscope);

// PUT /microscopes/:id - Update microscope details
router.put('/:id', validateIdParam, validateUpdateMicroscope, microscopeController.updateMicroscope);

// DELETE /microscopes/:id - Delete a microscope
router.delete('/:id', validateIdParam, microscopeController.deleteMicroscope);

module.exports = router;

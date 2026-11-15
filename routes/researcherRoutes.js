const express = require('express');
const router = express.Router();
const researcherController = require('../controllers/researcherController');
const {
  validateIdParam,
  validateCreateResearcher,
  validateUpdateResearcher
} = require('../middleware/validation');

// GET /researchers - Retrieve all researchers
router.get('/', researcherController.getAllResearchers);

// GET /researchers/:id - Retrieve one researcher
router.get('/:id', validateIdParam, researcherController.getResearcherById);

// POST /researchers - Add a researcher
router.post('/', validateCreateResearcher, researcherController.createResearcher);

// PUT /researchers/:id - Update researcher details
router.put('/:id', validateIdParam, validateUpdateResearcher, researcherController.updateResearcher);

// DELETE /researchers/:id - Delete a researcher
router.delete('/:id', validateIdParam, researcherController.deleteResearcher);

module.exports = router;

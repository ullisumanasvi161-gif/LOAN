const express = require('express');
const cors = require('cors');
const researcherRoutes = require('./routes/researcherRoutes');
const microscopeRoutes = require('./routes/microscopeRoutes');
const loanRoutes = require('./routes/loanRoutes');
const errorHandler = require('./middleware/errorHandler');
const { sendSuccess, sendError } = require('./utils/response');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for cross-origin requests (e.g. Vite dev server on port 5173)
app.use(cors());

// Middleware for parsing JSON request bodies
app.use(express.json());

// Welcome endpoint
app.get('/', (req, res) => {
  return sendSuccess(res, 200, 'Welcome to LabKit Central API');
});

// Modular Routes
app.use('/researchers', researcherRoutes);
app.use('/microscopes', microscopeRoutes);
app.use('/loans', loanRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start server if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`LabKit Central API server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;

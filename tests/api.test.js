const request = require('supertest');
const app = require('../app');
const db = require('../database/database');
const seedDatabase = require('../database/seed');

describe('LabKit Central API Test Suite', () => {
  beforeEach(() => {
    // Reset database to standard seed state before tests
    seedDatabase(db, true);
  });

  afterAll(() => {
    // Clean close
    db.close();
  });

  // ==========================================
  // 1. WELCOME ENDPOINT
  // ==========================================
  describe('GET / - Welcome API', () => {
    it('should return welcome message with status 200', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Welcome to LabKit Central API'
      });
    });
  });

  // ==========================================
  // 2. RESEARCHER ENDPOINTS
  // ==========================================
  describe('Researcher Endpoints', () => {
    it('GET /researchers - should retrieve all researchers', async () => {
      const res = await request(app).get('/researchers');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });

    it('GET /researchers/:id - should retrieve a specific researcher', async () => {
      const res = await request(app).get('/researchers/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.name).toBe('Dr. Elena Rostova');
    });

    it('GET /researchers/:id - should return 404 for non-existing researcher', async () => {
      const res = await request(app).get('/researchers/9999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('POST /researchers - should create a new researcher', async () => {
      const newResearcher = {
        name: 'Dr. Jane Doe',
        email: 'jane.doe@labkit.org',
        department: 'Biophysics'
      };

      const res = await request(app)
        .post('/researchers')
        .send(newResearcher);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(newResearcher.name);
      expect(res.body.data.email).toBe(newResearcher.email);
      expect(res.body.data.department).toBe(newResearcher.department);
      expect(res.body.data.id).toBeDefined();
    });

    it('POST /researchers - should reject duplicate email with 409 Conflict', async () => {
      const duplicate = {
        name: 'Duplicate Researcher',
        email: 'elena.rostova@labkit.org',
        department: 'Cellular Biology'
      };

      const res = await request(app)
        .post('/researchers')
        .send(duplicate);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('POST /researchers - should fail validation on invalid email', async () => {
      const invalid = {
        name: 'Dr. Invalid',
        email: 'not-an-email',
        department: 'Physics'
      };

      const res = await request(app)
        .post('/researchers')
        .send(invalid);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid format/i);
    });

    it('POST /researchers - should fail validation on missing fields', async () => {
      const invalid = {
        name: '',
        email: 'test@example.com'
      };

      const res = await request(app)
        .post('/researchers')
        .send(invalid);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('PUT /researchers/:id - should update researcher details', async () => {
      const updateData = {
        name: 'Dr. Elena Rostova Updated',
        department: 'Molecular Biology'
      };

      const res = await request(app)
        .put('/researchers/1')
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.department).toBe(updateData.department);
    });

    it('DELETE /researchers/:id - should fail to delete researcher with active loans', async () => {
      // Researcher 1 has active loans
      const res = await request(app).delete('/researchers/1');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/existing loan records/i);
    });

    it('DELETE /researchers/:id - should delete researcher without loans', async () => {
      // Create researcher without loans
      const createRes = await request(app)
        .post('/researchers')
        .send({
          name: 'Deletable Researcher',
          email: 'deletable@labkit.org',
          department: 'Chemistry'
        });
      const deleteId = createRes.body.data.id;

      const deleteRes = await request(app).delete(`/researchers/${deleteId}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      const checkRes = await request(app).get(`/researchers/${deleteId}`);
      expect(checkRes.status).toBe(404);
    });
  });

  // ==========================================
  // 3. MICROSCOPE ENDPOINTS
  // ==========================================
  describe('Microscope Endpoints', () => {
    it('GET /microscopes - should retrieve all microscopes', async () => {
      const res = await request(app).get('/microscopes');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(10);
    });

    it('GET /microscopes/:id - should retrieve a specific microscope', async () => {
      const res = await request(app).get('/microscopes/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.name).toBe('Olympus BX53');
    });

    it('GET /microscopes?type=compound - should filter microscopes by type', async () => {
      const res = await request(app).get('/microscopes?type=compound');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((m) => {
        expect(m.type.toLowerCase()).toBe('compound');
      });
    });

    it('GET /microscopes?type=electron - should filter microscopes by type electron', async () => {
      const res = await request(app).get('/microscopes?type=electron');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((m) => {
        expect(m.type.toLowerCase()).toBe('electron');
      });
    });

    it('GET /microscopes?status=available - should filter microscopes by status available', async () => {
      const res = await request(app).get('/microscopes?status=available');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((m) => {
        expect(m.status.toLowerCase()).toBe('available');
      });
    });

    it('POST /microscopes - should create a new microscope', async () => {
      const newMicroscope = {
        name: 'Zeiss Axio Zoom.V16',
        type: 'stereo',
        brand: 'Zeiss',
        status: 'available'
      };

      const res = await request(app)
        .post('/microscopes')
        .send(newMicroscope);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(newMicroscope.name);
      expect(res.body.data.type).toBe(newMicroscope.type);
      expect(res.body.data.brand).toBe(newMicroscope.brand);
      expect(res.body.data.status).toBe(newMicroscope.status);
    });

    it('POST /microscopes - should reject invalid status', async () => {
      const invalid = {
        name: 'Faulty Scope',
        type: 'compound',
        status: 'broken' // invalid status
      };

      const res = await request(app)
        .post('/microscopes')
        .send(invalid);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/status.*must be one of/i);
    });

    it('PUT /microscopes/:id - should update microscope details', async () => {
      const res = await request(app)
        .put('/microscopes/1')
        .send({
          status: 'maintenance'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('maintenance');
    });

    it('DELETE /microscopes/:id - should delete microscope without loans', async () => {
      // Create a new microscope without loans
      const createRes = await request(app)
        .post('/microscopes')
        .send({
          name: 'Temporary Microscope',
          type: 'compound',
          status: 'available'
        });
      const id = createRes.body.data.id;

      const deleteRes = await request(app).delete(`/microscopes/${id}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      const checkRes = await request(app).get(`/microscopes/${id}`);
      expect(checkRes.status).toBe(404);
    });
  });

  // ==========================================
  // 4. LOAN ENDPOINTS & MANDATORY WORKFLOW
  // ==========================================
  describe('Loan Endpoints & Workflow Rules', () => {
    it('GET /loans - should retrieve all loans', async () => {
      const res = await request(app).get('/loans');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });

    it('GET /loans/details - should return detailed loans using SQL INNER JOIN', async () => {
      const res = await request(app).get('/loans/details');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const sample = res.body.data[0];
      expect(sample).toHaveProperty('loan_id');
      expect(sample).toHaveProperty('researcher_id');
      expect(sample).toHaveProperty('researcher_name');
      expect(sample).toHaveProperty('researcher_email');
      expect(sample).toHaveProperty('microscope_id');
      expect(sample).toHaveProperty('microscope_name');
      expect(sample).toHaveProperty('microscope_type');
      expect(sample).toHaveProperty('loan_date');
      expect(sample).toHaveProperty('status');
      expect(typeof sample.researcher_name).toBe('string');
      expect(typeof sample.microscope_name).toBe('string');
    });

    // ----------------------------------------
    // MANDATORY WORKFLOW TESTS (Section 11)
    // ----------------------------------------
    it('MANDATORY Test 1: Create a loan -> Expected: pending, HTTP 201', async () => {
      // Microscope 8 is 'available'
      const payload = {
        researcher_id: 1,
        microscope_id: 8
      };

      const res = await request(app)
        .post('/loans')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.researcher_id).toBe(1);
      expect(res.body.data.microscope_id).toBe(8);
      expect(res.body.data.id).toBeDefined();
    });

    it('MANDATORY Test 2: Change pending -> approved -> Expected: HTTP 200', async () => {
      // Loan 6 in seed data is initially 'pending'
      const res = await request(app)
        .patch('/loans/6/status')
        .send({ status: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Loan status updated successfully');
      expect(res.body.data).toEqual({
        id: 6,
        status: 'approved'
      });

      // Verify the associated microscope (microscope 5) is now marked as 'borrowed'
      const scopeRes = await request(app).get('/microscopes/5');
      expect(scopeRes.body.data.status).toBe('borrowed');
    });

    it('MANDATORY Test 3: Change approved -> pending -> Expected: HTTP 400', async () => {
      // Loan 1 in seed data is initially 'approved'
      const res = await request(app)
        .patch('/loans/1/status')
        .send({ status: 'pending' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid status change');
    });

    it('Status Workflow: Change approved -> done -> Expected: HTTP 200', async () => {
      // Loan 1 in seed data is 'approved'
      const res = await request(app)
        .patch('/loans/1/status')
        .send({ status: 'done' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('done');

      // Verify the associated microscope (microscope 3) is released back to 'available'
      const scopeRes = await request(app).get('/microscopes/3');
      expect(scopeRes.body.data.status).toBe('available');
    });

    it('Status Workflow: Attempt transition on done loan -> Expected: HTTP 400', async () => {
      // Loan 4 is 'done'
      const res = await request(app)
        .patch('/loans/4/status')
        .send({ status: 'approved' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid status change');
    });

    it('Status Workflow: Attempt skipping pending -> done -> Expected: HTTP 400', async () => {
      // Loan 6 is 'pending'
      const res = await request(app)
        .patch('/loans/6/status')
        .send({ status: 'done' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid status change');
    });

    it('POST /loans - should reject loan if microscope is not available', async () => {
      // Microscope 3 is 'borrowed'
      const res = await request(app)
        .post('/loans')
        .send({
          researcher_id: 1,
          microscope_id: 3
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not available/i);
    });

    it('POST /loans - should reject loan if researcher does not exist', async () => {
      const res = await request(app)
        .post('/loans')
        .send({
          researcher_id: 9999,
          microscope_id: 1
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/researcher does not exist/i);
    });

    it('POST /loans - should reject loan if microscope does not exist', async () => {
      const res = await request(app)
        .post('/loans')
        .send({
          researcher_id: 1,
          microscope_id: 9999
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/microscope does not exist/i);
    });

    it('DELETE /loans/:id - should delete a loan successfully', async () => {
      const res = await request(app).delete('/loans/6');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const checkRes = await request(app).get('/loans/6');
      expect(checkRes.status).toBe(404);
    });
  });

  // ==========================================
  // 5. GENERAL ERROR HANDLING & NOT FOUND
  // ==========================================
  describe('Error Handling and Undefined Routes', () => {
    it('should return 404 for undefined routes', async () => {
      const res = await request(app).get('/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Route not found/i);
    });

    it('should return 400 for invalid non-integer ID parameter', async () => {
      const res = await request(app).get('/researchers/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/positive integer/i);
    });
  });
});

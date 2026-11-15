# LabKit Central – Laboratory Equipment Loan Management System

LabKit Central is a robust, modular RESTful API backend engineered with **Node.js**, **Express.js**, and **SQLite**. Designed for laboratory and research facilities, it streamlines microscope inventory management, researcher profiles, and equipment loans with strict workflow state transitions and relational integrity.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Design & Schema](#database-design--schema)
5. [Installation & Setup](#installation--setup)
6. [Running the Application](#running-the-application)
7. [API Documentation](#api-documentation)
   - [Welcome API](#welcome-api)
   - [Researcher Endpoints](#researcher-endpoints)
   - [Microscope Endpoints & Search Filters](#microscope-endpoints--search-filters)
   - [Loan Endpoints & JOIN Query](#loan-endpoints--join-query)
   - [Loan Status Workflow (One-Step Forward Rule)](#loan-status-workflow-one-step-forward-rule)
8. [Request Validation & Error Handling](#request-validation--error-handling)
9. [Automated Testing](#automated-testing)
10. [Postman API Collection](#postman-api-collection)

---

## Project Overview

In academic and industrial laboratories, specialized microscopes (e.g., compound, electron, fluorescence, confocal) are high-value shared resources. LabKit Central provides an equipment management system that:
- Maintains researcher profiles across different scientific departments.
- Tracks microscope inventory, specifications, and availability (`available`, `borrowed`, `maintenance`).
- Facilitates equipment borrowing through automated loan records.
- Enforces an assignment-critical, one-way state transition workflow (`pending` → `approved` → `done`).
- Delivers a unified relational view combining researcher details and microscope specifications using SQL `INNER JOIN`.

---

## Technology Stack

- **Runtime Environment:** Node.js (v22+)
- **Backend Framework:** Express.js (v5)
- **Database Engine:** SQLite (stored in `labkit.db`)
- **Database Driver:** `better-sqlite3` (synchronous, prepared statements, zero overhead)
- **Module System:** CommonJS (`require` / `module.exports`)
- **Development Tool:** Nodemon (hot-reloading)
- **Automated Testing:** Jest & Supertest
- **API Client:** Postman Collection (v2.1.0)
- **Version Control:** Git & GitHub

---

## Project Structure

```text
LabKit-Central/
├── app.js                              # Main application entry point & Express configuration
├── package.json                        # Project metadata, dependencies, and npm scripts
├── .gitignore                          # Git exclusions (node_modules, db files, logs)
├── README.md                           # Comprehensive documentation
├── database/
│   ├── database.js                     # SQLite connection and foreign key initialization
│   ├── schema.sql                      # DDL schema definitions for 3 relational tables
│   └── seed.js                         # Database seeder with sample researchers, microscopes & loans
├── routes/
│   ├── researcherRoutes.js             # Routes for researcher CRUD operations
│   ├── microscopeRoutes.js             # Routes for microscope CRUD & parameterized search
│   └── loanRoutes.js                   # Routes for loans, SQL JOIN details, and status patch
├── controllers/
│   ├── researcherController.js         # Business logic for researcher management
│   ├── microscopeController.js         # Business logic for microscope inventory & search
│   └── loanController.js               # Business logic for loans, JOIN, & status workflow
├── middleware/
│   ├── errorHandler.js                 # Centralized error handler and SQLite error translator
│   └── validation.js                   # Request validation middleware for inputs and IDs
├── utils/
│   └── response.js                     # Standardized JSON response helper functions
├── tests/
│   └── api.test.js                     # Automated Jest & Supertest test suite (34 passing tests)
└── postman/
    └── LabKit-Central.postman_collection.json  # 20 preconfigured Postman requests with test assertions
```

---

## Database Design & Schema

LabKit Central enforces relational constraints with `PRAGMA foreign_keys = ON;`. Parameterized queries are strictly applied across all SQL operations to prevent SQL injection vulnerabilities.

### 1. `Researchers`
Represents registered scientific personnel.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `name` | TEXT | NOT NULL | Researcher full name |
| `email` | TEXT | UNIQUE NOT NULL | Unique email address |
| `department` | TEXT | NOT NULL | Academic/Research department |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

### 2. `Microscopes`
Represents laboratory microscope equipment.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `name` | TEXT | NOT NULL | Equipment designation / model name |
| `type` | TEXT | NOT NULL | e.g., `compound`, `electron`, `confocal`, `stereo` |
| `brand` | TEXT | NULLABLE | Manufacturer (e.g., Olympus, Nikon, Zeiss) |
| `status` | TEXT | NOT NULL CHECK IN (`available`, `borrowed`, `maintenance`) | Current operational status |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### 3. `Loans`
Represents equipment checkout requests and transactions.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique loan ID |
| `researcher_id` | INTEGER | NOT NULL REFERENCES `Researchers(id)` | Foreign key to researcher |
| `microscope_id` | INTEGER | NOT NULL REFERENCES `Microscopes(id)` | Foreign key to microscope |
| `loan_date` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Checkout timestamp |
| `status` | TEXT | NOT NULL CHECK IN (`pending`, `approved`, `done`) | Workflow lifecycle status |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Record timestamp |

---

## Installation & Setup

1. **Clone the repository or navigate to the project directory:**
   ```bash
   cd LOAN
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Seed the database:**
   Initializes `labkit.db` with 6 researchers, 12 microscopes, and 6 loan records:
   ```bash
   npm run seed
   ```

---

## Running the Application

### 1. Full-Stack Development Mode (API Server + Vite Frontend)
Starts the Express API server on `http://localhost:3000` and the interactive Vite UI on `http://localhost:5173` simultaneously:
```bash
npm run dev
```

### 2. Run in Vite Only
Launches the interactive Vite dashboard:
```bash
npm run vite
```
or:
```bash
npx vite
```
Open your browser at `http://localhost:5173`. (Ensure the backend server is running on port 3000 via `npm run server` or `npm start` to proxy API requests).

### 3. Run Backend API Server Only
```bash
npm run server
```
or for production:
```bash
npm start
```
The server listens on `http://localhost:3000` by default (or the port defined in `process.env.PORT`).

### 4. Build Vite Frontend for Production
```bash
npm run build
```

---

## API Documentation

All responses follow a consistent JSON payload structure.

### Response Conventions

**Success Response (HTTP 200 / 201):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

**Error Response (HTTP 400 / 404 / 409 / 500):**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

### Welcome API

#### `GET /`
Returns the API root welcome message.
- **Status:** `200 OK`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Welcome to LabKit Central API"
  }
  ```

---

### Researcher Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/researchers` | Retrieve all researchers |
| `GET` | `/researchers/:id` | Retrieve single researcher by ID |
| `POST` | `/researchers` | Register a new researcher |
| `PUT` | `/researchers/:id` | Update researcher details |
| `DELETE` | `/researchers/:id` | Delete researcher (blocked if active loans exist) |

#### Example: `POST /researchers`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Dr. Rosalind Franklin",
    "email": "rosalind.franklin@labkit.org",
    "department": "Structural Crystallography"
  }
  ```
- **Status:** `201 Created`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Researcher created successfully",
    "data": {
      "id": 7,
      "name": "Dr. Rosalind Franklin",
      "email": "rosalind.franklin@labkit.org",
      "department": "Structural Crystallography",
      "created_at": "2026-11-15 12:20:00"
    }
  }
  ```

---

### Microscope Endpoints & Search Filters

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/microscopes` | Retrieve all microscopes |
| `GET` | `/microscopes?type=:type` | Parameterized search filter by microscope type |
| `GET` | `/microscopes?status=:status` | Parameterized search filter by availability status |
| `GET` | `/microscopes/:id` | Retrieve single microscope by ID |
| `POST` | `/microscopes` | Add microscope to inventory |
| `PUT` | `/microscopes/:id` | Update microscope specifications |
| `DELETE` | `/microscopes/:id` | Delete microscope (blocked if associated loans exist) |

#### Example Search Queries:
- `GET /microscopes?type=compound`
- `GET /microscopes?type=electron`
- `GET /microscopes?status=available`

---

### Loan Endpoints & JOIN Query

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/loans` | Retrieve all loans |
| `GET` | `/loans/details` | **Important SQL INNER JOIN endpoint** across 3 tables |
| `GET` | `/loans/:id` | Retrieve single loan by ID |
| `POST` | `/loans` | Create new loan (automatically starts as `pending`) |
| `PUT` | `/loans/:id` | Update loan metadata |
| `DELETE` | `/loans/:id` | Delete loan record |
| `PATCH` | `/loans/:id/status` | Execute one-step forward status transition |

#### `POST /loans`
- **Validation Rules:**
  - `researcher_id` and `microscope_id` are required and must exist.
  - Microscope must currently have `status = 'available'`.
  - Initial status is automatically set to `pending`.
- **Request Body:**
  ```json
  {
    "researcher_id": 1,
    "microscope_id": 8
  }
  ```
- **Status:** `201 Created`

#### `GET /loans/details` (SQL INNER JOIN)
Combines `Loans`, `Researchers`, and `Microscopes` using `INNER JOIN`. Displays actual names and attributes rather than raw foreign keys:
```json
{
  "success": true,
  "message": "Loan details retrieved successfully",
  "data": [
    {
      "id": 1,
      "loan_id": 1,
      "researcher_id": 1,
      "researcher_name": "Dr. Elena Rostova",
      "researcher_email": "elena.rostova@labkit.org",
      "microscope_id": 3,
      "microscope_name": "Zeiss Axio Imager 2",
      "microscope_type": "compound",
      "loan_date": "2026-11-10 09:30:00",
      "status": "approved"
    }
  ]
}
```

---

### Loan Status Workflow (One-Step Forward Rule)

The system strictly enforces the assignment lifecycle rules:

$$\text{pending} \longrightarrow \text{approved} \longrightarrow \text{done}$$

#### Business Rules:
1. Every new loan automatically begins in the **`pending`** state.
2. `pending` can **only** transition forward to **`approved`**.
   - Upon approval, the associated microscope status is automatically updated to **`borrowed`**.
3. `approved` can **only** transition forward to **`done`**.
   - Upon completion, the microscope status is released back to **`available`**.
4. `done` is a terminal state and **cannot** transition to any other status.
5. Backward transitions (e.g., `approved` → `pending`) and invalid transitions (e.g., `pending` → `done`) are strictly rejected.
6. Any invalid transition returns **`HTTP 400 Bad Request`** with the message:
   ```json
   {
     "success": false,
     "message": "Invalid status change"
   }
   ```

#### Endpoint: `PATCH /loans/:id/status`
- **Request Body:**
  ```json
  {
    "status": "approved"
  }
  ```
- **Success Response (`HTTP 200 OK`):**
  ```json
  {
    "success": true,
    "message": "Loan status updated successfully",
    "data": {
      "id": 1,
      "status": "approved"
    }
  }
  ```
- **Invalid Transition Response (`HTTP 400 Bad Request`):**
  ```json
  {
    "success": false,
    "message": "Invalid status change"
  }
  ```

---

## Request Validation & Error Handling

- **Email Validation:** Verifies well-formed email addresses (`regex`).
- **Required Fields:** Name, email, department, type, status.
- **Allowed Status Sets:**
  - Microscopes: `['available', 'borrowed', 'maintenance']`
  - Loans: `['pending', 'approved', 'done']`
- **Integrity Protection:** Deleting a researcher or microscope with active loans returns an explicit 400 error rather than an unhandled crash.
- **Centralized Middleware:** Captures SQLite unique constraint violations (`409 Conflict`), malformed JSON payloads (`400 Bad Request`), and foreign key violations.

---

## Automated Testing

An automated test suite using **Jest** and **Supertest** is included in `tests/api.test.js`.

### Running Tests:
```bash
npm test
```

### Coverage Overview (34 Passing Tests):
- **Welcome API:** Status 200 and greeting payload verification.
- **Researcher CRUD:** Create, duplicate email conflict (409), read by ID, update, and deletion restriction.
- **Microscope CRUD:** Create, status constraint checking, read, update, delete.
- **Search Filters:** Parameterized queries by `type` and `status`.
- **Mandatory Status Workflow Tests:**
  - **Test 1:** Loan creation with initial `pending` status (`HTTP 201`).
  - **Test 2:** Transition `pending` → `approved` (`HTTP 200`) and microscope status sync.
  - **Test 3:** Transition `approved` → `pending` rejection (`HTTP 400`).
- **Workflow Boundary Tests:** `approved` → `done`, terminal state checks, skip transition checks (`pending` → `done`).
- **JOIN Endpoint:** Verification of researcher and microscope attributes returned together.
- **Validation & Errors:** Missing fields, non-existent foreign keys, malformed IDs, 404 routes.

---

## Postman API Collection

A preconfigured Postman collection is located at:
`postman/LabKit-Central.postman_collection.json`

### Included Requests (20 Total):
1. `Welcome API` (`GET /`)
2. `Get all researchers` (`GET /researchers`)
3. `Get researcher by ID` (`GET /researchers/1`)
4. `Create researcher` (`POST /researchers`)
5. `Update researcher` (`PUT /researchers/1`)
6. `Delete researcher` (`DELETE /researchers/:id`)
7. `Get all microscopes` (`GET /microscopes`)
8. `Get microscope by ID` (`GET /microscopes/1`)
9. `Create microscope` (`POST /microscopes`)
10. `Update microscope` (`PUT /microscopes/1`)
11. `Delete microscope` (`DELETE /microscopes/:id`)
12. `Search microscopes by type` (`GET /microscopes?type=compound`)
13. `Search microscopes by status` (`GET /microscopes?status=available`)
14. `Get all loans` (`GET /loans`)
15. `Create loan` (`POST /loans`)
16. `Get loan details using JOIN` (`GET /loans/details`)
17. `Change loan status from pending to approved` (`PATCH /loans/6/status`)
18. `Change loan status from approved to done` (`PATCH /loans/1/status`)
19. `Test invalid status transition` (`PATCH /loans/1/status`)
20. `Test invalid researcher or microscope ID` (`POST /loans`)

### Importing into Postman:
1. Open Postman.
2. Click **Import** > Select `postman/LabKit-Central.postman_collection.json`.
3. The collection defines a collection variable `baseUrl` set to `http://localhost:3000`.
4. Start your server with `npm run dev` and execute the collection!
#   L O A N  
 
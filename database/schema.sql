-- Enable SQLite Foreign Key Enforcement
PRAGMA foreign_keys = ON;

-- Table: Researchers
CREATE TABLE IF NOT EXISTS Researchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: Microscopes
CREATE TABLE IF NOT EXISTS Microscopes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    brand TEXT,
    status TEXT NOT NULL CHECK(status IN ('available', 'borrowed', 'maintenance')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: Loans
CREATE TABLE IF NOT EXISTS Loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    researcher_id INTEGER NOT NULL,
    microscope_id INTEGER NOT NULL,
    loan_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'done')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (researcher_id) REFERENCES Researchers(id) ON DELETE RESTRICT,
    FOREIGN KEY (microscope_id) REFERENCES Microscopes(id) ON DELETE RESTRICT
);

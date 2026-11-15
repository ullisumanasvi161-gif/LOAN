const db = require('./database');

function seedDatabase(database = db, silent = false) {
  const transaction = database.transaction(() => {
    // Clean up existing records in reverse dependency order
    database.prepare('DELETE FROM Loans').run();
    database.prepare('DELETE FROM Microscopes').run();
    database.prepare('DELETE FROM Researchers').run();

    // Reset autoincrement sequences
    database.prepare("DELETE FROM sqlite_sequence WHERE name IN ('Loans', 'Microscopes', 'Researchers')").run();

    // 1. Seed Researchers (6 researchers >= 5 required)
    const insertResearcher = database.prepare(`
      INSERT INTO Researchers (name, email, department)
      VALUES (?, ?, ?)
    `);

    const researchers = [
      ['Dr. Elena Rostova', 'elena.rostova@labkit.org', 'Cellular Biology'],
      ['Dr. Marcus Vance', 'marcus.vance@labkit.org', 'Materials Science'],
      ['Dr. Aisha Patel', 'aisha.patel@labkit.org', 'Nanotechnology'],
      ['Dr. Liam Gallagher', 'liam.gallagher@labkit.org', 'Microbiology'],
      ['Dr. Sophia Chen', 'sophia.chen@labkit.org', 'Genetics & Genomics'],
      ['Dr. Carlos Mendez', 'carlos.mendez@labkit.org', 'Structural Biology']
    ];

    for (const r of researchers) {
      insertResearcher.run(...r);
    }

    // 2. Seed Microscopes (12 microscopes >= 10 required)
    const insertMicroscope = database.prepare(`
      INSERT INTO Microscopes (name, type, brand, status)
      VALUES (?, ?, ?, ?)
    `);

    const microscopes = [
      ['Olympus BX53', 'compound', 'Olympus', 'available'],
      ['Nikon Eclipse Ti2-E', 'inverted', 'Nikon', 'available'],
      ['Zeiss Axio Imager 2', 'compound', 'Zeiss', 'borrowed'],
      ['Leica TCS SP8', 'confocal', 'Leica', 'maintenance'],
      ['FEI Tecnai G2 F20', 'electron', 'Thermo Fisher', 'available'],
      ['Nikon SMZ18', 'stereo', 'Nikon', 'available'],
      ['Zeiss Sigma 300', 'electron', 'Zeiss', 'borrowed'],
      ['Olympus IX83', 'fluorescence', 'Olympus', 'available'],
      ['Leica DMi8', 'inverted', 'Leica', 'borrowed'],
      ['JEOL JEM-2100Plus', 'electron', 'JEOL', 'maintenance'],
      ['Olympus SZ61', 'stereo', 'Olympus', 'available'],
      ['Zeiss LSM 980', 'confocal', 'Zeiss', 'available']
    ];

    for (const m of microscopes) {
      insertMicroscope.run(...m);
    }

    // 3. Seed Loans (6 loans >= 5 required)
    const insertLoan = database.prepare(`
      INSERT INTO Loans (researcher_id, microscope_id, loan_date, status)
      VALUES (?, ?, ?, ?)
    `);

    const loans = [
      [1, 3, '2026-11-10 09:30:00', 'approved'],
      [2, 7, '2026-11-12 11:00:00', 'approved'],
      [3, 9, '2026-11-13 14:15:00', 'approved'],
      [4, 1, '2026-11-01 10:00:00', 'done'],
      [5, 2, '2026-11-05 16:45:00', 'done'],
      [6, 5, '2026-11-15 08:20:00', 'pending']
    ];

    for (const l of loans) {
      insertLoan.run(...l);
    }
  });

  transaction();
  if (!silent) {
    console.log('Database seeded successfully with sample researchers, microscopes, and loans.');
  }
}

// Run immediately if executed from command line
if (require.main === module) {
  seedDatabase(db);
}

module.exports = seedDatabase;

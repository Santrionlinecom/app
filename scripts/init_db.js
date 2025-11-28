import Database from 'better-sqlite3';

const db = new Database('tahfidz.db', { verbose: console.log });

console.log('Initializing database...');

try {
    // Create tables
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            username TEXT,
            password_hash TEXT,
            role TEXT DEFAULT 'santri',
            created_at INTEGER,
            google_id TEXT
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id),
            expires_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS google_accounts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id),
            google_id TEXT UNIQUE NOT NULL,
            email TEXT
        );

        CREATE TABLE IF NOT EXISTS hafalan_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL REFERENCES users(id),
            surah_number INTEGER NOT NULL,
            ayah_number INTEGER NOT NULL,
            status TEXT NOT NULL,
            tanggal_setor TEXT,
            tanggal_approve TEXT,
            UNIQUE(user_id, surah_number, ayah_number)
        );

        CREATE TABLE IF NOT EXISTS surah (
            number INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            total_ayah INTEGER NOT NULL
        );
    `);

    console.log('Tables created.');

    // Seed Surah data
    const surahs = [
        { number: 1, name: "Al-Fatihah", total_ayah: 7 },
        { number: 2, name: "Al-Baqarah", total_ayah: 286 },
        { number: 3, name: "Ali 'Imran", total_ayah: 200 },
        // ... (truncated for brevity, but in real run I'd include all or just a few for test)
        { number: 114, name: "An-Nas", total_ayah: 6 }
    ];

    // Just seed first and last for test to save space in this script, 
    // or I can copy the full list if needed. 
    // Actually, let's just ensure the table exists. The full seed is in the server file.
    // I'll just create the table.

    console.log('Database initialized successfully.');

    // Verify
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables now:', tables);

} catch (error) {
    console.error('Setup Error:', error);
}

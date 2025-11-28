import Database from 'better-sqlite3';

const db = new Database('tahfidz.db');

try {
    console.log('--- google_accounts schema ---');
    const gaInfo = db.prepare("PRAGMA table_info(google_accounts)").all();
    console.log(gaInfo);

    console.log('--- surah schema ---');
    const surahInfo = db.prepare("PRAGMA table_info(surah)").all();
    console.log(surahInfo);

} catch (error) {
    console.error('Schema Check Error:', error);
}

import Database from 'better-sqlite3';

const db = new Database('tahfidz.db', { verbose: console.log });

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables found:', tables);

    const progressTable = tables.find(t => t.name === 'hafalan_progress');
    if (progressTable) {
        console.log('hafalan_progress table exists.');
        const count = db.prepare('SELECT COUNT(*) as count FROM hafalan_progress').get();
        console.log('Row count:', count);
    } else {
        console.error('CRITICAL: hafalan_progress table MISSING!');
    }
} catch (error) {
    console.error('Database Error:', error);
}

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('tahfidz.db');

console.log('Initializing database...');

// 1. Create Tables
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
        status TEXT NOT NULL, -- 'belum', 'setor', 'disetujui'
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

// 2. Seed Surah Data
const surahs = [
    { number: 1, name: "Al-Fatihah", total_ayah: 7 },
    { number: 2, name: "Al-Baqarah", total_ayah: 286 },
    { number: 3, name: "Ali 'Imran", total_ayah: 200 },
    { number: 4, name: "An-Nisa'", total_ayah: 176 },
    { number: 5, name: "Al-Ma'idah", total_ayah: 120 },
    { number: 6, name: "Al-An'am", total_ayah: 165 },
    { number: 7, name: "Al-A'raf", total_ayah: 206 },
    { number: 8, name: "Al-Anfal", total_ayah: 75 },
    { number: 9, name: "At-Taubah", total_ayah: 129 },
    { number: 10, name: "Yunus", total_ayah: 109 },
    { number: 11, name: "Hud", total_ayah: 123 },
    { number: 12, name: "Yusuf", total_ayah: 111 },
    { number: 13, name: "Ar-Ra'd", total_ayah: 43 },
    { number: 14, name: "Ibrahim", total_ayah: 52 },
    { number: 15, name: "Al-Hijr", total_ayah: 99 },
    { number: 16, name: "An-Nahl", total_ayah: 128 },
    { number: 17, name: "Al-Isra'", total_ayah: 111 },
    { number: 18, name: "Al-Kahf", total_ayah: 110 },
    { number: 19, name: "Maryam", total_ayah: 98 },
    { number: 20, name: "Ta Ha", total_ayah: 135 },
    { number: 21, name: "Al-Anbiya'", total_ayah: 112 },
    { number: 22, name: "Al-Hajj", total_ayah: 78 },
    { number: 23, name: "Al-Mu'minun", total_ayah: 118 },
    { number: 24, name: "An-Nur", total_ayah: 64 },
    { number: 25, name: "Al-Furqan", total_ayah: 77 },
    { number: 26, name: "Asy-Syu'ara'", total_ayah: 227 },
    { number: 27, name: "An-Naml", total_ayah: 93 },
    { number: 28, name: "Al-Qasas", total_ayah: 88 },
    { number: 29, name: "Al-'Ankabut", total_ayah: 69 },
    { number: 30, name: "Ar-Rum", total_ayah: 60 },
    { number: 31, name: "Luqman", total_ayah: 34 },
    { number: 32, name: "As-Sajdah", total_ayah: 30 },
    { number: 33, name: "Al-Ahzab", total_ayah: 73 },
    { number: 34, name: "Saba'", total_ayah: 54 },
    { number: 35, name: "Fatir", total_ayah: 45 },
    { number: 36, name: "Ya Sin", total_ayah: 83 },
    { number: 37, name: "As-Saffat", total_ayah: 182 },
    { number: 38, name: "Sad", total_ayah: 88 },
    { number: 39, name: "Az-Zumar", total_ayah: 75 },
    { number: 40, name: "Ghafir", total_ayah: 85 },
    { number: 41, name: "Fussilat", total_ayah: 54 },
    { number: 42, name: "Asy-Syura", total_ayah: 53 },
    { number: 43, name: "Az-Zukhruf", total_ayah: 89 },
    { number: 44, name: "Ad-Dukhan", total_ayah: 59 },
    { number: 45, name: "Al-Jasiyah", total_ayah: 37 },
    { number: 46, name: "Al-Ahqaf", total_ayah: 35 },
    { number: 47, name: "Muhammad", total_ayah: 38 },
    { number: 48, name: "Al-Fath", total_ayah: 29 },
    { number: 49, name: "Al-Hujurat", total_ayah: 18 },
    { number: 50, name: "Qaf", total_ayah: 45 },
    { number: 51, name: "Az-Zariyat", total_ayah: 60 },
    { number: 52, name: "At-Tur", total_ayah: 49 },
    { number: 53, name: "An-Najm", total_ayah: 62 },
    { number: 54, name: "Al-Qamar", total_ayah: 55 },
    { number: 55, name: "Ar-Rahman", total_ayah: 78 },
    { number: 56, name: "Al-Waqi'ah", total_ayah: 96 },
    { number: 57, name: "Al-Hadid", total_ayah: 29 },
    { number: 58, name: "Al-Mujadilah", total_ayah: 22 },
    { number: 59, name: "Al-Hasyr", total_ayah: 24 },
    { number: 60, name: "Al-Mumtahanah", total_ayah: 13 },
    { number: 61, name: "As-Saff", total_ayah: 14 },
    { number: 62, name: "Al-Jumu'ah", total_ayah: 11 },
    { number: 63, name: "Al-Munafiqun", total_ayah: 11 },
    { number: 64, name: "At-Taghabun", total_ayah: 18 },
    { number: 65, name: "At-Talaq", total_ayah: 12 },
    { number: 66, name: "At-Tahrim", total_ayah: 12 },
    { number: 67, name: "Al-Mulk", total_ayah: 30 },
    { number: 68, name: "Al-Qalam", total_ayah: 52 },
    { number: 69, name: "Al-Haqqah", total_ayah: 52 },
    { number: 70, name: "Al-Ma'arij", total_ayah: 44 },
    { number: 71, name: "Nuh", total_ayah: 28 },
    { number: 72, name: "Al-Jinn", total_ayah: 28 },
    { number: 73, name: "Al-Muzzammil", total_ayah: 20 },
    { number: 74, name: "Al-Muddassir", total_ayah: 56 },
    { number: 75, name: "Al-Qiyamah", total_ayah: 40 },
    { number: 76, name: "Al-Insan", total_ayah: 31 },
    { number: 77, name: "Al-Mursalat", total_ayah: 50 },
    { number: 78, name: "An-Naba'", total_ayah: 40 },
    { number: 79, name: "An-Nazi'at", total_ayah: 46 },
    { number: 80, name: "'Abasa", total_ayah: 42 },
    { number: 81, name: "At-Takwir", total_ayah: 29 },
    { number: 82, name: "Al-Infitar", total_ayah: 19 },
    { number: 83, name: "Al-Mutaffifin", total_ayah: 36 },
    { number: 84, name: "Al-Insyiqaq", total_ayah: 25 },
    { number: 85, name: "Al-Buruj", total_ayah: 22 },
    { number: 86, name: "At-Tariq", total_ayah: 17 },
    { number: 87, name: "Al-A'la", total_ayah: 19 },
    { number: 88, name: "Al-Ghasyiyah", total_ayah: 26 },
    { number: 89, name: "Al-Fajr", total_ayah: 30 },
    { number: 90, name: "Al-Balad", total_ayah: 20 },
    { number: 91, name: "Asy-Syams", total_ayah: 15 },
    { number: 92, name: "Al-Lail", total_ayah: 21 },
    { number: 93, name: "Ad-Duha", total_ayah: 11 },
    { number: 94, name: "Al-Insyirah", total_ayah: 8 },
    { number: 95, name: "At-Tin", total_ayah: 8 },
    { number: 96, name: "Al-'Alaq", total_ayah: 19 },
    { number: 97, name: "Al-Qadr", total_ayah: 5 },
    { number: 98, name: "Al-Bayyinah", total_ayah: 8 },
    { number: 99, name: "Az-Zalzalah", total_ayah: 8 },
    { number: 100, name: "Al-'Adiyat", total_ayah: 11 },
    { number: 101, name: "Al-Qari'ah", total_ayah: 11 },
    { number: 102, name: "At-Takasur", total_ayah: 8 },
    { number: 103, name: "Al-'Asr", total_ayah: 3 },
    { number: 104, name: "Al-Humazah", total_ayah: 9 },
    { number: 105, name: "Al-Fil", total_ayah: 5 },
    { number: 106, name: "Quraisy", total_ayah: 4 },
    { number: 107, name: "Al-Ma'un", total_ayah: 7 },
    { number: 108, name: "Al-Kausar", total_ayah: 3 },
    { number: 109, name: "Al-Kafirun", total_ayah: 6 },
    { number: 110, name: "An-Nasr", total_ayah: 3 },
    { number: 111, name: "Al-Lahab", total_ayah: 5 },
    { number: 112, name: "Al-Ikhlas", total_ayah: 4 },
    { number: 113, name: "Al-Falaq", total_ayah: 5 },
    { number: 114, name: "An-Nas", total_ayah: 6 }
];

const insertSurah = db.prepare('INSERT OR IGNORE INTO surah (number, name, total_ayah) VALUES (?, ?, ?)');

const transaction = db.transaction((surahs) => {
    for (const s of surahs) {
        insertSurah.run(s.number, s.name, s.total_ayah);
    }
});

transaction(surahs);
console.log('Surah data seeded.');

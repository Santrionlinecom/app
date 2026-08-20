#!/usr/bin/env node
/**
 * Audit migrasi: bandingkan berkas di migrations/ dengan kenyataan skema D1.
 *
 * Untuk setiap berkas migrasi, kita tarik "penanda" (tabel/kolom/indeks yang
 * dibuatnya), lalu kita periksa apakah penanda itu benar-benar ada di database.
 * Hasilnya: mana yang sudah diterapkan, mana yang belum, dan mana yang tercatat
 * di d1_migrations. Tidak ada satu pun perintah tulis di skrip ini.
 *
 * Pemakaian: node scripts/audit-migrasi.mjs [--remote]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const REMOTE = process.argv.includes('--remote');
const DIR = path.resolve('migrations');

function d1(sql) {
	const cmd = ['wrangler', 'd1', 'execute', 'DB', REMOTE ? '--remote' : '--local', '--command', sql, '--json'];
	const raw = execFileSync('npx', cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
	const start = raw.indexOf('[');
	if (start === -1) throw new Error(`Tidak bisa membaca hasil:\n${raw}`);
	return JSON.parse(raw.slice(start)).flatMap((b) => b.results ?? []);
}

// --- 1. Kenyataan skema di database ---
const tables = new Set(d1("SELECT name FROM sqlite_master WHERE type='table';").map((r) => r.name));
const indexes = new Set(d1("SELECT name FROM sqlite_master WHERE type='index' AND name IS NOT NULL;").map((r) => r.name));

const columnsOf = new Map();
for (const t of tables) {
	try {
		const cols = d1(`PRAGMA table_info('${t}');`).map((r) => String(r.name).toLowerCase());
		columnsOf.set(t.toLowerCase(), new Set(cols));
	} catch {
		columnsOf.set(t.toLowerCase(), new Set());
	}
}

// --- 2. Catatan resmi d1_migrations ---
let recorded = new Set();
try {
	recorded = new Set(d1('SELECT name FROM d1_migrations;').map((r) => r.name));
} catch {
	// tabel belum ada
}

// --- 3. Penanda dari tiap berkas ---
const RE_TABLE = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?([A-Za-z0-9_]+)[`"']?/gi;
const RE_INDEX = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?([A-Za-z0-9_]+)[`"']?/gi;
const RE_ADDCOL = /ALTER\s+TABLE\s+[`"']?([A-Za-z0-9_]+)[`"']?\s+ADD\s+(?:COLUMN\s+)?[`"']?([A-Za-z0-9_]+)[`"']?/gi;
// Tabel sementara sering dibuat lalu di-RENAME jadi tabel final, atau dihapus di
// akhir migrasi. Keduanya TIDAK boleh dihitung sebagai penanda "harus ada".
const RE_RENAMED = /ALTER\s+TABLE\s+[`"']?([A-Za-z0-9_]+)[`"']?\s+RENAME\s+TO\s+[`"']?([A-Za-z0-9_]+)[`"']?/gi;
const RE_DROPPED = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?[`"']?([A-Za-z0-9_]+)[`"']?/gi;

function markers(rawSql) {
	// Buang komentar dulu — kalimat seperti "-- Create index for new columns"
	// bukan perintah, dan pernah terbaca sebagai indeks bernama "for".
	const sql = rawSql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');

	// Yang lenyap pada akhir migrasi: sumber RENAME dan sasaran DROP.
	const gone = new Set();
	for (const m of sql.matchAll(RE_RENAMED)) gone.add(m[1].toLowerCase());
	for (const m of sql.matchAll(RE_DROPPED)) gone.add(m[1].toLowerCase());
	// Nama hasil RENAME justru wajib ada.
	const renamedTo = [...sql.matchAll(RE_RENAMED)].map((m) => m[2]);

	const created = [...sql.matchAll(RE_TABLE)].map((m) => m[1]);
	const t = [...new Set([...created, ...renamedTo])].filter(
		(n) => !gone.has(n.toLowerCase()) || renamedTo.some((r) => r.toLowerCase() === n.toLowerCase())
	);
	const i = [...sql.matchAll(RE_INDEX)].map((m) => m[1]);
	const c = [...sql.matchAll(RE_ADDCOL)]
		.map((m) => [m[1], m[2]])
		.filter(([tbl]) => !gone.has(tbl.toLowerCase()));
	return { t, i, c };
}

const files = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
const rows = [];

for (const f of files) {
	const sql = readFileSync(path.join(DIR, f), 'utf8');
	const { t, i, c } = markers(sql);
	const checks = [];

	for (const name of t) checks.push([`table ${name}`, tables.has(name)]);
	for (const name of i) checks.push([`index ${name}`, indexes.has(name)]);
	for (const [tbl, col] of c) {
		const set = columnsOf.get(tbl.toLowerCase());
		checks.push([`${tbl}.${col}`, Boolean(set && set.has(col.toLowerCase()))]);
	}

	const total = checks.length;
	const hit = checks.filter(([, ok]) => ok).length;
	let status;
	if (total === 0) status = 'TAK-BERPENANDA'; // seed / update murni
	else if (hit === total) status = 'DITERAPKAN';
	else if (hit === 0) status = 'BELUM';
	else status = 'SEBAGIAN';

	rows.push({
		file: f,
		status,
		hit,
		total,
		recorded: recorded.has(f),
		missing: checks.filter(([, ok]) => !ok).map(([n]) => n)
	});
}

// --- 4. Laporan ---
const lingkungan = REMOTE ? 'REMOTE (produksi)' : 'LOKAL';
console.log(`\n=== AUDIT MIGRASI — ${lingkungan} ===\n`);
console.log('berkas'.padEnd(52), 'status'.padEnd(16), 'penanda', ' tercatat');
console.log('-'.repeat(92));
for (const r of rows) {
	console.log(
		r.file.padEnd(52),
		r.status.padEnd(16),
		`${r.hit}/${r.total}`.padEnd(8),
		r.recorded ? 'ya' : '—'
	);
}

const perluDijalankan = rows.filter((r) => r.status === 'BELUM' || r.status === 'SEBAGIAN');
const diterapkanTapiTakTercatat = rows.filter((r) => r.status === 'DITERAPKAN' && !r.recorded);

console.log(`\nTotal berkas: ${rows.length}`);
console.log(`Diterapkan tapi TIDAK tercatat di d1_migrations: ${diterapkanTapiTakTercatat.length}`);
for (const r of diterapkanTapiTakTercatat) console.log(`  - ${r.file}`);

console.log(`\nBelum/sebagian diterapkan: ${perluDijalankan.length}`);
for (const r of perluDijalankan) {
	console.log(`  - ${r.file} [${r.status}] kurang: ${r.missing.slice(0, 6).join(', ')}${r.missing.length > 6 ? ' …' : ''}`);
}

// --- 5. Deteksi nomor kembar ---
const byPrefix = new Map();
for (const f of files) {
	const p = f.split('_')[0];
	if (!byPrefix.has(p)) byPrefix.set(p, []);
	byPrefix.get(p).push(f);
}
const kembar = [...byPrefix.entries()].filter(([, list]) => list.length > 1);
console.log(`\nNomor kembar: ${kembar.length}`);
for (const [p, list] of kembar) console.log(`  ${p}: ${list.join('  |  ')}`);
console.log();

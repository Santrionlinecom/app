#!/usr/bin/env node

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const DEFAULT_DATABASE = 'DB';
const DEFAULT_BATCH_SIZE = 50;
const ALLOWED_STATUSES = new Set(['draft', 'review', 'published']);

const usage = `SantriOnline Asbabun Nuzul JSON importer

Usage:
  node scripts/asbab/import-asbab-json.mjs --input data/asbab/sample-asbab.json [options]

Options:
  --input, -i       JSON file path. Accepts an array or { "entries": [] }.
  --database, --db  D1 binding/database name. Default: DB
  --remote          Import to remote Cloudflare D1.
  --local           Import to local D1. Default.
  --batch-size      Statements per D1 execute batch. Default: 50
  --dry-run         Validate and print SQL without executing wrangler.
  --help, -h        Show this help.

Examples:
  npm run asbab:import -- --input data/asbab/sample-asbab.json --local
  npm run asbab:import -- --input data/asbab/sample-asbab.json --remote
`;

const expandUserPath = (value) => {
	if (!value) return value;
	if (value === '~') return os.homedir();
	if (value.startsWith('~/')) return path.join(os.homedir(), value.slice(2));
	return value;
};

const resolvePath = (value) => path.resolve(process.cwd(), expandUserPath(value));

const parseArgs = (argv) => {
	const args = { _: [] };
	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];
		if (!token.startsWith('-')) {
			args._.push(token);
			continue;
		}

		const normalized = token.replace(/^--?/, '');
		if (normalized === 'h' || normalized === 'help') {
			args.help = true;
			continue;
		}
		if (normalized === 'remote' || normalized === 'local' || normalized === 'dry-run') {
			args[normalized] = true;
			continue;
		}

		const [rawKey, inlineValue] = normalized.split(/=(.*)/s, 2);
		const key = rawKey === 'i' ? 'input' : rawKey === 'db' ? 'database' : rawKey;
		const value = inlineValue ?? argv[index + 1];
		if (inlineValue === undefined) index += 1;
		args[key] = value;
	}

	if (!args.input && args._[0]) args.input = args._[0];
	return args;
};

const cleanText = (value, maxLength = 1000) => {
	const text = `${value ?? ''}`.trim();
	return text ? text.slice(0, maxLength) : '';
};

const cleanOptionalText = (value, maxLength = 1000) => cleanText(value, maxLength) || null;

const toInteger = (value) => {
	if (typeof value === 'number' && Number.isInteger(value)) return value;
	const parsed = Number(`${value ?? ''}`.trim());
	return Number.isInteger(parsed) ? parsed : null;
};

const normalizeStatus = (value) => {
	const status = `${value ?? ''}`.trim().toLowerCase();
	return ALLOWED_STATUSES.has(status) ? status : 'draft';
};

const validateEntry = (input, index) => {
	const errors = [];
	const sourceKey = cleanText(input.source_key, 120);
	const surahNumber = toInteger(input.surah_number);
	const ayahStart = toInteger(input.ayah_start);
	const ayahEnd = toInteger(input.ayah_end);
	const content = cleanText(input.content, 20_000);

	if (!sourceKey) errors.push('source_key wajib diisi');
	if (!surahNumber || surahNumber < 1 || surahNumber > 114) errors.push('surah_number wajib angka 1-114');
	if (!ayahStart || ayahStart < 1) errors.push('ayah_start wajib angka positif');
	if (!ayahEnd || ayahEnd < 1) errors.push('ayah_end wajib angka positif');
	if (ayahStart && ayahEnd && ayahEnd < ayahStart) errors.push('ayah_end tidak boleh lebih kecil dari ayah_start');
	if (!content) errors.push('content wajib diisi');

	if (errors.length || !surahNumber || !ayahStart || !ayahEnd) {
		return {
			ok: false,
			errors: errors.map((error) => `Baris ${index + 1}: ${error}`)
		};
	}

	return {
		ok: true,
		value: {
			source_key: sourceKey,
			surah_number: surahNumber,
			ayah_start: ayahStart,
			ayah_end: ayahEnd,
			title: cleanOptionalText(input.title, 240),
			content,
			riwayat: cleanOptionalText(input.riwayat, 20_000),
			takhrij: cleanOptionalText(input.takhrij, 20_000),
			grade: cleanOptionalText(input.grade, 120),
			page_ref: cleanOptionalText(input.page_ref, 120),
			status: normalizeStatus(input.status),
			verified_by: cleanOptionalText(input.verified_by, 160)
		}
	};
};

const sqlString = (value) => {
	if (value === null || value === undefined) return 'NULL';
	return `'${String(value).replace(/'/g, "''")}'`;
};

const sqlNumber = (value) => String(Number(value));

const entryToInsertSql = (entry) => {
	const sourceKey = sqlString(entry.source_key);
	const title = sqlString(entry.title);
	const content = sqlString(entry.content);

	return `INSERT INTO quran_asbab_entries (
  source_key,
  surah_number,
  ayah_start,
  ayah_end,
  title,
  content,
  riwayat,
  takhrij,
  grade,
  page_ref,
  status,
  verified_by,
  created_at,
  updated_at
)
SELECT
  ${sourceKey},
  ${sqlNumber(entry.surah_number)},
  ${sqlNumber(entry.ayah_start)},
  ${sqlNumber(entry.ayah_end)},
  ${title},
  ${content},
  ${sqlString(entry.riwayat)},
  ${sqlString(entry.takhrij)},
  ${sqlString(entry.grade)},
  ${sqlString(entry.page_ref)},
  ${sqlString(entry.status)},
  ${sqlString(entry.verified_by)},
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1 FROM quran_asbab_sources WHERE source_key = ${sourceKey}
)
AND NOT EXISTS (
  SELECT 1
  FROM quran_asbab_entries
  WHERE source_key = ${sourceKey}
    AND surah_number = ${sqlNumber(entry.surah_number)}
    AND ayah_start = ${sqlNumber(entry.ayah_start)}
    AND ayah_end = ${sqlNumber(entry.ayah_end)}
    AND COALESCE(title, '') = COALESCE(${title}, '')
    AND content = ${content}
);`;
};

const chunk = (items, size) => {
	const chunks = [];
	for (let index = 0; index < items.length; index += size) {
		chunks.push(items.slice(index, index + size));
	}
	return chunks;
};

const runCommand = (command, args) =>
	new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			stdio: 'inherit',
			shell: process.platform === 'win32'
		});
		child.on('error', reject);
		child.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
		});
	});

const main = async () => {
	const args = parseArgs(process.argv.slice(2));
	if (args.help) {
		console.log(usage);
		return;
	}
	if (!args.input) {
		console.error(usage);
		process.exitCode = 1;
		return;
	}

	const inputPath = resolvePath(args.input);
	const database = args.database ?? DEFAULT_DATABASE;
	const batchSize = Math.max(1, Number(args['batch-size'] ?? DEFAULT_BATCH_SIZE));
	const raw = await readFile(inputPath, 'utf8');
	const payload = JSON.parse(raw);
	const rows = Array.isArray(payload) ? payload : payload.entries;
	if (!Array.isArray(rows)) {
		throw new Error('JSON harus berupa array atau object dengan property entries array.');
	}

	const validEntries = [];
	const errors = [];
	for (const [index, row] of rows.entries()) {
		const result = validateEntry(row, index);
		if (result.ok) validEntries.push(result.value);
		else errors.push(...result.errors);
	}

	if (errors.length > 0) {
		console.error(errors.join('\n'));
		throw new Error(`${errors.length} error validasi. Import dibatalkan.`);
	}
	if (validEntries.length === 0) {
		throw new Error('Tidak ada entry valid untuk diimport.');
	}

	const batches = chunk(validEntries, batchSize);
	const sqlBatches = batches.map((batch) => `BEGIN TRANSACTION;\n${batch.map(entryToInsertSql).join('\n')}\nCOMMIT;\n`);

	if (args['dry-run']) {
		console.log(sqlBatches.join('\n'));
		return;
	}

	const tempDir = await mkdtemp(path.join(os.tmpdir(), 'santrionline-asbab-'));
	try {
		for (const [index, sql] of sqlBatches.entries()) {
			const batchFile = path.join(tempDir, `asbab-batch-${String(index + 1).padStart(3, '0')}.sql`);
			await writeFile(batchFile, sql, 'utf8');
			const wranglerArgs = ['wrangler', 'd1', 'execute', database, '--file', batchFile];
			wranglerArgs.push(args.remote ? '--remote' : '--local');
			console.log(`Import batch ${index + 1}/${sqlBatches.length} (${batches[index].length} entry)`);
			await runCommand('npx', wranglerArgs);
		}
	} finally {
		await rm(tempDir, { recursive: true, force: true });
	}

	console.log(`Selesai. ${validEntries.length} entry diproses. Entry dengan source_key yang belum ada akan dilewati oleh SQL.`);
};

main().catch((err) => {
	console.error(err?.message || err);
	process.exitCode = 1;
});

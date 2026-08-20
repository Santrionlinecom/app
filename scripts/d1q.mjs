#!/usr/bin/env node
// Penolong kecil: jalankan SQL baca-saja ke D1 dan cetak hasilnya rapi.
// Pemakaian: node scripts/d1q.mjs --remote "SELECT ..."
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const remote = args.includes('--remote');
const sql = args.filter((a) => a !== '--remote').join(' ');

if (!sql) {
	console.error('Perlu satu argumen SQL.');
	process.exit(1);
}

const cmd = ['wrangler', 'd1', 'execute', 'DB'];
if (remote) cmd.push('--remote');
else cmd.push('--local');
cmd.push('--command', sql, '--json');

const raw = execFileSync('npx', cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const start = raw.indexOf('[');
if (start === -1) {
	console.error(raw);
	process.exit(1);
}
const parsed = JSON.parse(raw.slice(start));
for (const block of parsed) {
	console.log(JSON.stringify(block.results ?? [], null, 1));
}

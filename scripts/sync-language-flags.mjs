import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const languagesFile = path.join(rootDir, 'src/lib/data/languages.ts');
const sourceFlagDir = path.join(rootDir, 'node_modules/country-flag-icons/3x2');
const outputFlagDir = path.join(rootDir, 'static/flags');

const REGIONAL_INDICATOR_A = 0x1f1e6;
const REGIONAL_INDICATOR_Z = 0x1f1ff;

const toCountryCodeFromEmoji = (emoji) => {
	const points = Array.from(emoji).map((char) => char.codePointAt(0) ?? 0);
	if (points.length !== 2) return null;
	if (
		points[0] < REGIONAL_INDICATOR_A ||
		points[0] > REGIONAL_INDICATOR_Z ||
		points[1] < REGIONAL_INDICATOR_A ||
		points[1] > REGIONAL_INDICATOR_Z
	) {
		return null;
	}

	const first = String.fromCharCode(points[0] - REGIONAL_INDICATOR_A + 65);
	const second = String.fromCharCode(points[1] - REGIONAL_INDICATOR_A + 65);
	return `${first}${second}`;
};

const parseFlagCountryCodes = (source) => {
	const emojiMatches = [...source.matchAll(/"emoji"\s*:\s*"([^"]+)"/g)];
	const codes = new Set();

	for (const match of emojiMatches) {
		const emoji = match[1] ?? '';
		const code = toCountryCodeFromEmoji(emoji);
		if (code) codes.add(code);
	}

	return [...codes].sort();
};

const ensureDir = async (dirPath) => {
	await fs.mkdir(dirPath, { recursive: true });
};

const clearOutput = async (dirPath) => {
	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true });
		await Promise.all(
			entries
				.filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
				.map((entry) => fs.unlink(path.join(dirPath, entry.name)))
		);
	} catch (err) {
		if ((err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') || false) {
			return;
		}
		throw err;
	}
};

const copyFlags = async (codes) => {
	const copied = [];
	const missing = [];

	for (const code of codes) {
		const source = path.join(sourceFlagDir, `${code}.svg`);
		const target = path.join(outputFlagDir, `${code.toLowerCase()}.svg`);

		try {
			await fs.copyFile(source, target);
			copied.push(code);
		} catch (err) {
			if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
				missing.push(code);
				continue;
			}
			throw err;
		}
	}

	return { copied, missing };
};

const writeManifest = async (codes, missing) => {
	const manifestPath = path.join(outputFlagDir, 'manifest.json');
	const payload = {
		generated_at: new Date().toISOString(),
		total_codes: codes.length,
		available_codes: codes.filter((code) => !missing.includes(code)),
		missing_codes: missing
	};
	await fs.writeFile(manifestPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
};

const run = async () => {
	const languageSource = await fs.readFile(languagesFile, 'utf8');
	const codes = parseFlagCountryCodes(languageSource);

	await ensureDir(outputFlagDir);
	await clearOutput(outputFlagDir);
	const { copied, missing } = await copyFlags(codes);
	await writeManifest(codes, missing);

	console.log(`Synced ${copied.length}/${codes.length} flag assets into static/flags.`);
	if (missing.length > 0) {
		console.log(`Missing codes: ${missing.join(', ')}`);
	}
};

run().catch((err) => {
	console.error('Failed to sync language flags:', err);
	process.exit(1);
});

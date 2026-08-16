/**
 * Loader Node agar file .svelte dapat di-import dalam test.
 * Mengkompilasi komponen ke mode SSR memakai compiler Svelte proyek ini.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compile } from 'svelte/compiler';

export async function load(url, context, nextLoad) {
	if (url.endsWith('.svelte')) {
		const source = await readFile(fileURLToPath(url), 'utf8');
		const { js } = compile(source, {
			filename: fileURLToPath(url),
			generate: 'server'
		});
		return { format: 'module', source: js.code, shortCircuit: true };
	}
	return nextLoad(url, context);
}

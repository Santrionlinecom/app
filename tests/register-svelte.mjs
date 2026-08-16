/**
 * Mendaftarkan loader .svelte ke module loader Node.
 * Dipakai lewat `node --import ./tests/register-svelte.mjs`.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./svelte-loader.mjs', pathToFileURL(import.meta.filename));

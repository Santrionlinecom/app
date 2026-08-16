// Verifikasi paket berbasis Svelte (layercake, svelte-sonner, mode-watcher).
// Node polos tidak bisa meng-import file .svelte, jadi kita kompilasi sungguhan
// memakai compiler Svelte yang dipakai proyek ini.
import { readFileSync, existsSync } from 'node:fs';
import { compile } from 'svelte/compiler';

const results = [];
const check = (name, fn) => {
  try {
    const detail = fn();
    results.push({ name, status: 'PASS', detail });
  } catch (e) {
    results.push({ name, status: 'FAIL', detail: e.message });
  }
};

const pkgEntry = (pkg, sub = '.') => {
  const meta = JSON.parse(readFileSync(`node_modules/${pkg}/package.json`, 'utf8'));
  const exp = meta.exports?.[sub];
  const resolved = typeof exp === 'string' ? exp : (exp?.svelte ?? exp?.default ?? exp?.import ?? meta.svelte ?? meta.module ?? meta.main);
  if (!resolved) throw new Error(`tidak ada entry untuk "${sub}" (exports: ${Object.keys(meta.exports ?? {}).slice(0, 5).join(', ')})`);
  return { version: meta.version, path: `node_modules/${pkg}/${resolved.replace(/^\.\//, '')}` };
};

// Kompilasi komponen .svelte sungguhan untuk membuktikan paket kompatibel dengan Svelte 5.
const compileComponent = (file) => {
  const source = readFileSync(file, 'utf8');
  const { js } = compile(source, { filename: file, generate: 'client' });
  if (!js?.code) throw new Error('compiler tidak menghasilkan kode');
  return js.code.length;
};

check('layercake', () => {
  const { version, path } = pkgEntry('layercake');
  if (!existsSync(path)) throw new Error(`entry hilang: ${path}`);
  const size = compileComponent('node_modules/layercake/dist/LayerCake.svelte');
  return `v${version} — LayerCake.svelte terkompilasi (${size} char JS)`;
});

check('svelte-sonner', () => {
  const { version, path } = pkgEntry('svelte-sonner');
  if (!existsSync(path)) throw new Error(`entry hilang: ${path}`);
  const size = compileComponent('node_modules/svelte-sonner/dist/Toaster.svelte');
  return `v${version} — Toaster.svelte terkompilasi (${size} char JS)`;
});

check('mode-watcher', () => {
  const meta = JSON.parse(readFileSync('node_modules/mode-watcher/package.json', 'utf8'));
  const sub = meta.exports?.['./ModeWatcher.svelte'] ? './ModeWatcher.svelte' : null;
  const entry = sub ? pkgEntry('mode-watcher', sub) : pkgEntry('mode-watcher', './index.js');
  if (!existsSync(entry.path)) throw new Error(`entry hilang: ${entry.path}`);
  const comp = 'node_modules/mode-watcher/dist/mode-watcher.svelte';
  const size = existsSync(comp) ? compileComponent(comp) : 0;
  return `v${meta.version} — entry ok${size ? `, komponen terkompilasi (${size} char JS)` : ''}`;
});

const pass = results.filter((r) => r.status === 'PASS').length;
for (const r of results) console.log(`${r.status === 'PASS' ? '✓' : '✗'} ${r.name.padEnd(16)} ${r.detail}`);
console.log(`\n${pass}/${results.length} paket Svelte terverifikasi terkompilasi`);
if (pass !== results.length) process.exitCode = 1;

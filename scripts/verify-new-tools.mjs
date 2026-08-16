// Smoke test: memastikan setiap tool baru benar-benar dapat di-import dan berfungsi.
const results = [];
const ok = (name, detail) => results.push({ name, status: 'PASS', detail });
const fail = (name, detail) => results.push({ name, status: 'FAIL', detail });

// 1. motion — animasi ringan berbasis Web Animations API
try {
  const m = await import('motion');
  const fns = ['animate', 'inView', 'scroll', 'stagger', 'spring'].filter((f) => typeof m[f] === 'function');
  if (fns.length >= 4) ok('motion', `expor fungsi: ${fns.join(', ')}`);
  else fail('motion', `hanya menemukan: ${fns.join(', ') || 'tidak ada'}`);
} catch (e) { fail('motion', e.message); }

// 2. @formkit/auto-animate — animasi otomatis untuk list/grid
try {
  const a = await import('@formkit/auto-animate');
  if (typeof a.default === 'function' || typeof a.autoAnimate === 'function') ok('@formkit/auto-animate', 'fungsi autoAnimate tersedia');
  else fail('@formkit/auto-animate', 'tidak menemukan fungsi autoAnimate');
} catch (e) { fail('@formkit/auto-animate', e.message); }

// 3. layercake — kerangka chart komposabel untuk Svelte
try {
  const l = await import('layercake');
  if (l.LayerCake && l.Svg && l.Html) ok('layercake', 'komponen LayerCake, Svg, Html tersedia');
  else fail('layercake', `expor: ${Object.keys(l).slice(0, 6).join(', ')}`);
} catch (e) { fail('layercake', e.message); }

// 4. d3-scale — skala chart, diuji dengan perhitungan nyata
try {
  const { scaleLinear, scaleBand } = await import('d3-scale');
  const s = scaleLinear().domain([0, 100]).range([0, 300]);
  const b = scaleBand().domain(['a', 'b', 'c']).range([0, 300]).padding(0.2);
  if (s(50) === 150 && b.bandwidth() > 0) ok('d3-scale', `scaleLinear(50)=${s(50)}, bandwidth=${b.bandwidth().toFixed(1)}`);
  else fail('d3-scale', `hasil tak terduga: ${s(50)}`);
} catch (e) { fail('d3-scale', e.message); }

// 5. d3-shape — generator garis/area/arc untuk grafik
try {
  const { line, area, arc, curveMonotoneX } = await import('d3-shape');
  const path = line().x((d, i) => i * 10).y((d) => d).curve(curveMonotoneX)([0, 20, 10]);
  if (typeof path === 'string' && path.startsWith('M') && typeof area === 'function' && typeof arc === 'function')
    ok('d3-shape', `path SVG dihasilkan (${path.length} char)`);
  else fail('d3-shape', 'gagal menghasilkan path');
} catch (e) { fail('d3-shape', e.message); }

// 6. d3-array — agregasi data untuk penalaran dashboard
try {
  const { max, mean, rollup, sum } = await import('d3-array');
  const data = [3, 1, 4, 1, 5];
  if (max(data) === 5 && sum(data) === 14 && mean(data) === 2.8 && typeof rollup === 'function')
    ok('d3-array', `max=5, sum=14, mean=2.8, rollup tersedia`);
  else fail('d3-array', `hasil tak terduga max=${max(data)} sum=${sum(data)}`);
} catch (e) { fail('d3-array', e.message); }

// 7. svelte-sonner — notifikasi toast
try {
  const s = await import('svelte-sonner');
  if (s.Toaster && s.toast) ok('svelte-sonner', 'komponen Toaster + api toast tersedia');
  else fail('svelte-sonner', `expor: ${Object.keys(s).join(', ')}`);
} catch (e) { fail('svelte-sonner', e.message); }

// 8. mode-watcher — dukungan mode terang/gelap
try {
  const m = await import('mode-watcher');
  if (m.ModeWatcher && (m.toggleMode || m.setMode)) ok('mode-watcher', 'ModeWatcher + kontrol mode tersedia');
  else fail('mode-watcher', `expor: ${Object.keys(m).slice(0, 8).join(', ')}`);
} catch (e) { fail('mode-watcher', e.message); }

const pass = results.filter((r) => r.status === 'PASS').length;
for (const r of results) console.log(`${r.status === 'PASS' ? '✓' : '✗'} ${r.name.padEnd(24)} ${r.detail}`);
console.log(`\n${pass}/${results.length} tool terverifikasi berfungsi`);
if (pass !== results.length) process.exitCode = 1;

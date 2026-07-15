import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const editorSource = readFileSync(
	new URL('../src/lib/components/RichTextEditor.svelte', import.meta.url),
	'utf8'
);
const newPostSource = readFileSync(
	new URL('../src/routes/(cms)/admin/posts/new/+page.svelte', import.meta.url),
	'utf8'
);

test('toolbar editor mobile memakai kontrol klasik yang tidak terpotong', () => {
	assert.match(editorSource, /data-editor-toolbar/);
	assert.match(editorSource, /grid-cols-6/);
	assert.match(editorSource, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
	assert.match(editorSource, /h-11/);
	assert.match(editorSource, /@lucide\/svelte\/icons\/bold/);
	assert.doesNotMatch(editorSource, /btn btn-sm btn-ghost/);
});

test('tab Visual dan Teks ditempatkan sebelum toolbar seperti WordPress Classic', () => {
	const tabs = editorSource.indexOf('data-editor-mode-tabs');
	const toolbar = editorSource.indexOf('data-editor-toolbar');
	assert.ok(tabs >= 0, 'mode tabs harus tersedia');
	assert.ok(toolbar >= 0, 'toolbar harus tersedia');
	assert.ok(tabs < toolbar, 'mode tabs harus tampil di atas toolbar');
	assert.match(editorSource, />Teks<\/button>/);
});

test('halaman post baru tidak membungkus editor dengan bingkai kedua', () => {
	assert.doesNotMatch(
		newPostSource,
		/<div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">\s*<RichTextEditor/
	);
});

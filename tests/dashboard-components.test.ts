/**
 * Uji render komponen dashboard baru.
 *
 * Merender komponen sungguhan lewat SSR Svelte lalu memeriksa HTML yang
 * dihasilkan. Ini membuktikan komponen benar-benar menghasilkan sumbu, batang,
 * skala, dan teks — bukan sekadar "berhasil di-build".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from 'svelte/server';
import BarChart from '../src/lib/components/charts/BarChart.svelte';
import StatCard from '../src/lib/components/dashboard/StatCard.svelte';

const sample = [
	{ label: 'Sen', value: 12, display: '12', color: '#10b981' },
	{ label: 'Sel', value: 30, display: '30', color: '#10b981' },
	{ label: 'Rab', value: 7, display: '7', color: '#f59e0b' }
];

test('BarChart merender SVG dengan satu batang per data', () => {
	const { body } = render(BarChart, { props: { data: sample, valueLabel: 'Setoran' } });
	assert.match(body, /<svg/, 'harus merender elemen SVG');
	const bars = body.match(/class="bar\s/g) ?? [];
	assert.equal(bars.length, sample.length, `harus ada ${sample.length} batang`);
});

test('BarChart menampilkan sumbu dan garis bantu yang sebelumnya tidak ada', () => {
	const { body } = render(BarChart, { props: { data: sample } });
	assert.match(body, /class="gridline/, 'harus punya garis bantu');
	assert.match(body, /class="axis-line/, 'harus punya garis sumbu');
	assert.match(body, /class="tick-label/, 'harus punya label skala sumbu Y');
});

test('BarChart memakai warna per data', () => {
	const { body } = render(BarChart, { props: { data: sample } });
	assert.match(body, /#10b981/, 'warna hijau harus dipakai');
	assert.match(body, /#f59e0b/, 'warna kuning harus dipakai');
});

test('BarChart menyediakan tabel setara untuk pembaca layar', () => {
	const { body } = render(BarChart, { props: { data: sample } });
	assert.match(body, /<table>/, 'harus ada tabel alternatif');
	for (const row of sample) {
		assert.ok(body.includes(row.label), `label ${row.label} harus ada di tabel`);
	}
});

test('BarChart tidak merender apa pun saat data kosong', () => {
	const { body } = render(BarChart, { props: { data: [] } });
	assert.doesNotMatch(body, /<svg/, 'tidak boleh merender SVG kosong');
});

test('BarChart aman terhadap nilai nol tanpa membagi nol', () => {
	const zeros = [
		{ label: 'A', value: 0, display: '0' },
		{ label: 'B', value: 0, display: '0' }
	];
	const { body } = render(BarChart, { props: { data: zeros } });
	assert.match(body, /<svg/, 'tetap merender walau semua nilai nol');
	assert.doesNotMatch(body, /NaN/, 'tidak boleh menghasilkan NaN');
});

test('StatCard merender label, nilai, dan tautan', () => {
	const { body } = render(StatCard, {
		props: {
			label: 'Total Santri',
			display: '128',
			value: 128,
			desc: 'Aktif bulan ini',
			href: '/dashboard/kelola-santri',
			source: 'TPQ'
		}
	});
	assert.ok(body.includes('Total Santri'), 'label harus tampil');
	assert.ok(body.includes('128'), 'nilai harus tampil di HTML awal');
	assert.match(body, /href="\/dashboard\/kelola-santri"/, 'tautan harus benar');
	assert.ok(body.includes('Aktif bulan ini'), 'deskripsi harus tampil');
});

test('StatCard menampilkan nilai non-numerik apa adanya', () => {
	const { body } = render(StatCard, {
		props: { label: 'Saldo Kas', display: 'Rp1.250.000', value: null, href: '/keuangan' }
	});
	assert.ok(body.includes('Rp1.250.000'), 'teks mata uang harus utuh');
});

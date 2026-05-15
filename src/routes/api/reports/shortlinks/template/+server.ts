import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as XLSX from 'xlsx';
import { SHORTLINK_CATEGORIES } from '$lib/constants/shortlink-categories';
import { requireAdmin } from '$lib/server/shortlink';

const header = ['slug', 'title', 'target_url', 'category', 'description', 'notes', 'is_active'];
const sample = [
	'contoh-kajian',
	'Kajian Jumat',
	'https://example.com/kajian',
	'campaign_dakwah',
	'Landing page kajian',
	'catatan internal',
	'1'
];

const escapeCsvCell = (value: unknown) => {
	const text = `${value ?? ''}`;
	return `"${text.replace(/"/g, '""')}"`;
};

const toCsv = (rows: unknown[][]) => `\ufeff${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}`;

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);

	const format = `${event.url.searchParams.get('format') ?? 'xlsx'}`.toLowerCase();
	if (format !== 'xlsx' && format !== 'csv') {
		throw error(400, 'Format template tidak valid.');
	}

	const filename = `template-shortlink.${format}`;
	const rows = [header, sample];

	if (format === 'csv') {
		return new Response(toCsv(rows), {
			headers: {
				'Content-Type': 'text/csv;charset=utf-8',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	}

	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Import');
	XLSX.utils.book_append_sheet(
		workbook,
		XLSX.utils.aoa_to_sheet([
			['category', 'label'],
			...SHORTLINK_CATEGORIES.map((category) => [category.key, category.label])
		]),
		'Kategori'
	);
	const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

	return new Response(output, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};

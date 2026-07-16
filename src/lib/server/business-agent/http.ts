import { json } from '@sveltejs/kit';

const notFoundMessages = new Set([
	'Lead bisnis tidak ditemukan',
	'Quote bisnis tidak ditemukan',
	'Approval bisnis tidak ditemukan'
]);

const conflictMessages = new Set([
	'Status lead berubah oleh proses lain',
	'Lead tidak lagi siap dibuatkan quote',
	'Quote tidak dapat diajukan untuk approval',
	'Approval bisnis sudah diproses',
	'Approval bisnis sudah kedaluwarsa',
	'Payload quote berubah; approval lama dibatalkan',
	'Approval gagal karena status berubah atau maker-checker ditolak',
	'Order bisnis gagal dibuat setelah approval'
]);

const badRequestMessages = new Set([
	'Transisi status bisnis tidak diizinkan',
	'Quote sudah kedaluwarsa'
]);

export const businessApiError = (error: unknown, context: string) => {
	const message = error instanceof Error ? error.message : '';
	if (notFoundMessages.has(message)) return json({ ok: false, message }, { status: 404 });
	if (conflictMessages.has(message)) return json({ ok: false, message }, { status: 409 });
	if (badRequestMessages.has(message)) return json({ ok: false, message }, { status: 400 });
	if (message.startsWith('Business policy ditolak:')) {
		return json({ ok: false, message: 'Tindakan ditolak oleh kebijakan keamanan' }, { status: 403 });
	}
	console.error('business_agent_api_failed', {
		context,
		error_type: error instanceof Error ? error.name : 'unknown'
	});
	return json({ ok: false, message: 'Permintaan tidak dapat diproses' }, { status: 500 });
};

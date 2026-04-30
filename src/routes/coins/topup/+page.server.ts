import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { generateId } from 'lucia';

const normalizeOptionalUrl = (value: string) => {
	if (!value) return null;
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
	} catch (_) {
		return null;
	}
};

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	return {
		user: locals.user
	};
};

export const actions: Actions = {
	default: async ({ request, locals, platform }) => {
		if (!locals.user) {
			throw redirect(302, '/auth');
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) {
			return fail(500, { message: 'Database tidak tersedia' });
		}

		const formData = await request.formData();
		const amountRupiah = formData.get('amount_rupiah');
		const coinAmount = formData.get('coin_amount');
		const userNote = formData.get('user_note');
		const proofUrlValue = formData.get('proof_url');

		// Validasi amount_rupiah
		if (!amountRupiah || typeof amountRupiah !== 'string') {
			return fail(400, { message: 'Jumlah Rupiah wajib diisi' });
		}
		const parsedRupiah = parseInt(amountRupiah, 10);
		if (isNaN(parsedRupiah) || parsedRupiah <= 0) {
			return fail(400, { message: 'Jumlah Rupiah harus angka positif' });
		}

		// Validasi coin_amount
		if (!coinAmount || typeof coinAmount !== 'string') {
			return fail(400, { message: 'Jumlah koin wajib diisi' });
		}
		const parsedCoin = parseInt(coinAmount, 10);
		if (isNaN(parsedCoin) || parsedCoin <= 0) {
			return fail(400, { message: 'Jumlah koin harus angka positif' });
		}

		// Minimal 100 koin
		if (parsedCoin < 100) {
			return fail(400, { message: 'Minimal topup adalah 100 koin' });
		}

		const rawProofUrl = typeof proofUrlValue === 'string' ? proofUrlValue.trim() : '';
		const proofUrl = normalizeOptionalUrl(rawProofUrl);
		if (rawProofUrl && !proofUrl) {
			return fail(400, { message: 'URL bukti topup tidak valid' });
		}

		// Buat request topup
		const id = generateId(15);
		const now = new Date().toISOString();
		const note = typeof userNote === 'string' ? userNote.trim() : null;

		try {
			await db
				.prepare(
					`INSERT INTO coin_topup_requests 
					(id, user_id, amount_rupiah, coin_amount, proof_url, user_note, status, created_at, updated_at)
					VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
				)
				.bind(id, locals.user.id, parsedRupiah, parsedCoin, proofUrl, note, now, now)
				.run();
		} catch (err) {
			console.error('Gagal membuat topup request:', err);
			return fail(500, { message: 'Gagal membuat request topup' });
		}

		throw redirect(303, '/coins?success=topup-created');
	}
};

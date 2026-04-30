import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { generateId } from 'lucia';
import { getCoinTopupPackageById, getCoinTopupPackages } from '$lib/server/coin-packages';

const normalizeOptionalUrl = (value: string) => {
	if (!value) return null;
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
	} catch (_) {
		return null;
	}
};

const INVALID_PACKAGE_MESSAGE =
	'Paket topup tidak valid. Silakan pilih paket yang tersedia.';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	return {
		user: locals.user,
		packages: getCoinTopupPackages()
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
		const packageId = formData.get('package_id');
		const userNote = formData.get('user_note');
		const proofUrlValue = formData.get('proof_url');

		if (typeof packageId !== 'string') {
			return fail(400, { message: INVALID_PACKAGE_MESSAGE });
		}
		const selectedPackage = getCoinTopupPackageById(packageId);
		if (!selectedPackage) {
			return fail(400, { message: INVALID_PACKAGE_MESSAGE });
		}

		const rawProofUrl = typeof proofUrlValue === 'string' ? proofUrlValue.trim() : '';
		const proofUrl = normalizeOptionalUrl(rawProofUrl);
		if (rawProofUrl && !proofUrl) {
			return fail(400, { message: 'URL bukti topup tidak valid' });
		}

		const rawNote = typeof userNote === 'string' ? userNote.trim() : '';
		if (rawNote.length > 500) {
			return fail(400, { message: 'Catatan pembayaran maksimal 500 karakter' });
		}
		const note = rawNote
			? `[PAKET: ${selectedPackage.name}] ${rawNote}`
			: `[PAKET: ${selectedPackage.name}]`;

		// Buat request topup
		const id = generateId(15);
		const now = new Date().toISOString();

		try {
			await db
				.prepare(
					`INSERT INTO coin_topup_requests 
					(id, user_id, amount_rupiah, coin_amount, proof_url, user_note, status, created_at, updated_at)
					VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
				)
				.bind(
					id,
					locals.user.id,
					selectedPackage.amountRupiah,
					selectedPackage.coinAmount,
					proofUrl,
					note,
					now,
					now
				)
				.run();
		} catch (err) {
			console.error('Gagal membuat topup request:', err);
			return fail(500, { message: 'Gagal membuat request topup' });
		}

		throw redirect(303, '/coins?success=topup-created');
	}
};

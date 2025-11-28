import { json, error } from '@sveltejs/kit';
import { submitSurahForUser } from '$lib/server/progress';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	if (!locals.db) {
		throw error(500, 'DB not available');
	}
	// Hanya admin atau ustadz yang boleh assign setoran
	if (locals.user.role !== 'admin' && locals.user.role !== 'ustadz') {
		throw error(403, 'Forbidden');
	}

	const body = await request.json().catch(() => ({}));
	const { userId, surahNumber, status, qualityStatus, startAyah, endAyah } = body as {
		userId?: string;
		surahNumber?: number;
		status?: 'belum' | 'setor' | 'disetujui';
		qualityStatus?: 'merah' | 'kuning' | 'hijau';
		startAyah?: number;
		endAyah?: number;
	};

	if (!userId || typeof surahNumber !== 'number') {
		throw error(400, 'userId dan surahNumber wajib diisi');
	}

	try {
		await submitSurahForUser(locals.db, {
			userId,
			surahNumber,
			status: status ?? 'setor',
			qualityStatus,
			startAyah,
			endAyah
		});

		return json({ ok: true });
	} catch (err: any) {
		console.error('assign setoran error', err);
		return json({ error: err?.message ?? 'Gagal assign setoran' }, { status: 500 });
	}
};

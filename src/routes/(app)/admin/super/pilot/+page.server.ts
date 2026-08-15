import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import {
	addPilotParticipant,
	getPilotMonitor,
	listPilotParticipants,
	removePilotParticipant,
	setPilotParticipantActive
} from '$lib/server/habit/pilot';
import { isValidLocalDate } from '$lib/server/habit/dates';

export const load: PageServerLoad = async ({ locals }) => {
	const { db } = requireSuperAdmin(locals);
	const participants = await listPilotParticipants(db);
	const monitors = await Promise.all(
		participants.map(async (participant) => ({
			participant,
			monitor: await getPilotMonitor(db, participant)
		}))
	);
	return {
		hideChrome: true,
		pilotParticipants: monitors
	};
};

const normalizeText = (value: FormDataEntryValue | null) => (typeof value === 'string' ? value.trim() : '');

export const actions: Actions = {
	addParticipant: async ({ request, locals }) => {
		const { db } = requireSuperAdmin(locals);
		const form = await request.formData();
		const userEmail = normalizeText(form.get('userEmail'));
		const guardianEmail = normalizeText(form.get('guardianEmail'));
		const label = normalizeText(form.get('label'));
		const startDate = normalizeText(form.get('startDate'));
		const endDate = normalizeText(form.get('endDate'));
		const notes = normalizeText(form.get('notes'));

		if (!userEmail) return fail(400, { error: 'Email santri wajib diisi.' });
		if (!startDate || !endDate) return fail(400, { error: 'Tanggal mulai dan selesai wajib diisi.' });
		if (!isValidLocalDate(startDate) || !isValidLocalDate(endDate)) {
			return fail(400, { error: 'Format tanggal salah (YYYY-MM-DD).' });
		}

		try {
			await addPilotParticipant(db, {
				userEmail,
				label: label || null,
				guardianEmail: guardianEmail || null,
				startDate,
				endDate,
				notes: notes || null
			});
		} catch (err) {
			const message = `${(err as Error)?.message ?? err}`;
			if (message.includes('UNIQUE')) {
				return fail(409, { error: 'Santri ini sudah terdaftar sebagai peserta pilot.' });
			}
			if (message.includes('tidak ditemukan')) {
				return fail(404, { error: message });
			}
			if (message.includes('Tabel habit belum siap') || message.toLowerCase().includes('no such table')) {
				return fail(503, { error: 'Tabel habit belum siap. Jalankan migrasi 0060_pilot_participants terlebih dahulu.' });
			}
			return fail(500, { error: `Gagal menambahkan peserta: ${message}` });
		}

		throw redirect(303, '/admin/super/pilot');
	},
	removeParticipant: async ({ request, locals }) => {
		const { db } = requireSuperAdmin(locals);
		const form = await request.formData();
		const id = normalizeText(form.get('id'));
		if (!id) return fail(400, { error: 'Peserta tidak ditemukan.' });
		try {
			await removePilotParticipant(db, id);
		} catch (err) {
			return fail(404, { error: `${(err as Error)?.message ?? 'Gagal menghapus peserta.'}` });
		}
		throw redirect(303, '/admin/super/pilot');
	},
	toggleActive: async ({ request, locals }) => {
		const { db } = requireSuperAdmin(locals);
		const form = await request.formData();
		const id = normalizeText(form.get('id'));
		const active = normalizeText(form.get('active')) === '1';
		if (!id) return fail(400, { error: 'Peserta tidak ditemukan.' });
		try {
			await setPilotParticipantActive(db, id, active);
		} catch (err) {
			return fail(404, { error: `${(err as Error)?.message ?? 'Gagal mengubah status peserta.'}` });
		}
		throw redirect(303, '/admin/super/pilot');
	}
};

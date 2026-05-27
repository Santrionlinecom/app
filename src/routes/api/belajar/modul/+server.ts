import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getLearnSummary,
	listLearnModules,
	requireSantriLearnContext
} from '$lib/server/santri-learn';

const progressPercent = (soalSelesai: number, totalSoal: number) =>
	totalSoal > 0 ? Math.min(100, Math.round((soalSelesai / totalSoal) * 100)) : 0;

export const GET: RequestHandler = async ({ locals, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });

	if (!locals.user) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	const { db, user, lembagaId } = await requireSantriLearnContext(locals);
	const [modules, summary] = await Promise.all([
		listLearnModules(db, lembagaId, user.id),
		getLearnSummary(db, user.id)
	]);

	return json({
		ok: true,
		summary: {
			xp_sekarang: summary.totalXp,
			xp_target: Math.max(100, (Math.floor(summary.totalXp / 100) + 1) * 100),
			streak_hari: summary.streakHari
		},
		modules: modules.map((module) => ({
			id: module.id,
			judul: module.judul,
			deskripsi: module.deskripsi,
			kategori: module.kategori,
			urutan: module.urutan,
			total_soal: module.totalSoal,
			soal_selesai: module.soalSelesai,
			progress_persen: progressPercent(module.soalSelesai, module.totalSoal),
			status: module.status,
			xp: module.xp,
			locked: module.locked,
			terkunci: module.locked
		}))
	});
};

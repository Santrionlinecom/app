import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	listLearnModules,
	listLearnQuestions,
	requireSantriLearnContext
} from '$lib/server/santri-learn';

const shuffle = <T>(items: T[]) =>
	[...items].sort(() => {
		const bytes = new Uint8Array(1);
		crypto.getRandomValues(bytes);
		return (bytes[0] ?? 0) / 255 - 0.5;
	});

export const GET: RequestHandler = async ({ locals, params, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });

	if (!locals.user) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	const { db, user, lembagaId } = await requireSantriLearnContext(locals);
	const modules = await listLearnModules(db, lembagaId, user.id);
	const module = modules.find((item) => item.id === params.id);

	if (!module) {
		return json({ ok: false, error: 'Modul tidak ditemukan.' }, { status: 404 });
	}
	if (module.locked) {
		return json({ ok: false, error: 'Modul belajar masih terkunci.' }, { status: 403 });
	}

	const questions = shuffle(await listLearnQuestions(db, params.id));

	return json({
		ok: true,
		module: {
			id: module.id,
			judul: module.judul,
			deskripsi: module.deskripsi,
			kategori: module.kategori
		},
		soal: questions.map((question) => ({
			id: question.id,
			modul_id: question.modulId,
			tipe: question.tipe,
			pertanyaan: question.pertanyaan,
			pilihan_a: question.pilihanA ?? question.options[0] ?? '',
			pilihan_b: question.pilihanB ?? question.options[1] ?? '',
			pilihan_c: question.pilihanC ?? question.options[2] ?? '',
			pilihan_d: question.pilihanD ?? question.options[3] ?? '',
			urutan: question.urutan
		}))
	});
};

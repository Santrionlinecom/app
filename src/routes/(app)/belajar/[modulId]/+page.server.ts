import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	answerLearnQuestion,
	getLearnModule,
	getLearnSummary,
	listLearnModules,
	listLearnQuestions,
	requireSantriLearnContext
} from '$lib/server/santri-learn';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { db, user, lembagaId } = await requireSantriLearnContext(locals);

	const [modules, module, questions, summary] = await Promise.all([
		listLearnModules(db, lembagaId, user.id),
		getLearnModule(db, lembagaId, params.modulId, user.id),
		listLearnQuestions(db, params.modulId),
		getLearnSummary(db, user.id)
	]);

	if (!module) {
		throw error(404, 'Modul belajar tidak ditemukan');
	}

	const currentIndex = modules.findIndex((item) => item.id === module.id);
	if (currentIndex === -1) {
		throw error(404, 'Modul belajar tidak ditemukan');
	}
	if (modules[currentIndex]?.locked) {
		throw redirect(302, '/belajar');
	}

	const nextModule = modules[currentIndex + 1] ?? null;
	const publicQuestions = questions.map(({ jawabanBenar: _jawabanBenar, ...question }) => question);

	return {
		module: modules[currentIndex],
		questions: publicQuestions,
		summary,
		nextModule: nextModule ? { id: nextModule.id, judul: nextModule.judul } : null
	};
};

export const actions: Actions = {
	jawab: async ({ locals, request }) => {
		try {
			const { db, user, lembagaId } = await requireSantriLearnContext(locals);

			const formData = await request.formData();
			const soalId = formData.get('soal_id');
			const jawaban = formData.get('jawaban');

			if (typeof soalId !== 'string' || !soalId.trim()) {
				return fail(400, { message: 'Soal tidak valid.' });
			}
			if (typeof jawaban !== 'string' || !jawaban.trim()) {
				return fail(400, { message: 'Jawaban wajib diisi.' });
			}

			return await answerLearnQuestion(db, {
				userId: user.id,
				lembagaId,
				soalId: soalId.trim(),
				jawaban: jawaban.trim()
			});
		} catch (err) {
			if (
				typeof err === 'object' &&
				err &&
				'status' in err &&
				((err as { status?: number }).status === 302 || (err as { status?: number }).status === 303)
			) {
				throw err;
			}
			console.error('santri_learn_answer_failed', err);
			return fail(500, { message: 'Gagal menyimpan jawaban.' });
		}
	}
};

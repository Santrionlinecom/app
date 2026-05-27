import type { PageServerLoad } from './$types';
import {
	getLearnSummary,
	listLearnBadges,
	listLearnModules,
	requireSantriLearnContext
} from '$lib/server/santri-learn';

export const load: PageServerLoad = async ({ locals }) => {
	const { db, user, lembagaId } = await requireSantriLearnContext(locals);

	const [modules, summary, badges] = await Promise.all([
		listLearnModules(db, lembagaId, user.id),
		getLearnSummary(db, user.id),
		listLearnBadges(db, user.id, lembagaId)
	]);

	return {
		modules,
		summary,
		badges
	};
};

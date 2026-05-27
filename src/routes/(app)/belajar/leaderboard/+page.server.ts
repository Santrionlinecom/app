import type { PageServerLoad } from './$types';
import {
	ensureSantriLearnSchema,
	getLearnLeaderboard,
	getLearnSummary,
	requireSantriLearnContext
} from '$lib/server/santri-learn';

export const load: PageServerLoad = async ({ locals }) => {
	const { db, user, lembagaId } = await requireSantriLearnContext(locals);
	await ensureSantriLearnSchema(db);

	const [leaderboard, summary] = await Promise.all([
		getLearnLeaderboard(db, lembagaId, user.id),
		getLearnSummary(db, user.id)
	]);

	return {
		leaderboard,
		summary,
		currentUserId: user.id
	};
};

import { getTurnstileSiteKey } from '$lib/server/turnstile';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		turnstileSiteKey: getTurnstileSiteKey()
	};
};

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	// Redirect legacy/short URL to the dashboard route
	throw redirect(302, '/dashboard/hafalan-mandiri');
};

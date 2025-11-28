import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeLucia } from '$lib/server/lucia';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	const db = locals.db;
	const lucia = initializeLucia(db);

	if (locals.session) {
		await lucia.invalidateSession(locals.session.id);
	}

	const blank = lucia.createBlankSessionCookie();
	cookies.set(blank.name, blank.value, {
		path: '/',
		...blank.attributes
	});

	throw redirect(302, '/');
};

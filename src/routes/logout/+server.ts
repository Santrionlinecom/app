import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeLucia } from '$lib/server/lucia';

const clearSessionCookie = (cookies: Parameters<RequestHandler>[0]['cookies']) => {
	// fallback cookie clear even when DB binding is unavailable
	const blank = {
		name: 'auth_session',
		value: '',
		attributes: {
			httpOnly: true,
			secure: true,
			sameSite: 'lax' as const,
			maxAge: 0
		}
	};
	cookies.set(blank.name, blank.value, {
		path: '/',
		...blank.attributes
	});
};

const doLogout: RequestHandler = async ({ locals, cookies }) => {
	if (locals.db && locals.session) {
		const lucia = initializeLucia(locals.db);
		await lucia.invalidateSession(locals.session.id);
		const blank = lucia.createBlankSessionCookie();
		cookies.set(blank.name, blank.value, {
			path: '/',
			...blank.attributes
		});
	} else {
		clearSessionCookie(cookies);
	}

	throw redirect(302, '/');
};

export const POST: RequestHandler = doLogout;
export const GET: RequestHandler = doLogout;

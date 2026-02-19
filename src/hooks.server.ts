// src/hooks.server.ts
import { initializeLucia } from '$lib/server/lucia';
import type { Handle } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';

const TPQ_ONLY_BLOCKED_PREFIXES = ['/pondok', '/masjid', '/musholla', '/rumah-tahfidz', '/keuangan', '/org'];

const isTpqOnlyBlockedRoute = (pathname: string) =>
	TPQ_ONLY_BLOCKED_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	);

export const handle: Handle = async ({ event, resolve }) => {
	if (isTpqOnlyBlockedRoute(event.url.pathname)) {
		return Response.redirect(new URL('/tpq', event.url), 302);
	}
	
	const db = event.platform?.env.DB;

	// simpan koneksi DB di locals untuk dipakai semua endpoint
	event.locals.db = db as D1Database;

	if (!db) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const lucia = initializeLucia(db);

	const sessionId = event.cookies.get(lucia.sessionCookieName);
	
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);

	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}

	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};

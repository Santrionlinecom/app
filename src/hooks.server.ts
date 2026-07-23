// src/hooks.server.ts
import { handleErrorWithSentry, initCloudflareSentryHandle, sentryHandle } from '@sentry/sveltekit';
import { initializeLucia } from '$lib/server/lucia';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import type { D1Database } from '@cloudflare/workers-types';
import { isSuperAdminUser } from '$lib/auth/session-user';
import { hasPermission } from '$lib/rbac/permissions';
import {
	applySuperAdminImpersonation,
	clearImpersonatedOrgId,
	getImpersonatedOrgId
} from '$lib/server/auth/impersonation';
import { sentryServerConfig } from '../sentry.server.config';
import type { OrgRole, OrgType, Permission } from '$lib/types/rbac';

const SECURITY_HEADERS: Record<string, string> = {
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'SAMEORIGIN',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self)',
	'Content-Security-Policy-Report-Only': [
		"default-src 'self'",
		"base-uri 'self'",
		"object-src 'none'",
		"frame-ancestors 'self'",
		"img-src 'self' data: blob: https:",
		"media-src 'self' blob: https:",
		"font-src 'self' data: https:",
		"style-src 'self' 'unsafe-inline' https:",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
		"connect-src 'self' https: wss:",
		"frame-src 'self' https:"
	].join('; ')
};

const securityHeadersHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		if (!response.headers.has(name)) response.headers.set(name, value);
	}
	return response;
};

const authHandle: Handle = async ({ event, resolve }) => {
	const db = event.platform?.env.DB;

	// simpan koneksi DB di locals untuk dipakai semua endpoint
	event.locals.db = db as D1Database;

	if (!db) {
		event.locals.user = null;
		event.locals.session = null;
		event.locals.isSuperAdmin = false;
		event.locals.orgType = null;
		event.locals.can = () => false;
		return resolve(event);
	}

	const lucia = initializeLucia(db);

	const sessionId = event.cookies.get(lucia.sessionCookieName);
	
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		event.locals.isSuperAdmin = false;
		event.locals.orgType = null;
		event.locals.can = () => false;
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);
	let resolvedUser = user;
	const impersonatedOrgId = getImpersonatedOrgId(event.cookies);

	if (resolvedUser && impersonatedOrgId && isSuperAdminUser(resolvedUser)) {
		resolvedUser = applySuperAdminImpersonation(resolvedUser, impersonatedOrgId);
	} else if (impersonatedOrgId && (!resolvedUser || !isSuperAdminUser(resolvedUser))) {
		clearImpersonatedOrgId(event.cookies);
	}

	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});
	}

	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});
	}

	event.locals.user = resolvedUser;
	event.locals.session = session;
	event.locals.isSuperAdmin = isSuperAdminUser(resolvedUser);
	event.locals.orgType = null;

	if (resolvedUser?.orgId) {
		const org = await db
			.prepare('SELECT type FROM organizations WHERE id = ?')
			.bind(resolvedUser.orgId)
			.first<{ type: OrgType }>();
		event.locals.orgType = org?.type ?? null;
	}

	event.locals.can = (permission: Permission) => {
		if (event.locals.isSuperAdmin) return true;
		const role = event.locals.user?.role as OrgRole | undefined;
		return Boolean(role && hasPermission(role, permission));
	};

	return resolve(event);
};

export const handleError = handleErrorWithSentry();

export const handle: Handle = sequence(
	initCloudflareSentryHandle(sentryServerConfig),
	sentryHandle(),
	securityHeadersHandle,
	authHandle
);

// src/hooks.server.ts
import { handleErrorWithSentry, initCloudflareSentryHandle, sentryHandle } from '@sentry/sveltekit';
import { initializeLucia } from '$lib/server/lucia';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import type { D1Database } from '@cloudflare/workers-types';
import { isSuperAdminUser } from '$lib/auth/session-user';
import { env as privateEnv } from '$env/dynamic/private';
import {
	clampSuperAdminSession,
	isSuperAdminSessionAllowed,
	parseSuperAdminEmailAllowlist
} from '$lib/server/auth/super-admin-security';
import { hasPermission } from '$lib/rbac/permissions';
import {
	ACTIVE_ORG_COOKIE,
	loadMemberships,
	resolveActiveOrg
} from '$lib/server/active-org';
import {
	applySuperAdminImpersonation,
	clearImpersonatedOrgId,
	getImpersonatedOrgId
} from '$lib/server/auth/impersonation';
import { sentryServerConfig } from '../sentry.server.config';
import type { OrgRole, OrgType, Permission } from '$lib/types/rbac';

const superAdminEmails = parseSuperAdminEmailAllowlist(
	privateEnv.SUPER_ADMIN_EMAILS,
	privateEnv.SUPER_ADMIN_EMAIL
);

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
		event.locals.memberships = [];
		event.locals.activeOrg = null;
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
		event.locals.memberships = [];
		event.locals.activeOrg = null;
		event.locals.can = () => false;
		return resolve(event);
	}

	let { session, user } = await lucia.validateSession(sessionId);
	if (session && user && isSuperAdminUser(user)) {
		if (!isSuperAdminSessionAllowed({ role: user.role, email: user.email, allowlist: superAdminEmails })) {
			await lucia.invalidateSession(session.id);
			session = null;
			user = null;
		} else {
			await clampSuperAdminSession(db, session.id);
		}
	}
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
	event.locals.memberships = [];
	event.locals.activeOrg = null;

	// Satu akun boleh memegang banyak lembaga (mis. takmir yang mengurus TPQ,
	// musholla, dan masjid di kampungnya). Lembaga aktif ditentukan sekali di
	// sini, lalu `user.orgId` disetel mengikutinya sehingga seluruh pemanggilan
	// assertOrgMember di rute-rute ikut sadar multi-lembaga.
	if (resolvedUser) {
		const memberships = await loadMemberships(db, resolvedUser.id);
		event.locals.memberships = memberships;

		// Super Admin tidak boleh diturunkan perannya oleh keanggotaan lembaga.
		// Sebelumnya blok ini menimpa `role` SUPER_ADMIN menjadi peran lembaga
		// (mis. 'admin' musholla) pada SETIAP request, sehingga panel super
		// admin selalu 403/500 walau login ulang berkali-kali. Konteks lembaga
		// untuk Super Admin hanya boleh aktif lewat mode impersonate yang
		// memang menyimpan originalRole.
		const superAdmin = isSuperAdminUser(resolvedUser);
		const activeOrg = superAdmin
			? null
			: resolveActiveOrg({
					memberships,
					requestedOrgId: event.cookies.get(ACTIVE_ORG_COOKIE),
					fallbackOrgId: resolvedUser.orgId ?? null
				});

		event.locals.activeOrg = activeOrg;

		if (activeOrg) {
			event.locals.orgType = activeOrg.org_type;
			resolvedUser.orgId = activeOrg.org_id;
			resolvedUser.role = activeOrg.role;
		} else if (resolvedUser.orgId) {
			// Akun lama tanpa baris keanggotaan, atau Super Admin yang sedang
			// mode impersonate (orgId disetel oleh impersonation): cukup baca
			// tipe lembaganya tanpa menyentuh role.
			const org = await db
				.prepare('SELECT type FROM organizations WHERE id = ?')
				.bind(resolvedUser.orgId)
				.first<{ type: OrgType }>();
			event.locals.orgType = org?.type ?? null;
		}
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

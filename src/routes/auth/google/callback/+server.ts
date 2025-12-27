import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogleOAuthClient, initializeLucia } from '$lib/server/lucia';
import { getOrganizationBySlug, memberRoleByType, type OrgType } from '$lib/server/organizations';
import { generateId } from 'lucia';
import { OAuth2RequestError } from 'arctic';
import type { D1Database } from '@cloudflare/workers-types';

type GoogleProfile = {
	sub: string;
	email: string;
	name?: string;
	picture?: string;
};

type GoogleOAuthContext = {
	mode?: string;
	orgType?: string;
	orgSlug?: string;
	role?: string;
	redirect?: string;
};

type UserRow = {
	id: string;
	email: string;
	role?: string | null;
	googleId?: string | null;
	username?: string | null;
	avatar_url?: string | null;
	orgId?: string | null;
	orgStatus?: string | null;
};

type MemberContext = { orgId: string; role: string } | null;

const SUPER_ADMIN_EMAIL = 'masyogikonline@gmail.com';

const parseOAuthContext = (value?: string | null) => {
	if (!value) return null;
	try {
		return JSON.parse(value) as GoogleOAuthContext;
	} catch {
		return null;
	}
};

const isOrgType = (value?: string | null): value is OrgType => {
	if (!value) return false;
	return ['pondok', 'masjid', 'musholla', 'tpq', 'rumah-tahfidz'].includes(value);
};

const getUserColumns = async (db: D1Database) => {
	const { results } = await db.prepare(`PRAGMA table_info('users')`).all<{ name: string }>();
	return new Set((results ?? []).map((col) => col.name));
};

const buildRedirectForRole = (role?: string | null) => {
	if (!role) return '/akun';
	const normalized = role.toLowerCase();
	if (role === 'SUPER_ADMIN' || normalized === 'super_admin') return '/admin/super/overview';
	if (['ustadz', 'ustadzah', 'admin_lembaga', 'admin', 'tamir', 'bendahara'].includes(normalized)) {
		return '/dashboard';
	}
	return '/akun';
};

const resolveMemberContext = async (
	db: D1Database,
	oauthContext: GoogleOAuthContext | null
): Promise<MemberContext> => {
	if (!oauthContext || oauthContext.mode !== 'member') return null;
	if (!oauthContext.orgType || !oauthContext.orgSlug) {
		throw error(400, 'Link pendaftaran tidak valid.');
	}
	if (!isOrgType(oauthContext.orgType)) {
		throw error(400, 'Tipe lembaga tidak valid.');
	}
	const org = await getOrganizationBySlug(db, oauthContext.orgSlug, oauthContext.orgType);
	if (!org || org.status !== 'active') {
		throw error(400, 'Lembaga belum aktif atau tidak ditemukan.');
	}
	const expectedRole = memberRoleByType[oauthContext.orgType];
	if (oauthContext.role && oauthContext.role !== expectedRole) {
		throw error(400, 'Role tidak valid.');
	}
	return { orgId: org.id, role: expectedRole };
};

export const GET: RequestHandler = async ({ url, cookies, locals, fetch }) => {
	const db = locals.db;
	if (!db) throw error(500, 'Database tidak tersedia');

	const lucia = initializeLucia(db);
	const google = getGoogleOAuthClient(url.origin);
	if (!google) throw error(503, 'Google OAuth belum dikonfigurasi.');

	const clearOauthCookies = () => {
		cookies.delete('google_oauth_code_verifier', { path: '/' });
		cookies.delete('google_oauth_state', { path: '/' });
		cookies.delete('google_oauth_context', { path: '/' });
	};

	if (url.searchParams.get('error')) {
		clearOauthCookies();
		throw redirect(302, '/auth');
	}

	const code = url.searchParams.get('code');
	const codeVerifier = cookies.get('google_oauth_code_verifier');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('google_oauth_state');
	const oauthContext = parseOAuthContext(cookies.get('google_oauth_context'));

	if (!code || !codeVerifier || !state || !storedState || state !== storedState) {
		clearOauthCookies();
		throw redirect(302, '/auth');
	}

	let redirectTo = '/akun';

	try {
		const tokens = await google.validateAuthorizationCode(code, codeVerifier);
		const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: { Authorization: `Bearer ${tokens.accessToken}` }
		});
		if (!profileResponse.ok) {
			const detail = await profileResponse.text();
			console.error('Google userinfo failed', profileResponse.status, detail);
			throw error(400, 'Google menolak permintaan profil. Silakan coba lagi.');
		}
		const googleUser = (await profileResponse.json()) as GoogleProfile;
		const email = googleUser.email?.trim();
		if (!googleUser.sub || !email) {
			console.error('Google profile missing fields', googleUser);
			throw error(400, 'Data Google tidak lengkap. Silakan coba lagi.');
		}

		const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
		const memberContext = await resolveMemberContext(db, oauthContext);
		const columns = await getUserColumns(db);
		const selectFields = ['id', 'email'];
		if (columns.has('role')) selectFields.push('role');
		if (columns.has('googleId')) selectFields.push('googleId');
		if (columns.has('username')) selectFields.push('username');
		if (columns.has('avatar_url')) selectFields.push('avatar_url');
		if (columns.has('org_id')) selectFields.push('org_id as orgId');
		if (columns.has('org_status')) selectFields.push('org_status as orgStatus');

		const whereFields: string[] = [];
		const whereValues: Array<string> = [];
		if (columns.has('googleId')) {
			whereFields.push('googleId = ?');
			whereValues.push(googleUser.sub);
		}
		whereFields.push('email = ?');
		whereValues.push(email);

		const existingUser = await db
			.prepare(`SELECT ${selectFields.join(', ')} FROM users WHERE ${whereFields.join(' OR ')} LIMIT 1`)
			.bind(...whereValues)
			.first<UserRow>();

		let userId: string;
		let finalRole = isSuperAdmin ? 'SUPER_ADMIN' : memberContext?.role ?? 'santri';

		if (existingUser) {
			userId = existingUser.id;
			finalRole = existingUser.role ?? finalRole;

			const updates: string[] = [];
			const updateValues: Array<string | number | null> = [];

			if (columns.has('googleId') && !existingUser.googleId) {
				updates.push('googleId = ?');
				updateValues.push(googleUser.sub);
			}

			if (columns.has('username') && (!existingUser.username || existingUser.username.trim() === '') && googleUser.name) {
				updates.push('username = ?');
				updateValues.push(googleUser.name);
			}

			if (columns.has('avatar_url') && googleUser.picture && !existingUser.avatar_url) {
				updates.push('avatar_url = ?');
				updateValues.push(googleUser.picture);
			}

			if (isSuperAdmin && columns.has('role') && existingUser.role !== 'SUPER_ADMIN') {
				updates.push('role = ?');
				updateValues.push('SUPER_ADMIN');
				finalRole = 'SUPER_ADMIN';
			}

			if (memberContext) {
				const currentOrgId = existingUser.orgId ?? null;
				if (currentOrgId && currentOrgId !== memberContext.orgId) {
					throw error(400, 'Akun sudah terdaftar di lembaga lain.');
				}
				if (!currentOrgId && columns.has('org_id')) {
					updates.push('org_id = ?');
					updateValues.push(memberContext.orgId);
					if (columns.has('org_status')) {
						updates.push('org_status = ?');
						updateValues.push('pending');
					}
					if (!isSuperAdmin && columns.has('role')) {
						updates.push('role = ?');
						updateValues.push(memberContext.role);
						finalRole = memberContext.role;
					}
				}
			}

			if (updates.length) {
				updateValues.push(userId);
				await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...updateValues).run();
			}
		} else {
			userId = generateId(15);

			const insertColumns = ['id', 'email', 'role'];
			const insertValues: Array<string | number | null> = [userId, email, finalRole];

			if (columns.has('googleId')) {
				insertColumns.push('googleId');
				insertValues.push(googleUser.sub);
			}
			if (columns.has('username')) {
				insertColumns.push('username');
				insertValues.push(googleUser.name || email.split('@')[0]);
			}
			if (columns.has('avatar_url') && googleUser.picture) {
				insertColumns.push('avatar_url');
				insertValues.push(googleUser.picture);
			}
			if (columns.has('created_at')) {
				insertColumns.push('created_at');
				insertValues.push(Date.now());
			}
			if (memberContext && columns.has('org_id')) {
				insertColumns.push('org_id');
				insertValues.push(memberContext.orgId);
			}
			if (memberContext && columns.has('org_status')) {
				insertColumns.push('org_status');
				insertValues.push('pending');
			}

			await db
				.prepare(`INSERT INTO users (${insertColumns.join(', ')}) VALUES (${insertColumns.map(() => '?').join(', ')})`)
				.bind(...insertValues)
				.run();
		}

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, { path: '/', ...sessionCookie.attributes });
		clearOauthCookies();

		redirectTo = buildRedirectForRole(finalRole);
		if (memberContext) {
			const requested = oauthContext?.redirect;
			redirectTo = requested && requested.startsWith('/') ? requested : '/menunggu';
		}
	} catch (err) {
		console.error('Google login error', err);
		clearOauthCookies();

		if (err instanceof OAuth2RequestError) {
			throw redirect(302, '/auth');
		}

		if (err instanceof Response) {
			throw redirect(302, '/auth');
		}

		throw redirect(302, '/auth');
	}

	throw redirect(302, redirectTo);
};

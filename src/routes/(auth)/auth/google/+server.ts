import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogleOAuthClient } from '$lib/server/lucia';
import { generateCodeVerifier, generateState } from 'arctic';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const google = getGoogleOAuthClient(url.origin);
	if (!google) throw error(503, 'Google OAuth belum dikonfigurasi.');

	const mode = url.searchParams.get('mode');
	const orgType = url.searchParams.get('orgType');
	const orgSlug = url.searchParams.get('orgSlug');
	const role = url.searchParams.get('role');
	const redirectTo = url.searchParams.get('redirect');
	if (mode === 'member' && orgType && orgSlug) {
		const context = JSON.stringify({ mode, orgType, orgSlug, role, redirect: redirectTo });
		cookies.set('google_oauth_context', context, {
			path: '/',
			httpOnly: true,
			maxAge: 60 * 10,
			sameSite: 'lax'
		});
	} else {
		cookies.delete('google_oauth_context', { path: '/' });
	}

	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const authUrl = await google.createAuthorizationURL(state, codeVerifier, {
		scopes: ['profile', 'email']
	});

	cookies.set('google_oauth_state', state, {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	cookies.set('google_oauth_code_verifier', codeVerifier, {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	throw redirect(302, authUrl.toString());
};

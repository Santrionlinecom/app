import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { google } from '$lib/server/lucia';
import { generateCodeVerifier, generateState } from 'arctic';

export const GET: RequestHandler = async ({ cookies }) => {
	if (!google) {
		throw error(503, 'Google OAuth belum dikonfigurasi.');
	}

	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = await google.createAuthorizationURL(state, codeVerifier, {
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

	throw redirect(302, url.toString());
};

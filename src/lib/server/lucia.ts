import { Lucia } from 'lucia';
import { D1Adapter } from '@lucia-auth/adapter-sqlite';
import { dev } from '$app/environment';
import { Google } from 'arctic';

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import type { D1Database } from '@cloudflare/workers-types';

export const initializeLucia = (D1: D1Database) => {
	const adapter = new D1Adapter(D1, {
		user: 'users',
		session: 'sessions'
	});

	return new Lucia(adapter, {
		sessionCookie: {
			attributes: {
				// Secure true kalau online, false kalau di localhost
				secure: !dev
			}
		},
		getUserAttributes: (attributes) => {
			return {
				username: attributes.username,
				role: attributes.role,
				email: attributes.email,
				googleId: attributes.googleId,
				gender: attributes.gender
			};
		}
	});
};

// Settingan Google Login
// Pastikan URL ini SAMA PERSIS dengan yang ada di Google Cloud Console
const redirectUri = `${PUBLIC_BASE_URL}/auth/google/callback`;

export const google = new Google(
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	redirectUri
);

declare module 'lucia' {
	interface Register {
		Lucia: ReturnType<typeof initializeLucia>;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	username: string;
	role: string;
	email: string;
	googleId: string;
	gender?: string;
}

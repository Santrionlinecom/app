import { Lucia } from 'lucia';
import { D1Adapter } from '@lucia-auth/adapter-sqlite';
import { dev } from '$app/environment';
import { Google } from 'arctic';

// --- PERUBAHAN DI SINI ---
// Kita ganti '$env/static/...' menjadi '$env/dynamic/...'
// Supaya Cloudflare tidak error saat build
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

import type { D1Database } from '@cloudflare/workers-types';

export const initializeLucia = (D1: D1Database) => {
    const adapter = new D1Adapter(D1, {
        user: 'users',
        session: 'sessions'
    });

    return new Lucia(adapter, {
        sessionCookie: {
            attributes: {
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

// Ambil variabel dari env dynamic
const GOOGLE_CLIENT_ID = privateEnv.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = privateEnv.GOOGLE_CLIENT_SECRET;
const PUBLIC_BASE_URL = publicEnv.PUBLIC_BASE_URL;

// Settingan Google Login
const redirectUri = `${PUBLIC_BASE_URL}/auth/google/callback`;

export const google = new Google(
    GOOGLE_CLIENT_ID!, // Tanda seru (!) untuk meyakinkan TS bahwa ini ada
    GOOGLE_CLIENT_SECRET!,
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
import { json } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import type { UserRole } from '$lib/types/sosmed';

export type SosmedUser = NonNullable<App.Locals['user']>;

export type SosmedContext =
	| { ok: true; db: D1Database; user: SosmedUser; lembagaId: string }
	| { ok: false; error: Response };

export const jsonError = (message: string, status = 400) => json({ error: message }, { status });

export const requireSosmedContext = (locals: App.Locals): SosmedContext => {
	if (!locals.user?.id) return { ok: false, error: jsonError('Anda harus login.', 401) };
	if (!locals.db) return { ok: false, error: jsonError('Layanan data tidak tersedia.', 500) };

	const lembagaId = locals.user.orgId ?? null;
	if (!lembagaId) {
		return {
			ok: false,
			error: jsonError('Akun harus menjadi anggota lembaga terverifikasi untuk memakai beranda.', 403)
		};
	}

	return { ok: true, db: locals.db, user: locals.user, lembagaId };
};

export const normalizeSosmedRole = (role?: string | null): UserRole => {
	const normalized = (role ?? '').trim().toLowerCase();
	if (normalized === 'wali') return 'wali';
	if (
		['ustadz', 'ustadzah', 'koordinator', 'wali_kelas', 'musyrif', 'imam', 'khotib', 'muadzin'].includes(
			normalized
		)
	) {
		return 'ustadz';
	}
	if (
		[
			'admin',
			'tamir',
			'takmir',
			'ketua_takmir',
			'kepala_tpq',
			'kepala_tahfidz',
			'pengasuh',
			'bendahara',
			'operator'
		].includes(normalized)
	) {
		return 'admin';
	}
	return 'santri';
};

export const displayUserName = (user: SosmedUser) =>
	(user.username ?? user.email?.split('@')[0] ?? 'SantriOnline User').trim() || 'SantriOnline User';

export const userAvatarUrl = (user: SosmedUser) => user.avatarUrl ?? null;

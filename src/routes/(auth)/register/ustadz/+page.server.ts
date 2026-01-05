import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { superValidate, setError } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { Scrypt } from '$lib/server/password';
import { initializeLucia } from '$lib/server/lucia';
import { generateId } from 'lucia';
import { logActivity } from '$lib/server/activity-logs';
import { getRequestIp, logActivity as logSystemActivity } from '$lib/server/logger';

const optionalText = z.preprocess(
	(value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
	z.string().trim().max(120).optional()
);

const ustadzRegisterSchema = z.object({
	fullName: z.string().trim().min(2, 'Nama lengkap wajib diisi.'),
	email: z.string().trim().email('Format email tidak valid.'),
	password: z.string().min(6, 'Password minimal 6 karakter.'),
	whatsapp: z
		.string()
		.trim()
		.min(8, 'Nomor WhatsApp terlalu pendek.')
		.regex(/^[0-9+()\s-]+$/, 'Nomor WhatsApp hanya boleh angka dan simbol umum.'),
	workStatus: z.enum(['freelance', 'owner', 'employee'], {
		message: 'Pilih status pengajar.'
	}),
	expertise: optionalText
});

const redirectForStatus = (status: 'freelance' | 'owner' | 'employee') => {
	if (status === 'owner') return '/onboarding/create-institution';
	if (status === 'employee') return '/onboarding/join-institution';
	return '/dashboard';
};

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}

	const form = await superValidate(zod4(ustadzRegisterSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, platform }) => {
		if (locals.user) {
			throw redirect(302, '/dashboard');
		}

		const form = await superValidate(request, zod4(ustadzRegisterSchema));
		if (!locals.db) {
			return fail(500, { form });
		}
		if (!form.valid) {
			return fail(400, { form });
		}

		const { fullName, email, password, whatsapp, workStatus, expertise } = form.data;

		const existing = await locals.db
			.prepare('SELECT id FROM users WHERE email = ?')
			.bind(email)
			.first<{ id: string }>();
		if (existing) {
			return fail(400, { form: setError(form, 'email', 'Email sudah terdaftar.') });
		}

		const userId = generateId(15);
		const hashed = await new Scrypt().hash(password);

		await locals.db
			.prepare(
				`INSERT INTO users (id, username, email, password_hash, role, whatsapp, work_status, expertise, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				userId,
				fullName,
				email,
				hashed,
				'ustadz',
				whatsapp,
				workStatus,
				expertise ?? null,
				Date.now()
			)
			.run();

		await logActivity(locals.db, {
			userId,
			action: 'REGISTER',
			metadata: {
				role: 'ustadz',
				workStatus,
				source: 'register/ustadz'
			}
		});
		logSystemActivity(locals.db, 'REGISTER', {
			userId,
			userEmail: email,
			ipAddress: getRequestIp(request),
			metadata: { role: 'ustadz', workStatus, source: 'register/ustadz' },
			waitUntil: platform?.context?.waitUntil
		});

		const lucia = initializeLucia(locals.db);
		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});

		throw redirect(302, redirectForStatus(workStatus));
	}
};

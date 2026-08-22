// src/lib/server/notifications/reset-password-email.ts
// Email tautan reset password + pemberitahuan password berubah.
//
// Dua email berbeda, dua tujuan berbeda:
//
// 1. kirimEmailResetPassword — memuat tautan berisi token. Ini email paling
//    sensitif di seluruh aplikasi: siapa pun yang membacanya bisa masuk ke
//    akun tersebut.
//
// 2. kirimEmailPasswordBerubah — dikirim SETELAH password berhasil diganti.
//    Tidak memuat token apa pun. Gunanya memberi tahu pemilik akun bahwa
//    passwordnya berubah — supaya kalau bukan dia pelakunya, dia tahu dan
//    bisa segera bertindak.

type EmailEnv = {
	RESEND_API_KEY?: string;
	TRANSACTIONAL_EMAIL_FROM?: string;
	REGISTRATION_EMAIL_FROM?: string;
	PAYMENT_EMAIL_FROM?: string;
	PUBLIC_BASE_URL?: string;
};

export type HasilKirim =
	| { status: 'sent'; messageId: string }
	| { status: 'failed'; code: string }
	| { status: 'skipped'; reason: 'not_configured' | 'invalid_recipient' };

const escapeHtml = (teks: string) =>
	teks
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const emailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

function bacaConfig(env: object) {
	const e = env as EmailEnv;
	const apiKey = e.RESEND_API_KEY?.trim() ?? '';
	const from =
		e.TRANSACTIONAL_EMAIL_FROM?.trim() ||
		e.REGISTRATION_EMAIL_FROM?.trim() ||
		e.PAYMENT_EMAIL_FROM?.trim() ||
		'';
	const baseUrl = (e.PUBLIC_BASE_URL?.trim() || 'https://app.santrionline.com').replace(/\/$/, '');
	return { apiKey, from, baseUrl };
}

async function kirim(
	fetchFn: typeof fetch,
	config: { apiKey: string; from: string },
	pesan: { to: string; subject: string; text: string; html: string }
): Promise<HasilKirim> {
	try {
		const response = await fetchFn('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${config.apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: config.from,
				to: [pesan.to],
				subject: pesan.subject,
				text: pesan.text,
				html: pesan.html
			}),
			signal: AbortSignal.timeout(5_000)
		});

		const payload = (await response.json().catch(() => ({}))) as {
			id?: unknown;
			name?: unknown;
		};

		if (response.ok && typeof payload.id === 'string' && payload.id.trim()) {
			return { status: 'sent', messageId: payload.id.trim() };
		}

		const nama = typeof payload.name === 'string' ? payload.name.trim() : '';
		return { status: 'failed', code: nama ? `resend_${nama}` : `resend_http_${response.status}` };
	} catch (err) {
		const nama = err instanceof Error ? err.name : 'unknown';
		return { status: 'failed', code: `fetch_${nama}` };
	}
}

/** Membangun tautan reset. Token diletakkan di query, bukan di path. */
export function bangunTautanReset(baseUrl: string, token: string): string {
	return `${baseUrl.replace(/\/$/, '')}/reset-password/konfirmasi?token=${encodeURIComponent(token)}`;
}

export async function kirimEmailResetPassword(input: {
	fetchFn: typeof fetch;
	env: object;
	email: string;
	nama?: string | null;
	token: string;
}): Promise<HasilKirim> {
	const config = bacaConfig(input.env);
	if (!config.apiKey || !config.from) return { status: 'skipped', reason: 'not_configured' };
	if (!emailValid(input.email)) return { status: 'skipped', reason: 'invalid_recipient' };

	const sapaan = input.nama?.trim() || 'Sahabat SantriOnline';
	const tautan = bangunTautanReset(config.baseUrl, input.token);

	return kirim(input.fetchFn, config, {
		to: input.email.trim(),
		subject: 'Reset Password SantriOnline',
		text:
			`Assalamu'alaikum ${sapaan},\n\n` +
			`Kami menerima permintaan reset password untuk akun Anda.\n\n` +
			`Buka tautan berikut untuk membuat password baru:\n${tautan}\n\n` +
			`Tautan ini berlaku 60 menit dan hanya bisa dipakai sekali.\n\n` +
			`Jika Anda TIDAK meminta reset password, abaikan email ini. ` +
			`Password Anda tidak berubah selama tautan di atas tidak dibuka.\n\n` +
			`Jangan teruskan email ini kepada siapa pun. Siapa pun yang memegang ` +
			`tautan tersebut dapat mengganti password akun Anda.`,
		html:
			`<p>Assalamu'alaikum ${escapeHtml(sapaan)},</p>` +
			`<p>Kami menerima permintaan reset password untuk akun Anda.</p>` +
			`<p><a href="${escapeHtml(tautan)}" style="display:inline-block;background:#065f46;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Buat Password Baru</a></p>` +
			`<p style="color:#475569;font-size:14px">Tautan berlaku <strong>60 menit</strong> dan hanya bisa dipakai <strong>sekali</strong>.</p>` +
			`<p style="color:#475569;font-size:14px">Jika Anda tidak meminta reset password, abaikan email ini — password Anda tidak berubah.</p>` +
			`<p style="color:#b91c1c;font-size:13px">Jangan teruskan email ini kepada siapa pun. Siapa pun yang memegang tautan tersebut dapat mengganti password akun Anda.</p>`
	});
}

export async function kirimEmailPasswordBerubah(input: {
	fetchFn: typeof fetch;
	env: object;
	email: string;
	nama?: string | null;
}): Promise<HasilKirim> {
	const config = bacaConfig(input.env);
	if (!config.apiKey || !config.from) return { status: 'skipped', reason: 'not_configured' };
	if (!emailValid(input.email)) return { status: 'skipped', reason: 'invalid_recipient' };

	const sapaan = input.nama?.trim() || 'Sahabat SantriOnline';
	const kontak = `${config.baseUrl}/kontak`;

	return kirim(input.fetchFn, config, {
		to: input.email.trim(),
		subject: 'Password SantriOnline Anda telah diubah',
		text:
			`Assalamu'alaikum ${sapaan},\n\n` +
			`Password akun SantriOnline Anda baru saja diubah, dan semua sesi ` +
			`di perangkat lain telah dikeluarkan.\n\n` +
			`Jika ini Anda lakukan sendiri, tidak perlu tindakan apa pun.\n\n` +
			`Jika BUKAN Anda, segera hubungi kami: ${kontak}`,
		html:
			`<p>Assalamu'alaikum ${escapeHtml(sapaan)},</p>` +
			`<p>Password akun SantriOnline Anda baru saja diubah, dan semua sesi di perangkat lain telah dikeluarkan.</p>` +
			`<p>Jika ini Anda lakukan sendiri, tidak perlu tindakan apa pun.</p>` +
			`<p style="color:#b91c1c"><strong>Jika bukan Anda</strong>, segera <a href="${escapeHtml(kontak)}">hubungi kami</a>.</p>`
	});
}

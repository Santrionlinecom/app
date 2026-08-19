import type { D1Database } from '@cloudflare/workers-types';

import type { SuperAdminNotification } from '../super-admin-notifications';
import { sendPushToUser, type PushMessage } from './push-sender';

/**
 * Push ke superadmin untuk aktivitas yang perlu ditindaklanjuti:
 * pendaftar baru, request addon, dan lembaga baru/menunggu approval.
 *
 * Jenis lain (chat, topup, order, buku) tetap tampil di lonceng, tetapi tidak
 * ikut dikirim sebagai push agar HP tidak berbunyi terus-menerus.
 */
const JENIS_PUSH = new Set(['register', 'addon', 'institution']);

const TABEL_TERKIRIM = 'super_admin_push_log';

export const ensurePushLogSchema = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS ${TABEL_TERKIRIM} (
				notification_id TEXT NOT NULL,
				user_id TEXT NOT NULL,
				sent_at INTEGER NOT NULL,
				PRIMARY KEY (notification_id, user_id)
			)`
		)
		.run();
};

/**
 * Menyaring notifikasi yang benar-benar baru bagi satu penerima.
 * Tanpa ini, notifikasi "pending" akan dikirim ulang setiap kali lonceng
 * di-polling, karena sumbernya adalah query status, bukan antrean kejadian.
 */
export const pilihNotifikasiBaru = (
	semua: SuperAdminNotification[],
	sudahDikirim: Set<string>
): SuperAdminNotification[] =>
	semua.filter((item) => JENIS_PUSH.has(item.kind) && !sudahDikirim.has(item.id));

/**
 * Menggabungkan beberapa kejadian menjadi satu pesan push. Sepuluh pendaftar
 * baru sekaligus tidak boleh menjadi sepuluh dering di HP.
 */
export const ringkasUntukPush = (baru: SuperAdminNotification[]): PushMessage | null => {
	if (baru.length === 0) return null;

	if (baru.length === 1) {
		const satu = baru[0];
		return {
			title: satu.title,
			body: satu.body,
			url: satu.href,
			tag: `so-super-admin:${satu.id}`
		};
	}

	const perJenis = new Map<string, number>();
	for (const item of baru) perJenis.set(item.kind, (perJenis.get(item.kind) ?? 0) + 1);

	const label: Record<string, string> = {
		register: 'pendaftar baru',
		addon: 'request addon',
		institution: 'lembaga'
	};

	const rincian = [...perJenis.entries()]
		.map(([kind, jumlah]) => `${jumlah} ${label[kind] ?? kind}`)
		.join(', ');

	return {
		title: `${baru.length} aktivitas baru`,
		body: rincian,
		url: '/admin/super/overview#activity-feed',
		tag: 'so-super-admin:ringkasan'
	};
};

const daftarSudahDikirim = async (db: D1Database, userId: string) => {
	await ensurePushLogSchema(db);
	const { results } = await db
		.prepare(`SELECT notification_id AS id FROM ${TABEL_TERKIRIM} WHERE user_id = ?`)
		.bind(userId)
		.all<{ id: string }>();
	return new Set((results ?? []).map((row) => row.id));
};

const catatTerkirim = async (db: D1Database, userId: string, ids: string[]) => {
	const sekarang = Date.now();
	for (const id of ids) {
		await db
			.prepare(
				`INSERT INTO ${TABEL_TERKIRIM} (notification_id, user_id, sent_at)
				 VALUES (?, ?, ?)
				 ON CONFLICT(notification_id, user_id) DO NOTHING`
			)
			.bind(id, userId, sekarang)
			.run();
	}
};

type KirimInput = {
	db: D1Database;
	fetchFn: typeof fetch;
	env: object;
	userId: string;
	notifications: SuperAdminNotification[];
};

/**
 * Dipanggil dari endpoint lonceng. Aman dipanggil berulang: notifikasi yang
 * sudah pernah dikirim ke user tersebut tidak akan dikirim lagi.
 */
export const kirimPushSuperAdmin = async ({
	db,
	fetchFn,
	env,
	userId,
	notifications
}: KirimInput) => {
	try {
		const sudah = await daftarSudahDikirim(db, userId);
		const baru = pilihNotifikasiBaru(notifications, sudah);
		const pesan = ringkasUntukPush(baru);
		if (!pesan) return { terkirim: 0 };

		await sendPushToUser({ db, fetchFn, env, userId, message: pesan });
		await catatTerkirim(
			db,
			userId,
			baru.map((item) => item.id)
		);
		return { terkirim: baru.length };
	} catch {
		// Kegagalan push tidak boleh menggagalkan permintaan lonceng itu sendiri.
		return { terkirim: 0 };
	}
};

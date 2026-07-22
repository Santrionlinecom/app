import type { D1Database } from '@cloudflare/workers-types';

export type SuperAdminNotificationSeverity = 'urgent' | 'warning' | 'info';

export interface SuperAdminNotification {
	id: string;
	kind: string;
	severity: SuperAdminNotificationSeverity;
	title: string;
	body: string;
	href: string;
	createdAt: number | null;
}

const NOTIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;

const safeNotificationQuery = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
	try {
		return await fn();
	} catch {
		return fallback;
	}
};


const ensureSuperAdminNotificationDismissalsTable = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS super_admin_notification_dismissals (
				notification_id TEXT PRIMARY KEY,
				dismissed_by TEXT,
				dismissed_at INTEGER NOT NULL
			)`
		)
		.run();
};

export const dismissSuperAdminNotification = async (
	db: D1Database,
	notificationId: string,
	dismissedBy?: string | null
) => {
	const id = notificationId.trim();
	if (!id) return { ok: false as const, error: 'Notifikasi tidak valid.' };
	await ensureSuperAdminNotificationDismissalsTable(db);
	await db
		.prepare(
			`INSERT INTO super_admin_notification_dismissals (notification_id, dismissed_by, dismissed_at)
			 VALUES (?, ?, ?)
			 ON CONFLICT(notification_id) DO UPDATE SET
				dismissed_by = excluded.dismissed_by,
				dismissed_at = excluded.dismissed_at`
		)
		.bind(id, dismissedBy ?? null, Date.now())
		.run();
	return { ok: true as const };
};

export const clearSuperAdminNotificationDismissals = async (db: D1Database) => {
	await ensureSuperAdminNotificationDismissalsTable(db);
	await db.prepare('DELETE FROM super_admin_notification_dismissals').run();
	return { ok: true as const };
};

const listDismissedNotificationIds = async (db: D1Database) => {
	await ensureSuperAdminNotificationDismissalsTable(db);
	const { results } = await db
		.prepare('SELECT notification_id as id FROM super_admin_notification_dismissals')
		.all<{ id: string }>();
	return new Set((results ?? []).map((row) => row.id));
};


const hasTableColumn = async (db: D1Database, table: string, column: string) => {
	try {
		const { results } = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
		return (results ?? []).some((row) => row.name === column);
	} catch {
		return false;
	}
};

export const dedupeSuperAdminNotifications = (items: SuperAdminNotification[]) => {
	const seen = new Set<string>();
	return [...items]
		.sort((left, right) => Number(right.createdAt ?? 0) - Number(left.createdAt ?? 0))
		.filter((item) => {
			if (seen.has(item.id)) return false;
			seen.add(item.id);
			return true;
		});
};

const sortNotifications = (items: SuperAdminNotification[]) =>
	dedupeSuperAdminNotifications(items)
		.sort((left, right) => {
			const rank: Record<SuperAdminNotificationSeverity, number> = { urgent: 3, warning: 2, info: 1 };
			const severityDiff = (rank[right.severity] ?? 0) - (rank[left.severity] ?? 0);
			if (severityDiff !== 0) return severityDiff;
			return Number(right.createdAt ?? 0) - Number(left.createdAt ?? 0);
		})
		.slice(0, 18);

export const getSuperAdminNotifications = async (db: D1Database) => {
	const notificationSince = Date.now() - NOTIFICATION_WINDOW_MS;

	const recentRegisterNotifications = await safeNotificationQuery(async () => {
		const { results } = await db
			.prepare(
				`SELECT sl.id, sl.user_email as userEmail, sl.metadata, sl.created_at as createdAt,
					u.username, u.email, u.role
				 FROM system_logs sl
				 LEFT JOIN users u ON u.id = sl.user_id
				 WHERE sl.action = 'REGISTER' AND sl.created_at >= ?
				 ORDER BY sl.created_at DESC
				 LIMIT 6`
			)
			.bind(notificationSince)
			.all<{
				id: string;
				userEmail: string | null;
				metadata: string | null;
				createdAt: number;
				username: string | null;
				email: string | null;
				role: string | null;
			}>();
		return (results ?? []).map((row): SuperAdminNotification => ({
			id: `register:${row.id}`,
			kind: 'register',
			severity: 'info',
			title: 'Akun baru terdaftar',
			body: `${row.username || row.userEmail || row.email || 'User baru'}${row.role ? ` sebagai ${row.role}` : ''}`,
			href: '/admin/super/overview#activity-feed',
			createdAt: row.createdAt
		}));
	}, [] as SuperAdminNotification[]);

	const pendingTopupNotifications = await safeNotificationQuery(async () => {
		const { results } = await db
			.prepare(
				`SELECT t.id, t.amount_rupiah as amountRupiah, t.coin_amount as coinAmount,
					CAST(strftime('%s', t.created_at) AS INTEGER) * 1000 as createdAt,
					u.username, u.email
				 FROM coin_topup_requests t
				 LEFT JOIN users u ON u.id = t.user_id
				 WHERE t.status = 'pending'
				 ORDER BY t.created_at DESC
				 LIMIT 6`
			)
			.all<{
				id: string;
				amountRupiah: number | null;
				coinAmount: number | null;
				createdAt: number | null;
				username: string | null;
				email: string | null;
			}>();
		return (results ?? []).map((row): SuperAdminNotification => ({
			id: `topup:${row.id}`,
			kind: 'topup',
			severity: 'urgent',
			title: 'Topup coin menunggu verifikasi',
			body: `${row.username || row.email || 'User'} mengirim request ${Number(row.coinAmount ?? 0).toLocaleString('id-ID')} coin`,
			href: `/admin/super/coin-topups/${row.id}`,
			createdAt: row.createdAt
		}));
	}, [] as SuperAdminNotification[]);

	const chatNotifications = await safeNotificationQuery(async () => {
		const { results } = await db
			.prepare(
				`SELECT m.id, m.content, m.created_at as createdAt, u.username, u.email
				 FROM chat_messages m
				 LEFT JOIN users u ON u.id = m.sender_id
				 WHERE m.created_at >= ?
				 ORDER BY m.created_at DESC
				 LIMIT 4`
			)
			.bind(notificationSince)
			.all<{
				id: string;
				content: string;
				createdAt: number;
				username: string | null;
				email: string | null;
			}>();
		return (results ?? []).map((row): SuperAdminNotification => ({
			id: `chat:${row.id}`,
			kind: 'message',
			severity: 'info',
			title: 'Pesan chat baru',
			body: `${row.username || row.email || 'User'}: ${String(row.content ?? '').slice(0, 90)}`,
			href: '/admin/super/overview#activity-feed',
			createdAt: row.createdAt
		}));
	}, [] as SuperAdminNotification[]);

	const pendingInstitutionNotifications = await safeNotificationQuery(async () => {
		const { results } = await db
			.prepare(
				`SELECT id, name, type, created_at as createdAt
				 FROM organizations
				 WHERE LOWER(COALESCE(status, '')) = 'pending'
				 ORDER BY created_at DESC
				 LIMIT 5`
			)
			.all<{ id: string; name: string; type: string; createdAt: number | null }>();
		return (results ?? []).map((org): SuperAdminNotification => ({
			id: `org-pending:${org.id}`,
			kind: 'institution',
			severity: 'urgent',
			title: 'Lembaga menunggu approval',
			body: `${org.name} (${org.type}) belum aktif`,
			href: '/admin/super/overview#institution-list',
			createdAt: org.createdAt
		}));
	}, [] as SuperAdminNotification[]);

	const noAdminNotifications = await safeNotificationQuery(async () => {
		const hasAkunAdminColumn = await hasTableColumn(db, 'organizations', 'akun_admin_id');
		const { results } = await db
			.prepare(
				hasAkunAdminColumn
					? `SELECT o.id, o.name, o.type, o.created_at as createdAt
						 FROM organizations o
						 LEFT JOIN users u
						   ON (
							(u.org_id = o.id AND u.role = 'admin')
							OR u.id = o.akun_admin_id
						   )
						 GROUP BY o.id
						 HAVING COUNT(DISTINCT u.id) = 0
						 ORDER BY o.created_at DESC
						 LIMIT 5`
					: `SELECT o.id, o.name, o.type, o.created_at as createdAt
						 FROM organizations o
						 LEFT JOIN users u ON u.org_id = o.id AND u.role = 'admin'
						 GROUP BY o.id
						 HAVING COUNT(DISTINCT u.id) = 0
						 ORDER BY o.created_at DESC
						 LIMIT 5`
			)
			.all<{ id: string; name: string; type: string; createdAt: number | null }>();
		return (results ?? []).map((org): SuperAdminNotification => ({
			id: `org-admin:${org.id}`,
			kind: 'institution',
			severity: 'warning',
			title: 'Lembaga belum punya admin',
			body: `${org.name} (${org.type}) perlu admin pengelola`,
			href: '/admin/super/overview#admin-control',
			createdAt: org.createdAt
		}));
	}, [] as SuperAdminNotification[]);

	const pendingSaleNotifications = await safeNotificationQuery(async () => {
		const { results } = await db
			.prepare(
				`SELECT s.id, s.reference_code as referenceCode, s.buyer_name as buyerName,
					s.buyer_contact as buyerContact, s.created_at as createdAt, p.title as productTitle
				 FROM digital_product_sales s
				 LEFT JOIN digital_products p ON p.id = s.product_id
				 WHERE s.status = 'pending'
				 ORDER BY s.created_at DESC
				 LIMIT 6`
			)
			.all<{
				id: string;
				referenceCode: string | null;
				buyerName: string | null;
				buyerContact: string | null;
				productTitle: string | null;
				createdAt: number;
			}>();
		return (results ?? []).map((sale): SuperAdminNotification => ({
			id: `digital-sale:${sale.id}`,
			kind: 'order',
			severity: 'urgent',
			title: 'Order digital menunggu verifikasi',
			body: `${sale.buyerName || sale.buyerContact || 'Pembeli'} - ${sale.productTitle || sale.referenceCode || sale.id}`,
			href: '/admin/super/overview#digital-sales',
			createdAt: sale.createdAt
		}));
	}, [] as SuperAdminNotification[]);

	const pendingBookNotifications = await safeNotificationQuery(async () => {
		const { results } = await db
			.prepare(
				`SELECT b.id, b.title, b.updated_at as updatedAt, u.username, u.email
				 FROM buku_books b
				 LEFT JOIN users u ON u.id = b.author_id
				 WHERE b.status = 'pending'
				 ORDER BY b.updated_at DESC
				 LIMIT 6`
			)
			.all<{
				id: string;
				title: string;
				updatedAt: string | number | null;
				username: string | null;
				email: string | null;
			}>();
		return (results ?? []).map((book): SuperAdminNotification => ({
			id: `book-pending:${book.id}`,
			kind: 'book',
			severity: 'urgent',
			title: 'Buku menunggu review',
			body: `${book.title} oleh ${book.username || book.email || 'penulis'}`,
			href: `/admin/super/buku/${book.id}`,
			createdAt: typeof book.updatedAt === 'number' ? book.updatedAt : book.updatedAt ? Date.parse(book.updatedAt) : null
		}));
	}, [] as SuperAdminNotification[]);

	const dismissedIds = await safeNotificationQuery(() => listDismissedNotificationIds(db), new Set<string>());
	const notifications = sortNotifications([
		...pendingTopupNotifications,
		...pendingSaleNotifications,
		...pendingBookNotifications,
		...pendingInstitutionNotifications,
		...noAdminNotifications,
		...recentRegisterNotifications,
		...chatNotifications
	]).filter((item) => !dismissedIds.has(item.id));

	return {
		notifications,
		notificationCounts: {
			total: notifications.length,
			urgent: notifications.filter((item) => item.severity === 'urgent').length,
			warning: notifications.filter((item) => item.severity === 'warning').length,
			info: notifications.filter((item) => item.severity === 'info').length
		}
	};
};

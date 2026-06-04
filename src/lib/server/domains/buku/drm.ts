import type { D1Database } from '@cloudflare/workers-types';

export const DRM_MAX_DEVICES = 3;

export type DrmBook = {
	id: string;
	title: string;
	slug: string;
	freeChapterLimit: number;
	pricePerChapter: number;
	status?: string;
};

export type DrmChapter = {
	id: string;
	bookId: string;
	chapterNumber: number;
	title: string;
	coinPrice?: number | null;
	status?: string;
};

export type DrmAccessResult = {
	hasAccess: boolean;
	source: 'direct' | 'coin' | 'free' | null;
	book: DrmBook | null;
	chapter: DrmChapter | null;
};

export type DrmProgress = {
	currentPage: number;
	totalPages: number;
	percentage: number;
} | null;

export async function ensureDrmSchema(db: D1Database) {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS user_devices (
				id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
				user_id TEXT NOT NULL,
				device_fingerprint TEXT NOT NULL,
				device_name TEXT,
				device_ip TEXT,
				last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(user_id, device_fingerprint)
			)`
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS user_book_access (
				id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
				user_id TEXT NOT NULL,
				book_id TEXT NOT NULL,
				chapter_id TEXT,
				access_type TEXT DEFAULT 'coin',
				coin_spent INTEGER DEFAULT 0,
				expires_at DATETIME,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(user_id, book_id, chapter_id)
			)`
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS reading_progress (
				id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
				user_id TEXT NOT NULL,
				book_id TEXT NOT NULL,
				chapter_id TEXT,
				current_page INTEGER DEFAULT 1,
				total_pages INTEGER DEFAULT 0,
				percentage REAL DEFAULT 0,
				last_read DATETIME DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(user_id, book_id, chapter_id)
			)`
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS drm_access_log (
				id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
				user_id TEXT NOT NULL,
				book_id TEXT NOT NULL,
				chapter_id TEXT,
				device_fingerprint TEXT,
				action TEXT,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)`
		)
		.run();

	await db.prepare('CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id)').run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_book_access_user ON user_book_access(user_id, book_id)')
		.run();
	await db
		.prepare(
			"CREATE UNIQUE INDEX IF NOT EXISTS idx_book_access_scope ON user_book_access(user_id, book_id, COALESCE(chapter_id, ''))"
		)
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON reading_progress(user_id, book_id)')
		.run();
	await db
		.prepare(
			"CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_progress_scope ON reading_progress(user_id, book_id, COALESCE(chapter_id, ''))"
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_drm_access_log_user ON drm_access_log(user_id, book_id, created_at)'
		)
		.run();
}

export function normalizeChapterId(chapterId: string | null | undefined) {
	const normalized = String(chapterId || '').trim();
	return normalized ? normalized : null;
}

function mapBook(row: any): DrmBook | null {
	if (!row) return null;
	return {
		id: row.id,
		title: row.title,
		slug: row.slug,
		freeChapterLimit: Number(row.free_chapter_limit || row.freeChapterLimit || 0),
		pricePerChapter: Number(row.price_per_chapter || row.pricePerChapter || 0),
		status: row.status
	};
}

function mapChapter(row: any): DrmChapter | null {
	if (!row) return null;
	return {
		id: row.id,
		bookId: row.book_id || row.bookId,
		chapterNumber: Number(row.chapter_number || row.chapterNumber || 0),
		title: row.title,
		coinPrice: row.coin_price ?? row.coinPrice ?? null,
		status: row.status
	};
}

export async function getDrmBook(db: D1Database, bookId: string) {
	const row = await db
		.prepare(
			`SELECT id, title, slug, free_chapter_limit, price_per_chapter, status
			 FROM buku_books
			 WHERE id = ? AND status = 'published'
			 LIMIT 1`
		)
		.bind(bookId)
		.first();

	return mapBook(row);
}

export async function getDrmChapter(db: D1Database, bookId: string, chapterId: string | null) {
	if (!chapterId) return null;

	const row = await db
		.prepare(
			`SELECT id, book_id, chapter_number, title, NULL as coin_price, status
			 FROM buku_chapters
			 WHERE book_id = ? AND id = ? AND status = 'published'
			 LIMIT 1`
		)
		.bind(bookId, chapterId)
		.first();

	return mapChapter(row);
}

export async function getDrmChapterBySelector(db: D1Database, bookId: string, selector: string | null) {
	if (!selector) {
		const first = await db
			.prepare(
				`SELECT id, book_id, chapter_number, title, NULL as coin_price, status
				 FROM buku_chapters
				 WHERE book_id = ? AND status = 'published'
				 ORDER BY chapter_number ASC
				 LIMIT 1`
			)
			.bind(bookId)
			.first();
		return mapChapter(first);
	}

	const maybeNumber = Number(selector);
	const row = Number.isFinite(maybeNumber)
		? await db
				.prepare(
					`SELECT id, book_id, chapter_number, title, NULL as coin_price, status
					 FROM buku_chapters
					 WHERE book_id = ? AND chapter_number = ? AND status = 'published'
					 LIMIT 1`
				)
				.bind(bookId, maybeNumber)
				.first()
		: await db
				.prepare(
					`SELECT id, book_id, chapter_number, title, NULL as coin_price, status
					 FROM buku_chapters
					 WHERE book_id = ? AND id = ? AND status = 'published'
					 LIMIT 1`
				)
				.bind(bookId, selector)
				.first();

	return mapChapter(row);
}

export async function getDrmAccess(
	db: D1Database,
	input: { userId: string; bookId: string; chapterId?: string | null }
): Promise<DrmAccessResult> {
	const book = await getDrmBook(db, input.bookId);
	const chapterId = normalizeChapterId(input.chapterId);
	const chapter = await getDrmChapter(db, input.bookId, chapterId);

	if (!book) return { hasAccess: false, source: null, book: null, chapter: null };

	const directAccess = await db
		.prepare(
			`SELECT id, access_type
			 FROM user_book_access
			 WHERE user_id = ?
			   AND book_id = ?
			   AND (
			     (? IS NULL AND chapter_id IS NULL)
			     OR (? IS NOT NULL AND (chapter_id = ? OR chapter_id IS NULL))
			   )
			   AND (expires_at IS NULL OR expires_at > datetime('now'))
			 LIMIT 1`
		)
		.bind(input.userId, input.bookId, chapterId, chapterId, chapterId)
		.first();

	if (directAccess) {
		return { hasAccess: true, source: 'direct', book, chapter };
	}

	if (chapter && chapter.chapterNumber <= book.freeChapterLimit) {
		return { hasAccess: true, source: 'free', book, chapter };
	}

	if (chapter) {
		const unlock = await db
			.prepare(
				`SELECT id
				 FROM buku_unlocks
				 WHERE user_id = ? AND book_id = ? AND chapter_id = ?
				 LIMIT 1`
			)
			.bind(input.userId, input.bookId, chapter.id)
			.first();

		if (unlock) {
			return { hasAccess: true, source: 'coin', book, chapter };
		}
	}

	return { hasAccess: false, source: null, book, chapter };
}

export async function mirrorDrmAccess(
	db: D1Database,
	input: {
		userId: string;
		bookId: string;
		chapterId?: string | null;
		accessType?: string;
		coinSpent?: number;
	}
) {
	const chapterId = normalizeChapterId(input.chapterId);
	const existing = await db
		.prepare(
			`SELECT id
			 FROM user_book_access
			 WHERE user_id = ? AND book_id = ?
			   AND ((? IS NULL AND chapter_id IS NULL) OR chapter_id = ?)
			 LIMIT 1`
		)
		.bind(input.userId, input.bookId, chapterId, chapterId)
		.first<{ id: string }>();

	if (existing?.id) {
		await db
			.prepare(
				`UPDATE user_book_access
				 SET access_type = ?, coin_spent = ?
				 WHERE id = ?`
			)
			.bind(input.accessType || 'coin', input.coinSpent || 0, existing.id)
			.run();
		return;
	}

	await db
		.prepare(
			`INSERT INTO user_book_access (user_id, book_id, chapter_id, access_type, coin_spent)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.bind(
			input.userId,
			input.bookId,
			chapterId,
			input.accessType || 'coin',
			Math.max(0, Number(input.coinSpent || 0))
		)
		.run();
}

export async function getDrmProgress(
	db: D1Database,
	input: { userId: string; bookId: string; chapterId?: string | null }
): Promise<DrmProgress> {
	const chapterId = normalizeChapterId(input.chapterId);
	const row = await db
		.prepare(
			`SELECT current_page, total_pages, percentage
			 FROM reading_progress
			 WHERE user_id = ? AND book_id = ?
			   AND ((? IS NULL AND chapter_id IS NULL) OR chapter_id = ?)
			 LIMIT 1`
		)
		.bind(input.userId, input.bookId, chapterId, chapterId)
		.first<any>();

	if (!row) return null;
	return {
		currentPage: Number(row.current_page || 1),
		totalPages: Number(row.total_pages || 0),
		percentage: Number(row.percentage || 0)
	};
}

export async function saveDrmProgress(
	db: D1Database,
	input: {
		userId: string;
		bookId: string;
		chapterId?: string | null;
		currentPage: number;
		totalPages: number;
	}
) {
	const chapterId = normalizeChapterId(input.chapterId);
	const currentPage = Math.max(1, Math.floor(Number(input.currentPage || 1)));
	const totalPages = Math.max(0, Math.floor(Number(input.totalPages || 0)));
	const percentage = totalPages > 0 ? Math.min(100, Math.max(0, (currentPage / totalPages) * 100)) : 0;

	const existing = await db
		.prepare(
			`SELECT id
			 FROM reading_progress
			 WHERE user_id = ? AND book_id = ?
			   AND ((? IS NULL AND chapter_id IS NULL) OR chapter_id = ?)
			 LIMIT 1`
		)
		.bind(input.userId, input.bookId, chapterId, chapterId)
		.first<{ id: string }>();

	if (existing?.id) {
		await db
			.prepare(
				`UPDATE reading_progress
				 SET current_page = ?, total_pages = ?, percentage = ?, last_read = datetime('now')
				 WHERE id = ?`
			)
			.bind(currentPage, totalPages, percentage, existing.id)
			.run();
		return { currentPage, totalPages, percentage };
	}

	await db
		.prepare(
			`INSERT INTO reading_progress
			 (user_id, book_id, chapter_id, current_page, total_pages, percentage)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(input.userId, input.bookId, chapterId, currentPage, totalPages, percentage)
		.run();

	return { currentPage, totalPages, percentage };
}

export async function logDrmAccess(
	db: D1Database,
	input: {
		userId: string;
		bookId: string;
		chapterId?: string | null;
		deviceFingerprint?: string | null;
		action: 'read' | 'denied_device' | 'denied_access' | 'denied_expired';
	}
) {
	await db
		.prepare(
			`INSERT INTO drm_access_log
			 (user_id, book_id, chapter_id, device_fingerprint, action)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.bind(
			input.userId,
			input.bookId,
			normalizeChapterId(input.chapterId),
			normalizeOptional(input.deviceFingerprint),
			input.action
		)
		.run();
}

export async function registerOrTouchDevice(
	db: D1Database,
	input: {
		userId: string;
		fingerprint: string;
		deviceName?: string | null;
		deviceIp?: string | null;
		maxDevices?: number;
	}
) {
	const fingerprint = sanitizeDeviceValue(input.fingerprint, 180);
	const deviceName = sanitizeDeviceValue(input.deviceName || 'Perangkat tidak dikenal', 120);
	const deviceIp = sanitizeDeviceValue(input.deviceIp || '', 64);

	if (!fingerprint) return { allowed: true, registered: false, total: 0 };

	const existing = await db
		.prepare(
			`SELECT id
			 FROM user_devices
			 WHERE user_id = ? AND device_fingerprint = ?
			 LIMIT 1`
		)
		.bind(input.userId, fingerprint)
		.first<{ id: string }>();

	if (existing?.id) {
		await db
			.prepare(
				`UPDATE user_devices
				 SET device_name = ?, device_ip = ?, last_active = datetime('now')
				 WHERE id = ?`
			)
			.bind(deviceName, deviceIp || null, existing.id)
			.run();
		const total = await countDevices(db, input.userId);
		return { allowed: true, registered: false, total };
	}

	const total = await countDevices(db, input.userId);
	if (total >= (input.maxDevices || DRM_MAX_DEVICES)) {
		return { allowed: false, registered: false, total };
	}

	await db
		.prepare(
			`INSERT INTO user_devices (user_id, device_fingerprint, device_name, device_ip)
			 VALUES (?, ?, ?, ?)`
		)
		.bind(input.userId, fingerprint, deviceName, deviceIp || null)
		.run();

	return { allowed: true, registered: true, total: total + 1 };
}

export async function listDrmDevices(db: D1Database, userId: string) {
	const result = await db
		.prepare(
			`SELECT id, device_name, last_active, created_at
			 FROM user_devices
			 WHERE user_id = ?
			 ORDER BY last_active DESC`
		)
		.bind(userId)
		.all();

	return (result.results || []).map((device: any) => ({
		id: device.id,
		deviceName: device.device_name || 'Perangkat tidak dikenal',
		lastActive: device.last_active,
		createdAt: device.created_at
	}));
}

export async function deleteDrmDevice(db: D1Database, userId: string, deviceId: string) {
	await db
		.prepare('DELETE FROM user_devices WHERE id = ? AND user_id = ?')
		.bind(deviceId, userId)
		.run();
}

export function getDrmPdfKey(bookId: string, chapterId?: string | null) {
	const chapter = normalizeChapterId(chapterId);
	return chapter ? `books/${bookId}/chapters/${chapter}.pdf` : `books/${bookId}/full.pdf`;
}

export function getRequestIp(request: Request) {
	return (
		request.headers.get('cf-connecting-ip') ||
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		request.headers.get('x-real-ip') ||
		''
	);
}

function normalizeOptional(value: string | null | undefined) {
	const normalized = String(value || '').trim();
	return normalized ? normalized : null;
}

function sanitizeDeviceValue(value: string | null | undefined, maxLength: number) {
	return String(value || '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, maxLength);
}

async function countDevices(db: D1Database, userId: string) {
	const row = await db
		.prepare('SELECT COUNT(*) AS total FROM user_devices WHERE user_id = ?')
		.bind(userId)
		.first<{ total: number }>();
	return Number(row?.total || 0);
}

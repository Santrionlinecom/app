import { error } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import {
	assertFeature,
	assertLoggedIn,
	assertOrgMember,
	normalizeRole
} from '$lib/server/auth/rbac';
import { getOrganizationById } from '$lib/server/organizations';

export type LearnCategory =
	| 'hijaiyah'
	| 'mufrodat'
	| 'nahwu'
	| 'shorof'
	| 'kitab'
	| 'percakapan';
export type LearnQuestionType =
	| 'pilihan_ganda'
	| 'cocokkan'
	| 'isi_titik'
	| 'susun_kata'
	| 'dengar_pilih';

export type LearnModule = {
	id: string;
	lembagaId: string | null;
	judul: string;
	deskripsi: string | null;
	kategori: LearnCategory;
	urutan: number;
	isAktif: number;
	totalSoal: number;
	soalSelesai: number;
	xp: number;
	streakHari: number;
	lastBelajar: number | null;
	status: 'belum' | 'proses' | 'selesai';
	locked: boolean;
};

export type LearnQuestion = {
	id: string;
	modulId: string;
	tipe: LearnQuestionType;
	pertanyaan: string;
	pilihan: string | null;
	pilihanA: string | null;
	pilihanB: string | null;
	pilihanC: string | null;
	pilihanD: string | null;
	jawabanBenar: string;
	penjelasan: string | null;
	audioUrl: string | null;
	urutan: number;
	options: string[];
	answerKey: 'a' | 'b' | 'c' | 'd' | null;
	correctAnswerText: string;
};

export type LearnSummary = {
	totalXp: number;
	streakHari: number;
};

export type LearnBadge = {
	id: string;
	tipe: string;
	label: string;
	diraihAt: number | null;
};

export type LearnLeaderboardRow = {
	rank: number;
	userId: string;
	nama: string;
	totalXp: number;
	streakHari: number;
	badgeCount: number;
	isCurrentUser: boolean;
};

type LearnModuleRow = Omit<LearnModule, 'locked'>;
type LearnQuestionRow = Omit<LearnQuestion, 'options' | 'answerKey' | 'correctAnswerText'>;
type ProgressRow = {
	id: string;
	userId: string;
	modulId: string;
	soalSelesai: number;
	xp: number;
	streakHari: number;
	lastBelajar: number | null;
	status: 'belum' | 'proses' | 'selesai';
};
type LearnContext = {
	db: D1Database;
	user: NonNullable<App.Locals['user']>;
	lembagaId: string;
};

const ALLOWED_ROLES = new Set([
	'admin',
	'koordinator',
	'ustadz',
	'ustadzah',
	'santri',
	'alumni',
	'SUPER_ADMIN'
]);

const BADGE_BY_CATEGORY: Partial<
	Record<LearnCategory, { tipe: string; label: string }>
> = {
	hijaiyah: { tipe: 'pemula_qurani', label: 'Pemula Qurani' },
	mufrodat: { tipe: 'pencinta_mufrodat', label: 'Pencinta Mufrodat' },
	nahwu: { tipe: 'ahli_nahwu_dasar', label: 'Ahli Nahwu Dasar' },
	shorof: { tipe: 'mutasharrif', label: 'Mutasharrif' }
};

const SANTRI_LEARN_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS learn_modul (
  id TEXT PRIMARY KEY,
  lembaga_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  kategori TEXT NOT NULL CHECK(kategori IN ('hijaiyah','mufrodat','nahwu','shorof','kitab','percakapan')),
  urutan INTEGER DEFAULT 0,
  is_aktif INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);

CREATE TABLE IF NOT EXISTS learn_soal (
  id TEXT PRIMARY KEY,
  modul_id TEXT NOT NULL REFERENCES learn_modul(id) ON DELETE CASCADE,
  tipe TEXT NOT NULL CHECK(tipe IN ('pilihan_ganda','cocokkan','isi_titik','susun_kata','dengar_pilih')),
  pertanyaan TEXT NOT NULL,
  pilihan TEXT,
  pilihan_a TEXT,
  pilihan_b TEXT,
  pilihan_c TEXT,
  pilihan_d TEXT,
  jawaban_benar TEXT NOT NULL,
  penjelasan TEXT,
  audio_url TEXT,
  urutan INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS learn_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  modul_id TEXT NOT NULL REFERENCES learn_modul(id) ON DELETE CASCADE,
  soal_selesai INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  streak_hari INTEGER DEFAULT 0,
  last_belajar INTEGER,
  status TEXT DEFAULT 'belum' CHECK(status IN ('belum','proses','selesai')),
  UNIQUE(user_id, modul_id)
);

CREATE TABLE IF NOT EXISTS learn_jawaban (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  soal_id TEXT NOT NULL REFERENCES learn_soal(id) ON DELETE CASCADE,
  jawaban TEXT NOT NULL,
  is_benar INTEGER DEFAULT 0,
  waktu_jawab INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);

CREATE TABLE IF NOT EXISTS learn_badge (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lembaga_id TEXT REFERENCES organizations(id),
  tipe TEXT NOT NULL,
  diraih_at INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);

CREATE INDEX IF NOT EXISTS idx_learn_progress_user ON learn_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learn_soal_modul ON learn_soal(modul_id);
CREATE INDEX IF NOT EXISTS idx_learn_jawaban_user ON learn_jawaban(user_id);

INSERT OR IGNORE INTO learn_modul (id, lembaga_id, judul, deskripsi, kategori, urutan, is_aktif)
VALUES
  ('global-hijaiyah-01', NULL, 'Huruf Hijaiyah', 'Kenali huruf-huruf dasar sebelum membaca kata Arab.', 'hijaiyah', 1, 1),
  ('global-mufrodat-01', NULL, 'Mufrodat Dasar', 'Latihan menghubungkan kata Arab umum dengan artinya.', 'mufrodat', 2, 1),
  ('global-nahwu-01', NULL, 'Nahwu Dasar - Isim & Fi''il', 'Bedakan kata benda dan kata kerja dalam kalimat pendek.', 'nahwu', 3, 1),
  ('global-shorof-01', NULL, 'Shorof Dasar - Tasrif', 'Lengkapi bentuk dasar tasrif dari pola fi''il sederhana.', 'shorof', 4, 1);

INSERT OR IGNORE INTO learn_soal (id, modul_id, tipe, pertanyaan, pilihan, jawaban_benar, urutan)
VALUES
  ('hijaiyah-01-ba', 'global-hijaiyah-01', 'pilihan_ganda', 'Pilih huruf Ba', '["ا","ب","ت","ث"]', 'ب', 1),
  ('hijaiyah-02-ta', 'global-hijaiyah-01', 'pilihan_ganda', 'Pilih huruf Ta', '["ج","ح","ت","خ"]', 'ت', 2),
  ('hijaiyah-03-jim', 'global-hijaiyah-01', 'pilihan_ganda', 'Pilih huruf Jim', '["ج","د","ذ","ر"]', 'ج', 3),
  ('hijaiyah-04-sin', 'global-hijaiyah-01', 'pilihan_ganda', 'Pilih huruf Sin', '["س","ش","ص","ض"]', 'س', 4),
  ('hijaiyah-05-mim', 'global-hijaiyah-01', 'pilihan_ganda', 'Pilih huruf Mim', '["ف","ق","م","ن"]', 'م', 5),
  ('mufrodat-01-bait', 'global-mufrodat-01', 'cocokkan', 'بيت', '["rumah","air","buku","pintu"]', 'rumah', 1),
  ('mufrodat-02-maa', 'global-mufrodat-01', 'cocokkan', 'ماء', '["pena","air","rumah","buku"]', 'air', 2),
  ('mufrodat-03-kitab', 'global-mufrodat-01', 'cocokkan', 'كتاب', '["pintu","pena","buku","air"]', 'buku', 3),
  ('mufrodat-04-qalam', 'global-mufrodat-01', 'cocokkan', 'قلم', '["buku","pena","rumah","pintu"]', 'pena', 4),
  ('mufrodat-05-baab', 'global-mufrodat-01', 'cocokkan', 'باب', '["air","pintu","pena","buku"]', 'pintu', 5),
  ('nahwu-01-kitab', 'global-nahwu-01', 'pilihan_ganda', 'Tentukan jenis kata yang ditanya: كتاب', '["Isim","Fi''il","Huruf","Jumlah"]', 'Isim', 1),
  ('nahwu-02-kataba', 'global-nahwu-01', 'pilihan_ganda', 'Tentukan jenis kata yang ditanya: كَتَبَ', '["Isim","Fi''il","Huruf","Sifat"]', 'Fi''il', 2),
  ('nahwu-03-masjid', 'global-nahwu-01', 'pilihan_ganda', 'Tentukan jenis kata yang ditanya: مسجد', '["Fi''il","Isim","Huruf","Dhamir"]', 'Isim', 3),
  ('nahwu-04-yaktubu', 'global-nahwu-01', 'pilihan_ganda', 'Tentukan jenis kata yang ditanya: يَكْتُبُ', '["Isim","Fi''il","Huruf","Jar"]', 'Fi''il', 4),
  ('nahwu-05-talib', 'global-nahwu-01', 'pilihan_ganda', 'Tentukan jenis kata yang ditanya: طالب', '["Fi''il","Huruf","Isim","Jumlah"]', 'Isim', 5),
  ('shorof-01-faala', 'global-shorof-01', 'isi_titik', 'Lengkapi mudhari dari فَعَلَ: ____', NULL, 'يَفْعَلُ', 1),
  ('shorof-02-nashara', 'global-shorof-01', 'isi_titik', 'Lengkapi mudhari dari نَصَرَ: ____', NULL, 'يَنْصُرُ', 2),
  ('shorof-03-dharaba', 'global-shorof-01', 'isi_titik', 'Lengkapi mudhari dari ضَرَبَ: ____', NULL, 'يَضْرِبُ', 3),
  ('shorof-04-fatha', 'global-shorof-01', 'isi_titik', 'Lengkapi masdar dari فَتَحَ: ____', NULL, 'فَتْحٌ', 4),
  ('shorof-05-ilm', 'global-shorof-01', 'isi_titik', 'Lengkapi masdar dari عَلِمَ: ____', NULL, 'عِلْمٌ', 5);
`;

const readInt = (value: unknown, fallback = 0) => {
	const number = Number(value);
	return Number.isFinite(number) ? number : fallback;
};

const parseOptions = (pilihan: string | null) => {
	if (!pilihan) return [];
	try {
		const parsed = JSON.parse(pilihan);
		if (!Array.isArray(parsed)) return [];
		return parsed.map((item) => String(item));
	} catch {
		return [];
	}
};

const answerKeys = ['a', 'b', 'c', 'd'] as const;
type AnswerKey = (typeof answerKeys)[number];

const isAnswerKey = (value: string): value is AnswerKey =>
	answerKeys.includes(value.toLowerCase() as AnswerKey);

const optionByKey = (question: Pick<LearnQuestion, 'pilihanA' | 'pilihanB' | 'pilihanC' | 'pilihanD'>, key: string) => {
	switch (key.toLowerCase()) {
		case 'a':
			return question.pilihanA ?? '';
		case 'b':
			return question.pilihanB ?? '';
		case 'c':
			return question.pilihanC ?? '';
		case 'd':
			return question.pilihanD ?? '';
		default:
			return '';
	}
};

const mapModule = (row: LearnModuleRow): LearnModule => ({
	id: row.id,
	lembagaId: row.lembagaId ?? null,
	judul: row.judul,
	deskripsi: row.deskripsi ?? null,
	kategori: row.kategori,
	urutan: readInt(row.urutan),
	isAktif: readInt(row.isAktif, 1),
	totalSoal: readInt(row.totalSoal),
	soalSelesai: readInt(row.soalSelesai),
	xp: readInt(row.xp),
	streakHari: readInt(row.streakHari),
	lastBelajar: row.lastBelajar ? readInt(row.lastBelajar) : null,
	status: row.status ?? 'belum',
	locked: false
});

const mapQuestion = (row: LearnQuestionRow): LearnQuestion => {
	const structuredOptions = [row.pilihanA, row.pilihanB, row.pilihanC, row.pilihanD].filter(
		(option): option is string => Boolean(option)
	);
	const options = structuredOptions.length ? structuredOptions : parseOptions(row.pilihan ?? null);
	const normalizedKey = row.jawabanBenar.toLowerCase();
	const answerKey = isAnswerKey(normalizedKey) ? normalizedKey : null;
	const question = {
		id: row.id,
		modulId: row.modulId,
		tipe: row.tipe,
		pertanyaan: row.pertanyaan,
		pilihan: row.pilihan ?? null,
		pilihanA: row.pilihanA ?? null,
		pilihanB: row.pilihanB ?? null,
		pilihanC: row.pilihanC ?? null,
		pilihanD: row.pilihanD ?? null,
		jawabanBenar: row.jawabanBenar,
		penjelasan: row.penjelasan ?? null,
		audioUrl: row.audioUrl ?? null,
		urutan: readInt(row.urutan),
		options,
		answerKey,
		correctAnswerText: row.jawabanBenar
	};

	return {
		...question,
		correctAnswerText: answerKey ? optionByKey(question, answerKey) : row.jawabanBenar
	};
};

const normalizeAnswer = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g, '')
		.replace(/\u0640/g, '')
		.replace(/\s+/g, ' ');

const resolveQuestionAnswer = (
	question: Pick<LearnQuestion, 'jawabanBenar' | 'pilihanA' | 'pilihanB' | 'pilihanC' | 'pilihanD'>
) => {
	const key = question.jawabanBenar.toLowerCase();
	const answerKey = isAnswerKey(key) ? key : null;
	const keyedText = answerKey ? optionByKey(question, answerKey) : '';
	return {
		answerKey,
		correctAnswerText: keyedText || question.jawabanBenar
	};
};

const isCorrectQuestionAnswer = (
	question: Pick<LearnQuestion, 'jawabanBenar' | 'pilihanA' | 'pilihanB' | 'pilihanC' | 'pilihanD'>,
	answer: string
) => {
	const { answerKey, correctAnswerText } = resolveQuestionAnswer(question);
	const normalizedAnswer = normalizeAnswer(answer);
	if (answerKey && normalizedAnswer === answerKey) return true;
	return normalizedAnswer === normalizeAnswer(correctAnswerText);
};

const jakartaDayNumber = (timestamp: number) => {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Jakarta',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(new Date(timestamp));
	const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
	const month = parts.find((part) => part.type === 'month')?.value ?? '01';
	const day = parts.find((part) => part.type === 'day')?.value ?? '01';
	return Math.floor(Date.parse(`${year}-${month}-${day}T00:00:00+07:00`) / 86_400_000);
};

const nextStreak = (previousLastBelajar: number | null, previousStreak: number, now: number) => {
	if (!previousLastBelajar) return 1;

	const today = jakartaDayNumber(now);
	const previous = jakartaDayNumber(previousLastBelajar);
	if (previous === today) return Math.max(previousStreak, 1);
	if (previous === today - 1) return Math.max(previousStreak, 0) + 1;
	return 1;
};

const withLocks = (modules: LearnModule[]) =>
	modules.map((module, index) => ({
		...module,
		locked: index > 0 && modules[index - 1]?.status !== 'selesai'
	}));

export const ensureSantriLearnSchema = async (db: D1Database) => {
	await db.exec(SANTRI_LEARN_SCHEMA_SQL);
};

export const requireSantriLearnContext = async (locals: App.Locals): Promise<LearnContext> => {
	const user = assertLoggedIn({ locals });
	const db = locals.db;
	if (!db) throw error(500, 'Layanan data tidak tersedia');

	const role = normalizeRole(user.role);
	if (!role || !ALLOWED_ROLES.has(role)) {
		throw error(403, 'Fitur belajar tidak tersedia untuk role ini.');
	}

	const lembagaId = assertOrgMember(user);
	const org = await getOrganizationById(db, lembagaId);
	if (!org) throw error(404, 'Lembaga tidak ditemukan');
	assertFeature(org.type, user.role, 'hafalan');

	return { db, user, lembagaId };
};

export const listLearnModules = async (
	db: D1Database,
	lembagaId: string,
	userId: string
): Promise<LearnModule[]> => {
	const { results } = await db
		.prepare(
			`SELECT
				m.id,
				m.lembaga_id AS lembagaId,
				m.judul,
				m.deskripsi,
				m.kategori,
				m.urutan,
				m.is_aktif AS isAktif,
				COUNT(s.id) AS totalSoal,
				COALESCE(p.soal_selesai, 0) AS soalSelesai,
				COALESCE(p.xp, 0) AS xp,
				COALESCE(p.streak_hari, 0) AS streakHari,
				p.last_belajar AS lastBelajar,
				COALESCE(p.status, 'belum') AS status
			 FROM learn_modul m
			 LEFT JOIN learn_soal s ON s.modul_id = m.id
			 LEFT JOIN learn_progress p ON p.user_id = ? AND p.modul_id = m.id
			 WHERE (m.lembaga_id IS NULL OR m.lembaga_id = ?)
			   AND COALESCE(m.is_aktif, 1) = 1
			 GROUP BY m.id
			 ORDER BY m.urutan ASC, m.created_at ASC`
		)
		.bind(userId, lembagaId)
		.all<LearnModuleRow>();

	return withLocks((results ?? []).map(mapModule));
};

export const getLearnSummary = async (
	db: D1Database,
	userId: string
): Promise<LearnSummary> => {
	const row = await db
		.prepare(
			`SELECT
				COALESCE(SUM(xp), 0) AS totalXp,
				COALESCE((
					SELECT latest.streak_hari
					FROM learn_progress latest
					WHERE latest.user_id = ?
					ORDER BY COALESCE(latest.last_belajar, 0) DESC
					LIMIT 1
				), 0) AS streakHari,
				MAX(last_belajar) AS lastBelajar
			 FROM learn_progress
			 WHERE user_id = ?`
		)
		.bind(userId, userId)
		.first<{ totalXp: number; streakHari: number; lastBelajar: number | null }>();

	const totalXp = readInt(row?.totalXp);
	const lastBelajar = row?.lastBelajar ? readInt(row.lastBelajar) : null;
	const streakHari =
		lastBelajar && jakartaDayNumber(lastBelajar) >= jakartaDayNumber(Date.now()) - 1
			? readInt(row?.streakHari)
			: 0;

	return { totalXp, streakHari };
};

export const listLearnBadges = async (
	db: D1Database,
	userId: string,
	lembagaId: string
): Promise<LearnBadge[]> => {
	const { results } = await db
		.prepare(
			`SELECT id, tipe, diraih_at AS diraihAt
			 FROM learn_badge
			 WHERE user_id = ? AND (lembaga_id = ? OR lembaga_id IS NULL)
			 ORDER BY diraih_at DESC`
		)
		.bind(userId, lembagaId)
		.all<{ id: string; tipe: string; diraihAt: number | null }>();

	return (results ?? []).map((badge) => ({
		id: badge.id,
		tipe: badge.tipe,
		label:
			Object.values(BADGE_BY_CATEGORY).find((definition) => definition?.tipe === badge.tipe)?.label ??
			badge.tipe,
		diraihAt: badge.diraihAt ?? null
	}));
};

export const getLearnModule = async (
	db: D1Database,
	lembagaId: string,
	modulId: string,
	userId: string
) => {
	const row = await db
		.prepare(
			`SELECT
				m.id,
				m.lembaga_id AS lembagaId,
				m.judul,
				m.deskripsi,
				m.kategori,
				m.urutan,
				m.is_aktif AS isAktif,
				COUNT(s.id) AS totalSoal,
				COALESCE(p.soal_selesai, 0) AS soalSelesai,
				COALESCE(p.xp, 0) AS xp,
				COALESCE(p.streak_hari, 0) AS streakHari,
				p.last_belajar AS lastBelajar,
				COALESCE(p.status, 'belum') AS status
			 FROM learn_modul m
			 LEFT JOIN learn_soal s ON s.modul_id = m.id
			 LEFT JOIN learn_progress p ON p.user_id = ? AND p.modul_id = m.id
			 WHERE m.id = ?
			   AND (m.lembaga_id IS NULL OR m.lembaga_id = ?)
			   AND COALESCE(m.is_aktif, 1) = 1
			 GROUP BY m.id`
		)
		.bind(userId, modulId, lembagaId)
		.first<LearnModuleRow>();

	return row ? mapModule(row) : null;
};

export const listLearnQuestions = async (
	db: D1Database,
	modulId: string
): Promise<LearnQuestion[]> => {
	const { results } = await db
		.prepare(
			`SELECT
				id,
				modul_id AS modulId,
				tipe,
				pertanyaan,
				pilihan,
				pilihan_a AS pilihanA,
				pilihan_b AS pilihanB,
				pilihan_c AS pilihanC,
				pilihan_d AS pilihanD,
				jawaban_benar AS jawabanBenar,
				penjelasan,
				audio_url AS audioUrl,
				urutan
			 FROM learn_soal
			 WHERE modul_id = ?
			 ORDER BY urutan ASC`
		)
		.bind(modulId)
		.all<LearnQuestionRow>();

	return (results ?? []).map(mapQuestion);
};

export const answerLearnQuestion = async (
	db: D1Database,
	params: {
		userId: string;
		lembagaId: string;
		soalId: string;
		jawaban: string;
	}
) => {
	const question = await db
		.prepare(
			`SELECT
				s.id,
				s.modul_id AS modulId,
				s.tipe,
				s.pertanyaan,
				s.pilihan,
				s.pilihan_a AS pilihanA,
				s.pilihan_b AS pilihanB,
				s.pilihan_c AS pilihanC,
				s.pilihan_d AS pilihanD,
				s.jawaban_benar AS jawabanBenar,
				s.penjelasan,
				s.audio_url AS audioUrl,
				s.urutan,
				m.kategori,
				m.judul
			 FROM learn_soal s
			 JOIN learn_modul m ON m.id = s.modul_id
			 WHERE s.id = ?
			   AND (m.lembaga_id IS NULL OR m.lembaga_id = ?)
			   AND COALESCE(m.is_aktif, 1) = 1`
		)
		.bind(params.soalId, params.lembagaId)
		.first<LearnQuestionRow & { kategori: LearnCategory; judul: string }>();

	if (!question) {
		throw error(404, 'Soal tidak ditemukan');
	}

	const modules = await listLearnModules(db, params.lembagaId, params.userId);
	const moduleState = modules.find((module) => module.id === question.modulId);
	if (!moduleState || moduleState.locked) {
		throw error(403, 'Modul belajar masih terkunci.');
	}

	const now = Date.now();
	const isBenar = isCorrectQuestionAnswer(question, params.jawaban);
	const previousCorrect = await db
		.prepare(
			`SELECT id
			 FROM learn_jawaban
			 WHERE user_id = ? AND soal_id = ? AND is_benar = 1
			 LIMIT 1`
		)
		.bind(params.userId, params.soalId)
		.first<{ id: string }>();
	const progress =
		(await db
			.prepare(
				`SELECT
					id,
					user_id AS userId,
					modul_id AS modulId,
					soal_selesai AS soalSelesai,
					xp,
					streak_hari AS streakHari,
					last_belajar AS lastBelajar,
					status
				 FROM learn_progress
				 WHERE user_id = ? AND modul_id = ?`
			)
			.bind(params.userId, question.modulId)
			.first<ProgressRow>()) ?? {
			id: crypto.randomUUID(),
			userId: params.userId,
			modulId: question.modulId,
			soalSelesai: 0,
			xp: 0,
			streakHari: 0,
			lastBelajar: null,
			status: 'belum'
		};
	const userStreak = await db
		.prepare(
			`SELECT
				COALESCE(streak_hari, 0) AS streakHari,
				last_belajar AS lastBelajar
			 FROM learn_progress
			 WHERE user_id = ?
			 ORDER BY COALESCE(last_belajar, 0) DESC
			 LIMIT 1`
		)
		.bind(params.userId)
		.first<{ streakHari: number; lastBelajar: number | null }>();

	await db
		.prepare(
			`INSERT INTO learn_jawaban (id, user_id, soal_id, jawaban, is_benar, waktu_jawab)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(crypto.randomUUID(), params.userId, params.soalId, params.jawaban, isBenar ? 1 : 0, now)
		.run();

	const totalSoal = await db
		.prepare('SELECT COUNT(*) AS total FROM learn_soal WHERE modul_id = ?')
		.bind(question.modulId)
		.first<{ total: number }>();
	const answeredSoal = await db
		.prepare(
			`SELECT COUNT(DISTINCT lj.soal_id) AS total
			 FROM learn_jawaban lj
			 JOIN learn_soal s ON s.id = lj.soal_id
			 WHERE lj.user_id = ? AND s.modul_id = ?`
		)
		.bind(params.userId, question.modulId)
		.first<{ total: number }>();

	const total = readInt(totalSoal?.total);
	const soalSelesai = Math.min(readInt(answeredSoal?.total), total);
	const modulSelesai = total > 0 && soalSelesai >= total;
	const xpJawaban = isBenar && !previousCorrect ? 10 : 0;
	const xpBonus = modulSelesai && progress.status !== 'selesai' ? 50 : 0;
	const xpDidapat = xpJawaban + xpBonus;
	const xpTotal = readInt(progress.xp) + xpDidapat;
	const streakHari = nextStreak(
		userStreak?.lastBelajar ? readInt(userStreak.lastBelajar) : null,
		readInt(userStreak?.streakHari),
		now
	);
	const status = modulSelesai ? 'selesai' : soalSelesai > 0 ? 'proses' : 'belum';

	await db
		.prepare(
			`INSERT INTO learn_progress
				(id, user_id, modul_id, soal_selesai, xp, streak_hari, last_belajar, status)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(user_id, modul_id) DO UPDATE SET
				soal_selesai = excluded.soal_selesai,
				xp = excluded.xp,
				streak_hari = excluded.streak_hari,
				last_belajar = excluded.last_belajar,
				status = excluded.status`
		)
		.bind(
			progress.id,
			params.userId,
			question.modulId,
			soalSelesai,
			xpTotal,
			streakHari,
			now,
			status
		)
		.run();

	let badgeBaru: string | null = null;
	const badgeDefinition = BADGE_BY_CATEGORY[question.kategori];
	if (modulSelesai && badgeDefinition) {
		const existingBadge = await db
			.prepare(
				`SELECT id
				 FROM learn_badge
				 WHERE user_id = ? AND lembaga_id = ? AND tipe = ?
				 LIMIT 1`
			)
			.bind(params.userId, params.lembagaId, badgeDefinition.tipe)
			.first<{ id: string }>();

		if (!existingBadge) {
			await db
				.prepare(
					`INSERT INTO learn_badge (id, user_id, lembaga_id, tipe, diraih_at)
					 VALUES (?, ?, ?, ?, ?)`
				)
				.bind(crypto.randomUUID(), params.userId, params.lembagaId, badgeDefinition.tipe, now)
				.run();
			badgeBaru = badgeDefinition.label;
		}
	}

	const summary = await getLearnSummary(db, params.userId);

	return {
		is_benar: isBenar,
		xp_total: summary.totalXp,
		xp_didapat: xpDidapat,
		soal_selesai: soalSelesai,
		total_soal: total,
		status,
		modul_selesai: modulSelesai,
		badge_baru: badgeBaru
	};
};

export const saveLearnProgressAnswer = async (
	db: D1Database,
	params: {
		userId: string;
		lembagaId: string;
		modulId: string;
		soalId: string;
		jawaban: string;
	}
) => {
	const question = await db
		.prepare(
			`SELECT
				s.id,
				s.modul_id AS modulId,
				s.tipe,
				s.pertanyaan,
				s.pilihan,
				s.pilihan_a AS pilihanA,
				s.pilihan_b AS pilihanB,
				s.pilihan_c AS pilihanC,
				s.pilihan_d AS pilihanD,
				s.jawaban_benar AS jawabanBenar,
				s.penjelasan,
				s.audio_url AS audioUrl,
				s.urutan,
				m.kategori,
				m.judul
			 FROM learn_soal s
			 JOIN learn_modul m ON m.id = s.modul_id
			 WHERE s.id = ?
			   AND s.modul_id = ?
			   AND (m.lembaga_id IS NULL OR m.lembaga_id = ?)
			   AND COALESCE(m.is_aktif, 1) = 1`
		)
		.bind(params.soalId, params.modulId, params.lembagaId)
		.first<LearnQuestionRow & { kategori: LearnCategory; judul: string }>();

	if (!question) {
		throw error(404, 'Soal tidak ditemukan');
	}

	const modules = await listLearnModules(db, params.lembagaId, params.userId);
	const moduleState = modules.find((module) => module.id === question.modulId);
	if (!moduleState || moduleState.locked) {
		throw error(403, 'Modul belajar masih terkunci.');
	}

	const now = Date.now();
	const isBenar = isCorrectQuestionAnswer(question, params.jawaban);
	const previousAnswer = await db
		.prepare(
			`SELECT id
			 FROM learn_jawaban
			 WHERE user_id = ? AND soal_id = ?
			 LIMIT 1`
		)
		.bind(params.userId, params.soalId)
		.first<{ id: string }>();
	const progress =
		(await db
			.prepare(
				`SELECT
					id,
					user_id AS userId,
					modul_id AS modulId,
					soal_selesai AS soalSelesai,
					xp,
					streak_hari AS streakHari,
					last_belajar AS lastBelajar,
					status
				 FROM learn_progress
				 WHERE user_id = ? AND modul_id = ?`
			)
			.bind(params.userId, question.modulId)
			.first<ProgressRow>()) ?? {
			id: crypto.randomUUID(),
			userId: params.userId,
			modulId: question.modulId,
			soalSelesai: 0,
			xp: 0,
			streakHari: 0,
			lastBelajar: null,
			status: 'belum'
		};
	const userStreak = await db
		.prepare(
			`SELECT
				COALESCE(streak_hari, 0) AS streakHari,
				last_belajar AS lastBelajar
			 FROM learn_progress
			 WHERE user_id = ?
			 ORDER BY COALESCE(last_belajar, 0) DESC
			 LIMIT 1`
		)
		.bind(params.userId)
		.first<{ streakHari: number; lastBelajar: number | null }>();

	await db
		.prepare(
			`INSERT INTO learn_jawaban (id, user_id, soal_id, jawaban, is_benar, waktu_jawab)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(crypto.randomUUID(), params.userId, params.soalId, params.jawaban, isBenar ? 1 : 0, now)
		.run();

	const totalSoal = await db
		.prepare('SELECT COUNT(*) AS total FROM learn_soal WHERE modul_id = ?')
		.bind(question.modulId)
		.first<{ total: number }>();
	const answeredSoal = await db
		.prepare(
			`SELECT COUNT(DISTINCT lj.soal_id) AS total
			 FROM learn_jawaban lj
			 JOIN learn_soal s ON s.id = lj.soal_id
			 WHERE lj.user_id = ? AND s.modul_id = ?`
		)
		.bind(params.userId, question.modulId)
		.first<{ total: number }>();

	const total = readInt(totalSoal?.total);
	const soalSelesai = Math.min(readInt(answeredSoal?.total), total);
	const modulSelesai = total > 0 && soalSelesai >= total;
	const xpDidapat = previousAnswer ? 0 : isBenar ? 10 : 2;
	const xpTotal = readInt(progress.xp) + xpDidapat;
	const streakHari = nextStreak(
		userStreak?.lastBelajar ? readInt(userStreak.lastBelajar) : null,
		readInt(userStreak?.streakHari),
		now
	);
	const status = modulSelesai ? 'selesai' : soalSelesai > 0 ? 'proses' : 'belum';

	await db
		.prepare(
			`INSERT INTO learn_progress
				(id, user_id, modul_id, soal_selesai, xp, streak_hari, last_belajar, status)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(user_id, modul_id) DO UPDATE SET
				soal_selesai = excluded.soal_selesai,
				xp = excluded.xp,
				streak_hari = excluded.streak_hari,
				last_belajar = excluded.last_belajar,
				status = excluded.status`
		)
		.bind(
			progress.id,
			params.userId,
			question.modulId,
			soalSelesai,
			xpTotal,
			streakHari,
			now,
			status
		)
		.run();

	const summary = await getLearnSummary(db, params.userId);

	return {
		is_benar: isBenar,
		xp_didapat: xpDidapat,
		xp_total: summary.totalXp,
		soal_selesai: soalSelesai,
		total_soal: total,
		status,
		modul_selesai: modulSelesai,
		penjelasan: question.penjelasan ?? null,
		jawaban_benar: question.jawabanBenar,
		jawaban_teks: resolveQuestionAnswer(question).correctAnswerText
	};
};

export const getLearnLeaderboard = async (
	db: D1Database,
	lembagaId: string,
	currentUserId: string
): Promise<LearnLeaderboardRow[]> => {
	const { results } = await db
		.prepare(
			`SELECT
				u.id AS userId,
				COALESCE(NULLIF(u.username, ''), u.email, 'Santri') AS nama,
				COALESCE(progress.totalXp, 0) AS totalXp,
				COALESCE(progress.streakHari, 0) AS streakHari,
				progress.lastBelajar AS lastBelajar,
				COALESCE(badges.badgeCount, 0) AS badgeCount
			 FROM users u
			 LEFT JOIN (
				SELECT
					lp.user_id,
					SUM(lp.xp) AS totalXp,
					COALESCE((
						SELECT latest.streak_hari
						FROM learn_progress latest
						WHERE latest.user_id = lp.user_id
						ORDER BY COALESCE(latest.last_belajar, 0) DESC
						LIMIT 1
					), 0) AS streakHari,
					MAX(lp.last_belajar) AS lastBelajar
				FROM learn_progress
				lp
				GROUP BY lp.user_id
			 ) progress ON progress.user_id = u.id
			 LEFT JOIN (
				SELECT user_id, COUNT(*) AS badgeCount
				FROM learn_badge
				WHERE lembaga_id = ? OR lembaga_id IS NULL
				GROUP BY user_id
			 ) badges ON badges.user_id = u.id
			 WHERE u.org_id = ?
			   AND u.role IN ('santri', 'alumni')
			 ORDER BY totalXp DESC, streakHari DESC, nama COLLATE NOCASE ASC
			 LIMIT 10`
		)
		.bind(lembagaId, lembagaId)
		.all<Omit<LearnLeaderboardRow, 'rank' | 'isCurrentUser'> & { lastBelajar: number | null }>();

	return (results ?? []).map((row, index) => {
		const lastBelajar = row.lastBelajar ? readInt(row.lastBelajar) : null;
		const streakHari =
			lastBelajar && jakartaDayNumber(lastBelajar) >= jakartaDayNumber(Date.now()) - 1
				? readInt(row.streakHari)
				: 0;

		return {
			rank: index + 1,
			userId: row.userId,
			nama: row.nama,
			totalXp: readInt(row.totalXp),
			streakHari,
			badgeCount: readInt(row.badgeCount),
			isCurrentUser: row.userId === currentUserId
		};
	});
};

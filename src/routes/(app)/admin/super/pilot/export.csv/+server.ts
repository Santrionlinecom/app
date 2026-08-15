import type { RequestHandler } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { getPilotMonitor, listPilotParticipants } from '$lib/server/habit/pilot';

const escapeCsv = (value: unknown): string => {
	const text = value == null ? '' : String(value);
	if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
	return text;
};

const trendLabel: Record<string, string> = {
	membaik: 'Membaik',
	stabil: 'Stabil',
	perlu_pendampingan: 'Perlu Pendampingan'
};

const guardianLabel: Record<string, string> = {
	sesuai_pantauan: 'Sesuai pantauan',
	perlu_dibicarakan: 'Perlu dibicarakan',
	belum_sempat: 'Belum sempat'
};

export const GET: RequestHandler = async ({ locals }) => {
	const { db } = requireSuperAdmin(locals);
	const participants = await listPilotParticipants(db);

	const missionsOf = new Map<string, string[]>();
	for (const participant of participants) {
		const monitor = await getPilotMonitor(db, participant);
		missionsOf.set(participant.id, monitor.missions.map((m) => m.title));
	}

	const rows: Array<Array<string | number | null>> = [];
	// Header: kolom dasar + 4 kolom per misi + konfirmasi ortu
	const base = [
		'Username',
		'Email',
		'Label',
		'Status',
		'Tanggal Mulai',
		'Tanggal Selesai',
		'Hari Berjalan',
		'Hari Total'
	];
	const missionCount = Math.max(0, ...participants.map((p) => (missionsOf.get(p.id) ?? []).length));
	const missionCols: string[] = [];
	for (let i = 0; i < missionCount; i += 1) {
		missionCols.push(
			`Misi ${i + 1}`,
			`Misi ${i + 1} - Hari Tercatat`,
			`Misi ${i + 1} - Total Hari`,
			`Misi ${i + 1} - Streak`,
			`Misi ${i + 1} - Tren`
		);
	}
	rows.push([...base, ...missionCols, 'Konfirmasi Orang Tua (Mingguan)']);

	for (const participant of participants) {
		const monitor = await getPilotMonitor(db, participant);
		const missionRows = monitor.missions.map((m) => [
			m.title,
			m.metDays,
			m.totalDays,
			m.currentStreak,
			trendLabel[m.trend]
		]);
		const row: Array<string | number | null> = [
			participant.userUsername,
			participant.userEmail,
			participant.label,
			participant.active ? 'Aktif' : 'Nonaktif',
			participant.startDate,
			participant.endDate,
			monitor.elapsedDays,
			monitor.totalWindowDays
		];
		for (const mission of missionRows) row.push(...mission);
		for (let i = missionRows.length; i < missionCount; i += 1) {
			row.push('', '', '', '', '');
		}
		const confirmations = monitor.guardianConfirmations
			.map((c) => `${c.weekStart}: ${guardianLabel[c.confirmation] ?? c.confirmation}${c.note ? ` (${c.note})` : ''}`)
			.join('; ');
		row.push(confirmations);
		rows.push(row);
	}

	const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
	return new Response(`\uFEFF${csv}\r\n`, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': 'attachment; filename="pilot-habit-laporan.csv"',
			'cache-control': 'private, no-store'
		}
	});
};

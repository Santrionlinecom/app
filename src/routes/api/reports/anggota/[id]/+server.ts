import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getOrgScope, getOrganizationById, memberRoleByType } from '$lib/server/organizations';
import { getSantriChecklist, getSantriStats } from '$lib/server/progress';
import { SURAH_DATA } from '$lib/surah-data';

const managerRoles = ['admin', 'SUPER_ADMIN', 'ustadz', 'ustadzah', 'tamir', 'bendahara'] as const;
const TOTAL_AYAH = 6236;

const ensureAuth = (locals: App.Locals) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
};

const formatDate = (value?: string | number | null, opts?: Intl.DateTimeFormatOptions) => {
	if (!value) return '-';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '-';
	return date.toLocaleDateString('id-ID', opts ?? { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);

const slugify = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)+/g, '')
		.slice(0, 60) || 'anggota';

const mapQualityLabel = (value?: string | null) => {
	if (!value) return '-';
	if (value === 'merah') return 'Merah';
	if (value === 'kuning') return 'Kuning';
	if (value === 'hijau') return 'Hijau';
	return value;
};

const mapStatusLabel = (value?: string | null) => {
	if (value === 'disetujui') return 'Disetujui';
	if (value === 'setor') return 'Setor';
	return value || '-';
};

type ReportMember = {
	id: string;
	username: string | null;
	email: string;
	role: string;
	orgId: string | null;
	orgStatus: string | null;
	createdAt: number | string;
};

type ReportOrg = {
	id: string;
	name: string;
	type: string;
	slug: string;
	address: string | null;
	city: string | null;
};

type ReportStats = {
	totalSetor: number;
	totalDisetujui: number;
	totalSessions: number;
	firstDate: string | null;
	lastDate: string | null;
	durationDays: number;
};

type SurahRow = {
	surahNumber: number;
	name: string;
	totalAyah: number;
	setor: number;
	disetujui: number;
};

type RecentRow = {
	surahNumber: number;
	ayahNumber: number;
	status: string;
	qualityStatus: string | null;
	tanggalSetor: string | null;
	tanggalApprove: string | null;
};

const buildMemberReportPdf = async (params: {
	member: ReportMember;
	org: ReportOrg;
	memberLabel: string;
	stats: ReportStats;
	checklist: SurahRow[];
	recent: RecentRow[];
}) => {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

	const pageWidth = 595;
	const pageHeight = 842;
	const marginX = 40;
	const marginBottom = 40;
	const headerHeight = 86;
	const contentWidth = pageWidth - marginX * 2;
	const headerColor = rgb(0.12, 0.32, 0.5);
	const labelColor = rgb(0.35, 0.39, 0.44);
	const textColor = rgb(0.12, 0.14, 0.16);

	const reportTitle =
		params.memberLabel === 'Jamaah' ? 'Laporan Aktivitas Jamaah' : 'Laporan Perkembangan Santri';
	const reportDate = formatDate(Date.now(), {
		day: '2-digit',
		month: 'long',
		year: 'numeric'
	});

	const drawHeader = (page: import('pdf-lib').PDFPage, continued = false) => {
		page.drawRectangle({
			x: marginX,
			y: pageHeight - headerHeight - 24,
			width: contentWidth,
			height: headerHeight,
			color: headerColor,
			opacity: 0.96
		});
		page.drawText(continued ? `${reportTitle} (Lanjutan)` : reportTitle, {
			x: marginX + 16,
			y: pageHeight - 56,
			size: 18,
			font: bold,
			color: rgb(1, 1, 1)
		});
		page.drawText(`${params.org.name} - ${params.org.type.toUpperCase()}`, {
			x: marginX + 16,
			y: pageHeight - 78,
			size: 10,
			font,
			color: rgb(0.9, 0.95, 1)
		});
		page.drawText(`Tanggal: ${reportDate}`, {
			x: pageWidth - marginX - 160,
			y: pageHeight - 56,
			size: 9,
			font,
			color: rgb(0.95, 0.97, 1)
		});
		return pageHeight - headerHeight - 44;
	};

	const drawSectionTitle = (page: import('pdf-lib').PDFPage, title: string, y: number) => {
		page.drawText(title, { x: marginX, y, size: 12, font: bold, color: textColor });
		return y - 16;
	};

	const drawLabelValue = (
		page: import('pdf-lib').PDFPage,
		label: string,
		value: string,
		x: number,
		y: number
	) => {
		page.drawText(label, { x, y, size: 9, font, color: labelColor });
		page.drawText(value || '-', { x, y: y - 13, size: 11, font: bold, color: textColor });
		return y - 26;
	};

	const addPage = (continued = false) => {
		const page = pdf.addPage([pageWidth, pageHeight]);
		let cursorY = drawHeader(page, continued);
		cursorY -= 10;
		return { page, cursorY };
	};

	let { page, cursorY } = addPage(false);

	cursorY = drawSectionTitle(page, 'Identitas Anggota', cursorY);
	const leftX = marginX;
	const rightX = marginX + contentWidth / 2 + 10;
	const startY = cursorY;

	const memberName = params.member.username || params.member.email;
	const memberRole = params.memberLabel;
	const memberStatus = params.member.orgStatus === 'pending' ? 'Menunggu' : 'Aktif';

	let leftY = startY;
	leftY = drawLabelValue(page, 'Nama', memberName, leftX, leftY);
	leftY = drawLabelValue(page, 'Email', params.member.email, leftX, leftY);
	leftY = drawLabelValue(page, 'Role', memberRole, leftX, leftY);

	let rightY = startY;
	rightY = drawLabelValue(page, 'Status Keanggotaan', memberStatus, rightX, rightY);
	rightY = drawLabelValue(page, 'Tanggal Bergabung', formatDate(params.member.createdAt), rightX, rightY);
	rightY = drawLabelValue(
		page,
		'Lembaga',
		`${params.org.name}${params.org.city ? `, ${params.org.city}` : ''}`,
		rightX,
		rightY
	);

	cursorY = Math.min(leftY, rightY) - 4;

	if (cursorY - 90 < marginBottom) {
		({ page, cursorY } = addPage(true));
	}
	cursorY = drawSectionTitle(page, 'Ringkasan Capaian', cursorY);

	const stats = [
		{ label: 'Total Setoran', value: formatNumber(params.stats.totalSetor) },
		{ label: 'Total Disetujui', value: formatNumber(params.stats.totalDisetujui) },
		{ label: 'Sesi Belajar', value: formatNumber(params.stats.totalSessions) },
		{ label: 'Durasi', value: `${formatNumber(params.stats.durationDays)} hari` }
	];

	const boxGap = 10;
	const boxHeight = 52;
	const boxWidth = (contentWidth - boxGap * 3) / 4;

	stats.forEach((item, idx) => {
		const x = marginX + idx * (boxWidth + boxGap);
		page.drawRectangle({
			x,
			y: cursorY - boxHeight + 6,
			width: boxWidth,
			height: boxHeight,
			color: rgb(0.95, 0.97, 0.99)
		});
		page.drawText(item.label, { x: x + 10, y: cursorY + 6, size: 9, font, color: labelColor });
		page.drawText(item.value, { x: x + 10, y: cursorY - 14, size: 14, font: bold, color: textColor });
	});

	cursorY -= boxHeight + 12;

	const activeSurah = params.checklist.filter((row) => row.setor > 0 || row.disetujui > 0);
	const progressPercent = params.stats.totalDisetujui ? (params.stats.totalDisetujui / TOTAL_AYAH) * 100 : 0;
	page.drawText(
		`Surah aktif: ${formatNumber(activeSurah.length)} - Persentase disetujui: ${progressPercent.toFixed(2)}%`,
		{ x: marginX, y: cursorY, size: 9, font, color: labelColor }
	);
	cursorY -= 14;
	const periodLabel =
		params.stats.firstDate && params.stats.lastDate
			? `${formatDate(params.stats.firstDate)} - ${formatDate(params.stats.lastDate)}`
			: '-';
	page.drawText(`Periode belajar: ${periodLabel}`, { x: marginX, y: cursorY, size: 9, font, color: labelColor });
	cursorY -= 18;

	const drawTable = (opts: {
		title: string;
		columns: { label: string; width: number; align?: 'left' | 'right' | 'center' }[];
		rows: string[][];
		cursorY: number;
		page: import('pdf-lib').PDFPage;
	}) => {
		const rowHeight = 18;
		const headerHeight = 20;
		let { page, cursorY } = opts;

		const drawHeaderRow = () => {
			page.drawRectangle({
				x: marginX,
				y: cursorY - headerHeight + 4,
				width: contentWidth,
				height: headerHeight,
				color: rgb(0.92, 0.94, 0.96)
			});
			let x = marginX;
			opts.columns.forEach((col) => {
				page.drawText(col.label, { x: x + 6, y: cursorY - 10, size: 9, font: bold, color: textColor });
				x += col.width;
			});
			cursorY -= headerHeight;
		};

		const drawRow = (row: string[]) => {
			let x = marginX;
			row.forEach((cell, idx) => {
				const col = opts.columns[idx];
				const value = cell ?? '-';
				let textX = x + 6;
				if (col?.align === 'right') {
					const textWidth = font.widthOfTextAtSize(value, 9);
					textX = x + col.width - textWidth - 6;
				} else if (col?.align === 'center') {
					const textWidth = font.widthOfTextAtSize(value, 9);
					textX = x + (col.width - textWidth) / 2;
				}
				page.drawText(value, { x: textX, y: cursorY - 10, size: 9, font, color: textColor });
				x += col.width;
			});
			cursorY -= rowHeight;
		};

		drawHeaderRow();

		for (const row of opts.rows) {
			if (cursorY - rowHeight < marginBottom) {
				({ page, cursorY } = addPage(true));
				cursorY = drawSectionTitle(page, opts.title, cursorY);
				drawHeaderRow();
			}
			drawRow(row);
		}

		return { page, cursorY };
	};

	if (activeSurah.length) {
		if (cursorY - 40 < marginBottom) {
			({ page, cursorY } = addPage(true));
		}
		cursorY = drawSectionTitle(page, 'Progres Surah', cursorY);
		const surahRows = activeSurah.map((row) => {
			const percent = row.totalAyah ? ((row.disetujui / row.totalAyah) * 100).toFixed(0) : '0';
			const label = `${String(row.surahNumber).padStart(3, '0')} ${row.name}`;
			return [
				label,
				formatNumber(row.setor),
				formatNumber(row.disetujui),
				formatNumber(row.totalAyah),
				`${percent}%`
			];
		});
		({ page, cursorY } = drawTable({
			title: 'Progres Surah',
			page,
			cursorY,
			columns: [
				{ label: 'Surah', width: 240 },
				{ label: 'Setor', width: 65, align: 'right' },
				{ label: 'Disetujui', width: 80, align: 'right' },
				{ label: 'Total Ayat', width: 80, align: 'right' },
				{ label: 'Progress', width: 50, align: 'right' }
			],
			rows: surahRows
		}));
	} else {
		page.drawText('Belum ada progres hafalan yang tercatat.', {
			x: marginX,
			y: cursorY,
			size: 10,
			font,
			color: labelColor
		});
		cursorY -= 20;
	}

	if (params.recent.length) {
		if (cursorY - 40 < marginBottom) {
			({ page, cursorY } = addPage(true));
		}
		cursorY = drawSectionTitle(page, 'Riwayat Setoran Terbaru', cursorY);
		const surahMap = new Map(SURAH_DATA.map((s) => [s.number, s.name]));
		const recentRows = params.recent.map((row) => {
			const surahName = surahMap.get(row.surahNumber) || `Surah ${row.surahNumber}`;
			const dateLabel = formatDate(row.tanggalSetor || row.tanggalApprove);
			return [
				dateLabel,
				`${row.surahNumber}. ${surahName}`,
				String(row.ayahNumber),
				mapStatusLabel(row.status),
				mapQualityLabel(row.qualityStatus)
			];
		});
		({ page, cursorY } = drawTable({
			title: 'Riwayat Setoran Terbaru',
			page,
			cursorY,
			columns: [
				{ label: 'Tanggal', width: 90 },
				{ label: 'Surah', width: 210 },
				{ label: 'Ayat', width: 50, align: 'right' },
				{ label: 'Status', width: 80 },
				{ label: 'Kualitas', width: 85 }
			],
			rows: recentRows
		}));
	} else {
		page.drawText('Belum ada riwayat setoran.', {
			x: marginX,
			y: cursorY,
			size: 10,
			font,
			color: labelColor
		});
		cursorY -= 20;
	}

	page.drawText('Dokumen ini dibuat otomatis dari data hafalan lembaga.', {
		x: marginX,
		y: marginBottom - 12,
		size: 8,
		font,
		color: labelColor
	});

	return pdf.save();
};

export const GET: RequestHandler = async ({ params, locals }) => {
	ensureAuth(locals);
	if (!locals.user?.role || !managerRoles.includes(locals.user.role as any)) {
		throw error(403, 'Forbidden');
	}

	const db = locals.db!;
	if (!db) throw error(500, 'Database tidak tersedia');
	const targetId = params.id;
	if (!targetId) throw error(400, 'ID tidak valid');

	const target = await db
		.prepare(
			'SELECT id, username, email, role, org_id as orgId, org_status as orgStatus, created_at as createdAt FROM users WHERE id = ?'
		)
		.bind(targetId)
		.first<ReportMember>();

	if (!target) {
		throw error(404, 'Anggota tidak ditemukan');
	}
	if (!target.orgId) {
		throw error(400, 'Organisasi anggota tidak ditemukan');
	}

	const org = await getOrganizationById(db, target.orgId);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}

	const { orgId, isSystemAdmin } = getOrgScope(locals.user);
	const memberRole = memberRoleByType[org.type];
	const targetRole = target.role;
	const isAdmin = locals.user.role === 'admin';

	if (!isSystemAdmin) {
		if (!orgId || orgId !== target.orgId) {
			throw error(403, 'Tidak boleh mengakses lembaga lain');
		}
		if (!isAdmin && targetRole !== memberRole) {
			throw error(403, 'Hanya boleh mengunduh laporan anggota lembaga');
		}
	}

	if (targetRole !== memberRole) {
		throw error(400, 'Laporan hanya tersedia untuk anggota lembaga');
	}

	const progressCheck = await db
		.prepare(
			`SELECT COUNT(*) as total
			 FROM hafalan_progress
			 WHERE user_id = ?
			   AND status IN ('setor','disetujui')`
		)
		.bind(targetId)
		.first<{ total: number | null }>();
	const totalActivity = Number(progressCheck?.total ?? 0);
	if (!totalActivity) {
		throw error(400, 'Belum ada setoran untuk anggota ini');
	}

	const statsRaw = await getSantriStats(db, targetId);
	const sessionRow = await db
		.prepare(
			`SELECT
				COUNT(DISTINCT DATE(COALESCE(tanggal_setor, tanggal_approve))) as totalSessions,
				MIN(COALESCE(tanggal_setor, tanggal_approve)) as firstDate,
				MAX(COALESCE(tanggal_approve, tanggal_setor)) as lastDate
			 FROM hafalan_progress
			 WHERE user_id = ?
			   AND status IN ('setor','disetujui')`
		)
		.bind(targetId)
		.first<{ totalSessions: number | null; firstDate: string | null; lastDate: string | null }>();

	const firstDate = sessionRow?.firstDate ?? null;
	const lastDate = sessionRow?.lastDate ?? null;
	const durationDays =
		firstDate && lastDate
			? Math.max(1, Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / 86400000) + 1)
			: 0;

	const stats: ReportStats = {
		totalSetor: statsRaw.submitted ?? 0,
		totalDisetujui: statsRaw.approved ?? 0,
		totalSessions: sessionRow?.totalSessions ?? 0,
		firstDate,
		lastDate,
		durationDays
	};

	const checklist = await getSantriChecklist(db, targetId);

	const info = await db.prepare(`PRAGMA table_info('hafalan_progress')`).all<{ name: string }>();
	const columns = new Set((info?.results ?? []).map((c) => c.name));
	const hasQuality = columns.has('quality_status');

	const { results: recentRows } = await db
		.prepare(
			`SELECT
				surah_number as surahNumber,
				ayah_number as ayahNumber,
				status,
				${hasQuality ? 'quality_status' : 'NULL'} as qualityStatus,
				tanggal_setor as tanggalSetor,
				tanggal_approve as tanggalApprove
			 FROM hafalan_progress
			 WHERE user_id = ?
			   AND status IN ('setor','disetujui')
			 ORDER BY COALESCE(tanggal_approve, tanggal_setor) DESC
			 LIMIT 20`
		)
		.bind(targetId)
		.all<RecentRow>();

	const memberLabel = memberRole === 'jamaah' ? 'Jamaah' : 'Santri';
	const pdfBytes = await buildMemberReportPdf({
		member: target,
		org: {
			id: org.id,
			name: org.name,
			type: org.type,
			slug: org.slug,
			address: org.address ?? null,
			city: org.city ?? null
		},
		memberLabel,
		stats,
		checklist,
		recent: recentRows ?? []
	});

	const dateStamp = new Date().toISOString().slice(0, 10);
	const filename = `laporan-${memberRole}-${slugify(target.username || target.email)}-${dateStamp}.pdf`;
	const pdfBuffer = Uint8Array.from(pdfBytes).buffer;
	return new Response(pdfBuffer, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};

export const normalizeOrgType = (value?: string | null) => {
	if (!value) return '';
	const normalized = value.toLowerCase().trim().replace(/_/g, '-').replace(/\s+/g, '-');
	if (normalized === 'pondok-pesantren') return 'pondok';
	if (normalized === 'rumah-tahfidz') return 'rumah-tahfidz';
	return normalized;
};

export const isEducationalOrgType = (value?: string | null) => {
	const normalized = normalizeOrgType(value);
	return normalized === 'pondok' || normalized === 'tpq' || normalized === 'rumah-tahfidz';
};

/** Setoran/review/riwayat akademik: TPQ dan rumah tahfidz. */
export const isAcademicSetoranOrgType = (value?: string | null) => {
	const normalized = normalizeOrgType(value);
	return normalized === 'tpq' || normalized === 'rumah-tahfidz';
};

/** Kas lembaga: masjid, musholla, dan pondok. */
export const isFinanceOrgType = (value?: string | null) => {
	const normalized = normalizeOrgType(value);
	return normalized === 'masjid' || normalized === 'musholla' || normalized === 'pondok';
};

export const isCommunityOrgType = (value?: string | null) => {
	const normalized = normalizeOrgType(value);
	return normalized === 'masjid' || normalized === 'musholla';
};

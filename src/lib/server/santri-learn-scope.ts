type LearnUserScope = {
	orgId?: string | null;
};

/**
 * Modul dengan lembaga_id NULL adalah kurikulum global.
 * Karena itu akun yang belum terhubung ke lembaga tetap boleh belajar,
 * sedangkan anggota lembaga juga mendapat modul khusus lembaganya.
 */
export const resolveLearnLembagaId = (user: LearnUserScope): string | null => user.orgId ?? null;

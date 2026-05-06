export function displayRole(role: string | null | undefined): string {
	const map: Record<string, string> = {
		ustadz: 'Guru',
		ustadzah: 'Guru',
		santri: 'Santri',
		admin: 'Admin',
		koordinator: 'Koordinator',
		alumni: 'Alumni',
		SUPER_ADMIN: 'Super Admin',
		super_admin: 'Super Admin'
	};

	return map[role ?? ''] ?? role ?? '-';
}

export const parseSuperAdminEmailAllowlist = (...values: Array<string | null | undefined>) => {
	const emails = values
		.flatMap((value) => (value ?? '').split(/[,\s]+/))
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean);
	return new Set(emails);
};

const isSuperAdminRoleValue = (role?: string | null) =>
	['SUPER_ADMIN', 'SUPERADMIN'].includes(role?.trim().replace(/[-\s]+/g, '_').toUpperCase() ?? '');

export const SUPER_ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export const isPasswordLoginAllowedForRole = (role?: string | null) => !isSuperAdminRoleValue(role);

type PasswordLoginIdentity = {
	role?: string | null;
	email?: string | null;
	allowlist: ReadonlySet<string>;
};

export const isPasswordLoginAllowedForIdentity = ({
	role,
	email,
	allowlist
}: PasswordLoginIdentity) =>
	isPasswordLoginAllowedForRole(role) && !allowlist.has(email?.trim().toLowerCase() ?? '');

export const isSuperAdminSessionAllowed = ({ role, email, allowlist }: PasswordLoginIdentity) =>
	!isSuperAdminRoleValue(role) || allowlist.has(email?.trim().toLowerCase() ?? '');

export const getSuperAdminSessionExpiry = (now = Date.now()) => now + SUPER_ADMIN_SESSION_TTL_MS;

type SessionDatabase = {
	prepare: (sql: string) => {
		bind: (...values: unknown[]) => { run: () => Promise<unknown> };
	};
};

export const clampSuperAdminSession = async (db: SessionDatabase, sessionId: string, now = Date.now()) => {
	await db
		.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?')
		.bind(getSuperAdminSessionExpiry(now), sessionId)
		.run();
};

type SuperAdminOAuthInput = {
	email: string;
	emailVerified: boolean;
	currentRole?: string | null;
	allowlist: ReadonlySet<string>;
};

export const evaluateSuperAdminOAuth = ({
	email,
	emailVerified,
	currentRole,
	allowlist
}: SuperAdminOAuthInput): 'grant' | 'deny' | 'standard' => {
	const isAllowlisted = allowlist.has(email.trim().toLowerCase());
	if (isAllowlisted) return emailVerified ? 'grant' : 'deny';
	if (isSuperAdminRoleValue(currentRole)) return 'deny';
	return 'standard';
};

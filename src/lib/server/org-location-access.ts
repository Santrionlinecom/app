export type OrgLocationActor = {
	role: string;
	orgId: string | null | undefined;
	isSuperAdmin: boolean;
};

export const canManageOrgLocation = (actor: OrgLocationActor, targetOrgId: string) => {
	if (actor.isSuperAdmin) return true;
	return actor.role.toLowerCase() === 'admin' && actor.orgId === targetOrgId;
};

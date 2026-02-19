import { redirect } from '@sveltejs/kit';
import { getInstitutionByKey, type InstitutionKey } from '$lib/config/institutions';

export const getInstitutionComingSoonLoad = (
	key: InstitutionKey
): null => {
	const institution = getInstitutionByKey(key);
	if (!institution.enabled) {
		throw redirect(302, '/tpq');
	}

	return null;
};

export const getInstitutionActionBlock = (key: InstitutionKey) => {
	const institution = getInstitutionByKey(key);
	if (!institution.enabled) {
		throw redirect(302, '/tpq');
	}

	return null;
};

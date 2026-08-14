import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
	const requestedChapter = Number(url.searchParams.get('chapter') ?? '1');
	const chapter = Number.isInteger(requestedChapter) && requestedChapter > 0 ? requestedChapter : 1;

	throw redirect(308, `/buku/${params.slug}/bab/${chapter}`);
};

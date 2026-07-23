import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const retiredSeedEndpoint: RequestHandler = async () =>
	json(
		{
			error: 'Endpoint seed akun demo telah dinonaktifkan permanen. Gunakan alur pembuatan akun resmi.'
		},
		{ status: 410 }
	);

export const POST = retiredSeedEndpoint;
export const GET = retiredSeedEndpoint;

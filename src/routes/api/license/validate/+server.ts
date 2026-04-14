import { json, type RequestHandler } from '@sveltejs/kit';
import { getRequestIp } from '$lib/server/logger';
import {
	desktopLicenseResponseStatus,
	desktopServerError,
	validateDesktopLicense
} from '$lib/server/license/streamer-desktop';

const methodNotAllowed = () => json({ ok: false, reason: 'request invalid' }, { status: 405 });
const notAllowedHandler: RequestHandler = async () => methodNotAllowed();

export const GET = notAllowedHandler;
export const PUT = notAllowedHandler;
export const PATCH = notAllowedHandler;
export const DELETE = notAllowedHandler;
export const OPTIONS = notAllowedHandler;

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		return json(desktopServerError(), { status: 503 });
	}

	let body: Record<string, unknown> = {};
	try {
		body = (await request.json()) as Record<string, unknown>;
	} catch {
		return json({ ok: false, reason: 'request invalid' }, { status: 400 });
	}

	try {
		const result = await validateDesktopLicense({
			body,
			db,
			ip: getRequestIp(request)
		});
		return json(result, { status: desktopLicenseResponseStatus(result) });
	} catch {
		return json(desktopServerError(), { status: 500 });
	}
};

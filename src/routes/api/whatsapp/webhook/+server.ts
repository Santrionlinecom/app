import type { RequestHandler } from './$types';

const VERIFY_TOKEN_ENV = 'WHATSAPP_WEBHOOK_VERIFY_TOKEN';

const readVerifyToken = (platform: App.Platform | undefined) => {
	const env = platform?.env as Record<string, unknown> | undefined;
	const value = env?.[VERIFY_TOKEN_ENV];
	return typeof value === 'string' ? value.trim() : '';
};

const isWhatsAppWebhook = (value: unknown): value is { object: 'whatsapp_business_account'; entry: unknown[] } => {
	if (!value || typeof value !== 'object') return false;
	const payload = value as { object?: unknown; entry?: unknown };
	return payload.object === 'whatsapp_business_account' && Array.isArray(payload.entry);
};

export const GET: RequestHandler = async ({ url, platform }) => {
	const mode = url.searchParams.get('hub.mode');
	const verifyToken = url.searchParams.get('hub.verify_token');
	const challenge = url.searchParams.get('hub.challenge');
	const expectedToken = readVerifyToken(platform);

	if (mode !== 'subscribe' || !verifyToken || !challenge || !expectedToken || verifyToken !== expectedToken) {
		return new Response('Webhook verification failed.', {
			status: 403,
			headers: { 'content-type': 'text/plain; charset=utf-8' }
		});
	}

	return new Response(challenge, {
		status: 200,
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const payload = await request.json().catch(() => null);
	if (!isWhatsAppWebhook(payload)) {
		return new Response(null, { status: 400 });
	}

	// Meta only requires a prompt 2xx acknowledgement here. Message/status
	// processing will be added separately; never log the raw payload or secrets.
	return new Response(null, { status: 200 });
};

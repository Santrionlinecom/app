import assert from 'node:assert/strict';
import test from 'node:test';
import { GET, POST } from './+server';

const VERIFY_TOKEN = 'synthetic-verification-token';

const createEvent = (request: Request, env: Record<string, string> = {}) =>
	({
		request,
		url: new URL(request.url),
		platform: { env }
	}) as never;

test('GET returns hub.challenge when subscribe mode and verification token match', async () => {
	const request = new Request(
		`https://app.santrionline.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=challenge-123`
	);

	const response = await GET(createEvent(request, { WHATSAPP_WEBHOOK_VERIFY_TOKEN: VERIFY_TOKEN }));

	assert.equal(response.status, 200);
	assert.equal(await response.text(), 'challenge-123');
	assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
});

test('GET rejects an invalid verification token without returning the challenge', async () => {
	const request = new Request(
		'https://app.santrionline.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=challenge-123'
	);

	const response = await GET(createEvent(request, { WHATSAPP_WEBHOOK_VERIFY_TOKEN: VERIFY_TOKEN }));

	assert.equal(response.status, 403);
	assert.notEqual(await response.text(), 'challenge-123');
});

test('POST acknowledges a WhatsApp webhook without logging its payload', async () => {
	const request = new Request('https://app.santrionline.com/api/whatsapp/webhook', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			object: 'whatsapp_business_account',
			entry: [{ id: 'synthetic-waba-id', changes: [{ field: 'messages', value: {} }] }]
		})
	});
	const originalLog = console.log;
	const originalInfo = console.info;
	const originalWarn = console.warn;
	const originalError = console.error;
	let logCalls = 0;
	console.log = console.info = console.warn = console.error = () => {
		logCalls += 1;
	};

	try {
		const response = await POST(createEvent(request));
		assert.equal(response.status, 200);
		assert.equal(await response.text(), '');
		assert.equal(logCalls, 0);
	} finally {
		console.log = originalLog;
		console.info = originalInfo;
		console.warn = originalWarn;
		console.error = originalError;
	}
});

test('POST rejects payloads that are not WhatsApp Business Account events', async () => {
	const request = new Request('https://app.santrionline.com/api/whatsapp/webhook', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ object: 'other', entry: [] })
	});

	const response = await POST(createEvent(request));
	assert.equal(response.status, 400);
});

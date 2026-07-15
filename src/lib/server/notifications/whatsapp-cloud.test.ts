import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
	buildPaymentSuccessTemplatePayload,
	normalizeWhatsAppRecipient,
	sendPaymentSuccessTemplate,
	type WhatsAppCloudConfig
} from './whatsapp-cloud.ts';

test('normalizeWhatsAppRecipient converts Indonesian local numbers to international digits', () => {
	assert.equal(normalizeWhatsAppRecipient('0878 5454-5274'), '6287854545274');
	assert.equal(normalizeWhatsAppRecipient('+62 838 7853 5157'), '6283878535157');
	assert.equal(normalizeWhatsAppRecipient('6287854545274'), '6287854545274');
});

test('normalizeWhatsAppRecipient rejects malformed or implausible recipients', () => {
	assert.equal(normalizeWhatsAppRecipient(''), null);
	assert.equal(normalizeWhatsAppRecipient('abc'), null);
	assert.equal(normalizeWhatsAppRecipient('0812'), null);
	assert.equal(normalizeWhatsAppRecipient('000000000000'), null);
});

test('buildPaymentSuccessTemplatePayload creates a deterministic Indonesian template payload', () => {
	assert.deepEqual(
		buildPaymentSuccessTemplatePayload({
			recipient: '6287854545274',
			templateName: 'santrionline_payment_success',
			languageCode: 'id',
			customerName: 'Mas Yogik',
			packageName: 'Top Up Coin Berkah',
			amountRupiah: 50000,
			orderId: 'SOA-123'
		}),
		{
			messaging_product: 'whatsapp',
			to: '6287854545274',
			type: 'template',
			template: {
				name: 'santrionline_payment_success',
				language: { code: 'id' },
				components: [
					{
						type: 'body',
						parameters: [
							{ type: 'text', text: 'Mas Yogik' },
							{ type: 'text', text: 'Top Up Coin Berkah' },
							{ type: 'text', text: 'Rp50.000' },
							{ type: 'text', text: 'SOA-123' }
						]
					}
				]
			}
		}
	);
});

test('sendPaymentSuccessTemplate posts to the configured Graph endpoint without leaking the token', async () => {
	const config: WhatsAppCloudConfig = {
		accessToken: 'secret-token',
		phoneNumberId: '123456789',
		graphApiVersion: 'v23.0',
		templateName: 'santrionline_payment_success',
		languageCode: 'id'
	};
	let receivedUrl = '';
	let receivedInit: RequestInit | undefined;
	const fakeFetch: typeof fetch = async (input, init) => {
		receivedUrl = String(input);
		receivedInit = init;
		return new Response(JSON.stringify({ messages: [{ id: 'wamid.test' }] }), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		});
	};

	const result = await sendPaymentSuccessTemplate({
		fetchFn: fakeFetch,
		config,
		recipient: '087854545274',
		customerName: 'Yogik',
		packageName: 'Paket Berkah',
		amountRupiah: 50000,
		orderId: 'SOA-123'
	});

	assert.deepEqual(result, { ok: true, messageId: 'wamid.test' });
	assert.equal(receivedUrl, 'https://graph.facebook.com/v23.0/123456789/messages');
	assert.equal(new Headers(receivedInit?.headers).get('authorization'), 'Bearer secret-token');
	assert.equal(new Headers(receivedInit?.headers).get('content-type'), 'application/json');
});

test('sendPaymentSuccessTemplate returns a bounded provider error', async () => {
	const config: WhatsAppCloudConfig = {
		accessToken: 'secret-token',
		phoneNumberId: '123456789',
		graphApiVersion: 'v23.0',
		templateName: 'santrionline_payment_success',
		languageCode: 'id'
	};
	const fakeFetch: typeof fetch = async () =>
		new Response(JSON.stringify({ error: { message: 'Template is not approved', code: 132001 } }), {
			status: 400,
			headers: { 'content-type': 'application/json' }
		});

	const result = await sendPaymentSuccessTemplate({
		fetchFn: fakeFetch,
		config,
		recipient: '087854545274',
		customerName: 'Yogik',
		packageName: 'Paket Berkah',
		amountRupiah: 50000,
		orderId: 'SOA-123'
	});

	assert.equal(result.ok, false);
	if (!result.ok) {
		assert.equal(result.code, '132001');
		assert.match(result.message, /Template is not approved/);
		assert.doesNotMatch(result.message, /secret-token/);
	}
});

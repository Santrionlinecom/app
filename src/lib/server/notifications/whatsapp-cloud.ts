export type WhatsAppCloudConfig = {
	accessToken: string;
	phoneNumberId: string;
	graphApiVersion: string;
	templateName: string;
	languageCode: string;
};

type PaymentSuccessTemplateInput = {
	recipient: string;
	templateName: string;
	languageCode: string;
	customerName: string;
	packageName: string;
	amountRupiah: number;
	orderId: string;
};

type SendPaymentSuccessInput = Omit<PaymentSuccessTemplateInput, 'templateName' | 'languageCode'> & {
	fetchFn: typeof fetch;
	config: WhatsAppCloudConfig;
};

export type WhatsAppSendResult =
	| { ok: true; messageId: string }
	| { ok: false; code: string; message: string };

const MAX_PROVIDER_ERROR_LENGTH = 300;

const boundedText = (value: unknown, fallback: string) => {
	const normalized = typeof value === 'string' ? value.trim() : '';
	return (normalized || fallback).slice(0, MAX_PROVIDER_ERROR_LENGTH);
};

const formatRupiah = (amount: number) =>
	`Rp${Math.max(0, Math.round(amount)).toLocaleString('id-ID')}`;

export const normalizeWhatsAppRecipient = (value: string): string | null => {
	let digits = value.replace(/\D/g, '');
	if (!digits) return null;
	if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
	if (!digits.startsWith('62')) return null;
	if (!/^62[1-9]\d{7,12}$/.test(digits)) return null;
	return digits;
};

export const buildPaymentSuccessTemplatePayload = ({
	recipient,
	templateName,
	languageCode,
	customerName,
	packageName,
	amountRupiah,
	orderId
}: PaymentSuccessTemplateInput) => ({
	messaging_product: 'whatsapp',
	to: recipient,
	type: 'template',
	template: {
		name: templateName,
		language: { code: languageCode },
		components: [
			{
				type: 'body',
				parameters: [
					{ type: 'text', text: customerName },
					{ type: 'text', text: packageName },
					{ type: 'text', text: formatRupiah(amountRupiah) },
					{ type: 'text', text: orderId }
				]
			}
		]
	}
});

const validateConfig = (config: WhatsAppCloudConfig) => {
	if (!config.accessToken.trim()) return 'Access token WhatsApp belum tersedia';
	if (!/^\d+$/.test(config.phoneNumberId)) return 'Phone Number ID WhatsApp tidak valid';
	if (!/^v\d+\.\d+$/.test(config.graphApiVersion)) return 'Versi Graph API WhatsApp tidak valid';
	if (!/^[a-z0-9_]+$/.test(config.templateName)) return 'Nama template WhatsApp tidak valid';
	if (!/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(config.languageCode)) return 'Kode bahasa template WhatsApp tidak valid';
	return null;
};

export const sendPaymentSuccessTemplate = async ({
	fetchFn,
	config,
	recipient,
	customerName,
	packageName,
	amountRupiah,
	orderId
}: SendPaymentSuccessInput): Promise<WhatsAppSendResult> => {
	const configError = validateConfig(config);
	if (configError) return { ok: false, code: 'invalid_config', message: configError };

	const normalizedRecipient = normalizeWhatsAppRecipient(recipient);
	if (!normalizedRecipient) {
		return { ok: false, code: 'invalid_recipient', message: 'Nomor WhatsApp penerima tidak valid' };
	}

	const endpoint = `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`;
	let response: Response;
	try {
		response = await fetchFn(endpoint, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${config.accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(
				buildPaymentSuccessTemplatePayload({
					recipient: normalizedRecipient,
					templateName: config.templateName,
					languageCode: config.languageCode,
					customerName: boundedText(customerName, 'SantriOnline'),
					packageName: boundedText(packageName, 'Pembayaran SantriOnline'),
					amountRupiah,
					orderId: boundedText(orderId, '-')
				})
			),
			signal: AbortSignal.timeout(10_000)
		});
	} catch (error) {
		return {
			ok: false,
			code: error instanceof DOMException && error.name === 'TimeoutError' ? 'timeout' : 'network_error',
			message: 'WhatsApp Cloud API tidak dapat dihubungi'
		};
	}

	const payload = (await response.json().catch(() => ({}))) as {
		messages?: Array<{ id?: unknown }>;
		error?: { code?: unknown; message?: unknown };
	};
	const messageId = payload.messages?.[0]?.id;
	if (response.ok && typeof messageId === 'string' && messageId) {
		return { ok: true, messageId };
	}

	return {
		ok: false,
		code: String(payload.error?.code ?? response.status),
		message: boundedText(payload.error?.message, `WhatsApp Cloud API merespons HTTP ${response.status}`)
	};
};

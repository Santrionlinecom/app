import { env } from '$env/dynamic/private';

export const TURNSTILE_FIELD_NAME = 'cf-turnstile-response';
export const TURNSTILE_FAILURE_MESSAGE = 'Verifikasi keamanan gagal. Silakan coba lagi.';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type TurnstileSiteverifyResponse = {
	success?: boolean;
	'error-codes'?: string[];
	challenge_ts?: string;
	hostname?: string;
	action?: string;
	cdata?: string;
};

export type TurnstileVerificationResult = {
	success: boolean;
	errorCodes: string[];
	challengeTs?: string;
	hostname?: string;
	action?: string;
	cdata?: string;
};

export const getTurnstileSiteKey = () => env.TURNSTILE_SITE_KEY?.trim() ?? '';

export const getTurnstileTokenFromFormData = (
	formData: FormData,
	fieldName = TURNSTILE_FIELD_NAME
) => {
	const token = formData.get(fieldName);
	return typeof token === 'string' ? token.trim() : '';
};

export async function verifyTurnstileToken(
	token: string,
	ip?: string
): Promise<TurnstileVerificationResult> {
	const secretKey = env.TURNSTILE_SECRET_KEY?.trim();
	const responseToken = token.trim();

	if (!secretKey) {
		return { success: false, errorCodes: ['missing-input-secret'] };
	}
	if (!responseToken) {
		return { success: false, errorCodes: ['missing-input-response'] };
	}

	const body = new URLSearchParams();
	body.set('secret', secretKey);
	body.set('response', responseToken);
	if (ip) {
		body.set('remoteip', ip);
	}

	try {
		const response = await fetch(SITEVERIFY_URL, {
			method: 'POST',
			body
		});
		const result = (await response.json()) as TurnstileSiteverifyResponse;

		return {
			success: response.ok && result.success === true,
			errorCodes: result['error-codes'] ?? [],
			challengeTs: result.challenge_ts,
			hostname: result.hostname,
			action: result.action,
			cdata: result.cdata
		};
	} catch {
		return { success: false, errorCodes: ['turnstile-network-error'] };
	}
}

export const verifyTurnstileFormData = (formData: FormData, ip?: string) =>
	verifyTurnstileToken(getTurnstileTokenFromFormData(formData), ip);

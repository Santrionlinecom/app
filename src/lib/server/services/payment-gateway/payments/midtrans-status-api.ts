type MidtransStatusApiInput = {
	fetchFn: typeof fetch;
	serverKey: string;
	isProduction: boolean;
	orderId: string;
};

type MidtransStatusApiPayload = {
	order_id?: unknown;
	status_code?: unknown;
	gross_amount?: unknown;
	transaction_status?: unknown;
	fraud_status?: unknown;
};

export type MidtransStatusApiResult =
	| {
			ok: true;
			orderId: string;
			statusCode: string;
			grossAmount: string;
			transactionStatus: string;
			fraudStatus: string;
	  }
	| { ok: false; code: string };

const asString = (value: unknown) => {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	return '';
};

export const fetchMidtransTransactionStatus = async ({
	fetchFn,
	serverKey,
	isProduction,
	orderId
}: MidtransStatusApiInput): Promise<MidtransStatusApiResult> => {
	const host = isProduction ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
	const endpoint = `${host}/v2/${encodeURIComponent(orderId)}/status`;

	let response: Response;
	try {
		response = await fetchFn(endpoint, {
			method: 'GET',
			headers: {
				Authorization: `Basic ${btoa(`${serverKey}:`)}`,
				Accept: 'application/json'
			},
			signal: AbortSignal.timeout(10_000)
		});
	} catch (error) {
		return {
			ok: false,
			code: error instanceof DOMException && error.name === 'TimeoutError' ? 'timeout' : 'network_error'
		};
	}

	if (!response.ok) return { ok: false, code: `http_${response.status}` };
	const payload = (await response.json().catch(() => ({}))) as MidtransStatusApiPayload;
	const verified = {
		orderId: asString(payload.order_id),
		statusCode: asString(payload.status_code),
		grossAmount: asString(payload.gross_amount),
		transactionStatus: asString(payload.transaction_status),
		fraudStatus: asString(payload.fraud_status)
	};

	if (!verified.orderId || !verified.statusCode || !verified.grossAmount || !verified.transactionStatus) {
		return { ok: false, code: 'invalid_response' };
	}
	return { ok: true, ...verified };
};
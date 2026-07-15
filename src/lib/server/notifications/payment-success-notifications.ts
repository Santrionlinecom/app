import type { D1Database } from '@cloudflare/workers-types';
import { notifyPaymentSuccessEmail } from './payment-success-email';
import { notifyPaymentSuccess } from './payment-success-notifier';

type PaymentSuccessNotificationInput = {
	db: D1Database;
	fetchFn: typeof fetch;
	env: object;
	orderId: string;
	userId: string | null;
	packageName: string | null;
	productSlug: string;
	grossAmount: number;
};

type NotificationResult =
	| { status: string; reason?: string; code?: string }
	| { status: 'unexpected_error'; code: 'unexpected_error' };

type PaymentNotifier = (input: PaymentSuccessNotificationInput) => Promise<NotificationResult>;

export type PaymentSuccessNotificationOutcome = {
	channel: 'whatsapp' | 'email';
	result: NotificationResult;
};

export const dispatchPaymentSuccessNotificationsBestEffort = async (
	input: PaymentSuccessNotificationInput,
	notifiers: readonly PaymentNotifier[] = [notifyPaymentSuccess, notifyPaymentSuccessEmail]
): Promise<PaymentSuccessNotificationOutcome[]> => {
	const channels = ['whatsapp', 'email'] as const;
	const outcomes = await Promise.allSettled(
		notifiers.map((notifier) => Promise.resolve().then(() => notifier(input)))
	);
	return outcomes.map((outcome, index) => ({
		channel: channels[index] ?? 'email',
		result:
			outcome.status === 'fulfilled'
				? outcome.value
				: { status: 'unexpected_error', code: 'unexpected_error' }
	}));
};

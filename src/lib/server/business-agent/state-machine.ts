export type BusinessAggregate = 'lead' | 'quote' | 'order' | 'license';

export type BusinessTransitionInput = {
	aggregate: BusinessAggregate;
	from: string;
	to: string;
	event: string;
};

const transitions: Record<BusinessAggregate, ReadonlySet<string>> = {
	lead: new Set([
		'new:discovery_started:discovery',
		'discovery:lead_qualified:qualified',
		'discovery:lead_lost:lost',
		'qualified:quote_created:quoted',
		'qualified:lead_lost:lost',
		'quoted:lead_lost:lost'
	]),
	quote: new Set([
		'draft:approval_requested:awaiting_approval',
		'awaiting_approval:approval_granted:approved',
		'awaiting_approval:approval_rejected:rejected',
		'awaiting_approval:approval_expired:draft',
		'awaiting_approval:approval_cancelled:draft',
		'approved:quote_sent:sent',
		'sent:quote_accepted:accepted',
		'sent:quote_expired:expired',
		'draft:quote_cancelled:cancelled',
		'approved:quote_cancelled:cancelled',
		'sent:quote_cancelled:cancelled'
	]),
	order: new Set([
		'created:invoice_created:awaiting_payment',
		'awaiting_payment:payment_verified:paid',
		'awaiting_payment:payment_expired:expired',
		'awaiting_payment:order_cancelled:cancelled',
		'paid:provisioning_started:provisioning',
		'provisioning:provisioning_completed:active',
		'provisioning:provisioning_failed:provisioning_failed',
		'provisioning_failed:provisioning_retried:provisioning',
		'active:order_completed:completed'
	]),
	license: new Set([
		'pending:license_activated:active',
		'active:license_suspended:suspended',
		'suspended:license_reactivated:active',
		'active:license_expired:expired',
		'active:license_revoked:revoked',
		'suspended:license_revoked:revoked'
	])
};

const transitionKey = ({ from, to, event }: BusinessTransitionInput) => `${from}:${event}:${to}`;

export const canTransitionBusinessState = (input: BusinessTransitionInput) =>
	transitions[input.aggregate].has(transitionKey(input));

export const assertBusinessTransition = (input: BusinessTransitionInput) => {
	if (!canTransitionBusinessState(input)) {
		throw new Error('Transisi status bisnis tidak diizinkan');
	}
};

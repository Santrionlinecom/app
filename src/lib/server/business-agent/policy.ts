export type BusinessActorType = 'admin' | 'agent' | 'system' | 'payment_webhook';

export type BusinessAction =
	| 'read'
	| 'create_lead'
	| 'create_quote_draft'
	| 'request_approval'
	| 'approve_quote'
	| 'send_quote'
	| 'create_midtrans_invoice'
	| 'mark_paid'
	| 'activate_license'
	| 'refund'
	| 'revoke_license'
	| 'manage_policy';

export type BusinessPolicyReason =
	| 'allowed'
	| 'actor_not_allowed'
	| 'kill_switch_active'
	| 'self_approval_forbidden'
	| 'admin_required'
	| 'approval_required'
	| 'verified_payment_required'
	| 'system_executor_required';

export type BusinessPolicyInput = {
	action: BusinessAction;
	actorType: BusinessActorType;
	actorId: string;
	requestedBy?: string | null;
	hasValidApproval?: boolean;
	paymentVerified?: boolean;
	killSwitchActive?: boolean;
};

export type BusinessPolicyDecision = {
	allowed: boolean;
	reason: BusinessPolicyReason;
};

const allow = (): BusinessPolicyDecision => ({ allowed: true, reason: 'allowed' });
const deny = (reason: Exclude<BusinessPolicyReason, 'allowed'>): BusinessPolicyDecision => ({
	allowed: false,
	reason
});

const internalActions = new Set<BusinessAction>(['read', 'create_lead', 'create_quote_draft', 'request_approval']);
const approvalBoundActions = new Set<BusinessAction>([
	'send_quote',
	'create_midtrans_invoice',
	'refund',
	'revoke_license',
	'manage_policy'
]);

const allowedActorsByAction: Record<BusinessAction, readonly BusinessActorType[]> = {
	read: ['agent', 'admin', 'system', 'payment_webhook'],
	create_lead: ['agent', 'admin'],
	create_quote_draft: ['agent', 'admin'],
	request_approval: ['agent', 'admin'],
	approve_quote: ['admin'],
	create_midtrans_invoice: ['admin', 'system'],
	send_quote: ['admin', 'system'],
	mark_paid: ['payment_webhook'],
	activate_license: ['system'],
	refund: ['admin'],
	revoke_license: ['admin'],
	manage_policy: ['admin']
};

export const evaluateBusinessAction = (input: BusinessPolicyInput): BusinessPolicyDecision => {
	if (input.action === 'read') return allow();
	if (!allowedActorsByAction[input.action].includes(input.actorType)) {
		return deny('actor_not_allowed');
	}
	if (input.killSwitchActive) return deny('kill_switch_active');

	if (internalActions.has(input.action)) return allow();

	if (input.action === 'approve_quote') {
		if (input.actorType !== 'admin') return deny('admin_required');
		if (input.requestedBy && input.actorId === input.requestedBy) {
			return deny('self_approval_forbidden');
		}
		return allow();
	}

	if (input.action === 'mark_paid') {
		if (input.actorType !== 'payment_webhook' || !input.paymentVerified) {
			return deny('verified_payment_required');
		}
		return allow();
	}

	if (input.action === 'activate_license') {
		if (input.actorType !== 'system') return deny('system_executor_required');
		if (!input.paymentVerified) return deny('verified_payment_required');
		return allow();
	}

	if (approvalBoundActions.has(input.action)) {
		if (!input.hasValidApproval) return deny('approval_required');
		if (input.actorType !== 'admin' && input.actorType !== 'system') return deny('admin_required');
		return allow();
	}

	return deny('admin_required');
};

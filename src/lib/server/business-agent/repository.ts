import type { D1Database } from '@cloudflare/workers-types';

import { createPayloadHash } from './integrity';
import { evaluateBusinessAction, type BusinessActorType } from './policy';
import { assertBusinessTransition } from './state-machine';

export type BusinessActor = {
	id: string;
	type: BusinessActorType;
};

export type CreateBusinessLeadInput = {
	source: 'web' | 'telegram' | 'admin' | 'referral' | 'import';
	contactName: string;
	contactEmail?: string;
	contactWhatsapp?: string;
	organizationName?: string;
	needSummary: string;
};

export type CreateBusinessQuoteInput = {
	leadId: string;
	subtotal: number;
	discount: number;
	currency: string;
	packageSnapshot: Record<string, unknown>;
	assumptions: string[];
	expiresAt: number;
};

type LeadRow = {
	id: string;
	status: string;
};

type QuoteRow = {
	id: string;
	leadId: string;
	version: number;
	currency: string;
	subtotal: number;
	discount: number;
	total: number;
	packageSnapshotJson: string;
	assumptionsJson: string;
	payloadHash: string;
	status: string;
	expiresAt: number;
	createdBy: string;
};

type ApprovalRow = {
	id: string;
	resourceId: string;
	payloadHash: string;
	status: string;
	requestedBy: string;
	expiresAt: number;
	currentPayloadHash: string | null;
};

const newId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

const isKillSwitchActive = async (db: D1Database, scopes: string[]) => {
	const placeholders = scopes.map(() => '?').join(', ');
	const row = await db
		.prepare(
			`SELECT COUNT(*) AS total
			 FROM business_kill_switches
			 WHERE enabled = 1 AND scope IN (${placeholders})`
		)
		.bind(...scopes)
		.first<{ total: number | null }>();
	return Number(row?.total ?? 0) > 0;
};

const enforcePolicy = async (
	db: D1Database,
	input: Parameters<typeof evaluateBusinessAction>[0],
	scopes: string[] = ['global']
) => {
	const decision = evaluateBusinessAction({
		...input,
		killSwitchActive: await isKillSwitchActive(db, scopes)
	});
	if (!decision.allowed) throw new Error(`Business policy ditolak: ${decision.reason}`);
};

export const listBusinessLeads = async (db: D1Database, limit = 50) => {
	const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
	const result = await db
		.prepare(
			`SELECT
				id,
				source,
				contact_name AS contactName,
				contact_email AS contactEmail,
				contact_whatsapp AS contactWhatsapp,
				organization_name AS organizationName,
				need_summary AS needSummary,
				status,
				created_by AS createdBy,
				assigned_to AS assignedTo,
				created_at AS createdAt,
				updated_at AS updatedAt
			 FROM business_leads
			 ORDER BY updated_at DESC
			 LIMIT ?`
		)
		.bind(safeLimit)
		.all();
	return result.results ?? [];
};

export const createBusinessLead = async (
	db: D1Database,
	input: CreateBusinessLeadInput,
	actor: BusinessActor
) => {
	await enforcePolicy(db, {
		action: 'create_lead',
		actorType: actor.type,
		actorId: actor.id
	});

	const id = newId('lead');
	const auditId = newId('audit');
	const now = Date.now();
	await db.batch([
		db
			.prepare(
				`INSERT INTO business_leads (
					id, source, contact_name, contact_email, contact_whatsapp,
					organization_name, need_summary, status, created_by, assigned_to,
					created_at, updated_at
				 ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)`
			)
			.bind(
				id,
				input.source,
				input.contactName,
				input.contactEmail ?? null,
				input.contactWhatsapp ?? null,
				input.organizationName ?? null,
				input.needSummary,
				actor.id,
				actor.id,
				now,
				now
			),
		db
			.prepare(
				`INSERT INTO business_audit_events (
					id, event_type, actor_type, actor_id, resource_type, resource_id, payload_json, created_at
				 ) VALUES (?, 'lead_created', ?, ?, 'lead', ?, ?, ?)`
			)
			.bind(auditId, actor.type, actor.id, id, JSON.stringify({ source: input.source }), now)
	]);
	return { id, status: 'new' as const };
};

export const transitionBusinessLead = async (
	db: D1Database,
	params: { leadId: string; to: string; event: string; reason?: string },
	actor: BusinessActor
) => {
	const current = await db
		.prepare('SELECT id, status FROM business_leads WHERE id = ?')
		.bind(params.leadId)
		.first<LeadRow>();
	if (!current) throw new Error('Lead bisnis tidak ditemukan');
	assertBusinessTransition({ aggregate: 'lead', from: current.status, to: params.to, event: params.event });
	await enforcePolicy(db, { action: 'create_lead', actorType: actor.type, actorId: actor.id });

	const now = Date.now();
	const mutationToken = newId('mutation');
	const transitionId = newId('transition');
	const auditId = newId('audit');
	const results = await db.batch([
		db
			.prepare('UPDATE business_leads SET status = ?, updated_at = ?, mutation_token = ? WHERE id = ? AND status = ?')
			.bind(params.to, now, mutationToken, params.leadId, current.status),
		db
			.prepare(
				`INSERT INTO business_state_transitions (
					id, aggregate_type, aggregate_id, from_state, to_state, event_type,
					actor_type, actor_id, reason, created_at
				 )
				 SELECT ?, 'lead', ?, ?, ?, ?, ?, ?, ?, ?
				 WHERE EXISTS (SELECT 1 FROM business_leads WHERE id = ? AND status = ? AND mutation_token = ?)`
			)
			.bind(
				transitionId,
				params.leadId,
				current.status,
				params.to,
				params.event,
				actor.type,
				actor.id,
				params.reason ?? null,
				now,
				params.leadId,
				params.to,
				mutationToken
			),
		db
			.prepare(
				`INSERT INTO business_audit_events (
					id, event_type, actor_type, actor_id, resource_type, resource_id, payload_json, created_at
				 )
				 SELECT ?, 'lead_transitioned', ?, ?, 'lead', ?, ?, ?
				 WHERE EXISTS (SELECT 1 FROM business_leads WHERE id = ? AND status = ? AND mutation_token = ?)`
			)
			.bind(
				auditId,
				actor.type,
				actor.id,
				params.leadId,
				JSON.stringify({ from: current.status, to: params.to, event: params.event }),
				now,
				params.leadId,
				params.to,
				mutationToken
			)
	]);
	if (Number(results[0]?.meta?.changes ?? 0) !== 1) throw new Error('Status lead berubah oleh proses lain');
	return { id: params.leadId, status: params.to };
};

export const listBusinessQuotes = async (db: D1Database, limit = 50) => {
	const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
	const result = await db
		.prepare(
			`SELECT
				q.id, q.lead_id AS leadId, q.version, q.currency, q.subtotal, q.discount, q.total,
				q.package_snapshot_json AS packageSnapshotJson,
				q.assumptions_json AS assumptionsJson, q.payload_hash AS payloadHash,
				q.status, q.expires_at AS expiresAt, q.created_by AS createdBy,
				q.created_at AS createdAt, q.updated_at AS updatedAt,
				l.contact_name AS contactName, l.organization_name AS organizationName
			 FROM business_quotes q
			 JOIN business_leads l ON l.id = q.lead_id
			 ORDER BY q.updated_at DESC
			 LIMIT ?`
		)
		.bind(safeLimit)
		.all();
	return result.results ?? [];
};

export const createBusinessQuote = async (
	db: D1Database,
	input: CreateBusinessQuoteInput,
	actor: BusinessActor
) => {
	await enforcePolicy(db, {
		action: 'create_quote_draft',
		actorType: actor.type,
		actorId: actor.id
	});
	const lead = await db
		.prepare('SELECT id, status FROM business_leads WHERE id = ?')
		.bind(input.leadId)
		.first<LeadRow>();
	if (!lead) throw new Error('Lead bisnis tidak ditemukan');
	assertBusinessTransition({ aggregate: 'lead', from: lead.status, to: 'quoted', event: 'quote_created' });

	const latest = await db
		.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM business_quotes WHERE lead_id = ?')
		.bind(input.leadId)
		.first<{ version: number | null }>();
	const version = Number(latest?.version ?? 0) + 1;
	const total = input.subtotal - input.discount;
	const id = newId('quote');
	const packageSnapshotJson = JSON.stringify(input.packageSnapshot);
	const assumptionsJson = JSON.stringify(input.assumptions);
	const payloadHash = await createPayloadHash({
		id,
		leadId: input.leadId,
		version,
		currency: input.currency,
		subtotal: input.subtotal,
		discount: input.discount,
		total,
		packageSnapshot: input.packageSnapshot,
		assumptions: input.assumptions,
		expiresAt: input.expiresAt
	});
	const now = Date.now();
	const mutationToken = newId('mutation');
	const transitionId = newId('transition');
	const auditId = newId('audit');
	const results = await db.batch([
		db
			.prepare(
				`INSERT INTO business_quotes (
					id, lead_id, version, currency, subtotal, discount, total,
					package_snapshot_json, assumptions_json, payload_hash, status,
					expires_at, created_by, created_at, updated_at
				 )
				 SELECT ?, id, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?
				 FROM business_leads WHERE id = ? AND status = 'qualified'`
			)
			.bind(
				id,
				version,
				input.currency,
				input.subtotal,
				input.discount,
				total,
				packageSnapshotJson,
				assumptionsJson,
				payloadHash,
				input.expiresAt,
				actor.id,
				now,
				now,
				input.leadId
			),
		db
			.prepare(
				`UPDATE business_leads SET status = 'quoted', updated_at = ?, mutation_token = ?
				 WHERE id = ? AND status = 'qualified'
				   AND EXISTS (SELECT 1 FROM business_quotes WHERE id = ?)`
			)
			.bind(now, mutationToken, input.leadId, id),
		db
			.prepare(
				`INSERT INTO business_state_transitions (
					id, aggregate_type, aggregate_id, from_state, to_state, event_type,
					actor_type, actor_id, reason, created_at
				 ) SELECT ?, 'lead', ?, 'qualified', 'quoted', 'quote_created', ?, ?, NULL, ?
				 WHERE EXISTS (
					SELECT 1 FROM business_leads
					WHERE id = ? AND status = 'quoted' AND mutation_token = ?
				 )
				   AND EXISTS (SELECT 1 FROM business_quotes WHERE id = ?)`
			)
			.bind(transitionId, input.leadId, actor.type, actor.id, now, input.leadId, mutationToken, id),
		db
			.prepare(
				`INSERT INTO business_audit_events (
					id, event_type, actor_type, actor_id, resource_type, resource_id, payload_json, created_at
				 ) SELECT ?, 'quote_created', ?, ?, 'quote', ?, ?, ?
				 WHERE EXISTS (
					SELECT 1 FROM business_leads
					WHERE id = ? AND status = 'quoted' AND mutation_token = ?
				 )
				   AND EXISTS (SELECT 1 FROM business_quotes WHERE id = ?)`
			)
			.bind(
				auditId,
				actor.type,
				actor.id,
				id,
				JSON.stringify({ leadId: input.leadId, version, total, currency: input.currency, payloadHash }),
				now,
				input.leadId,
				mutationToken,
				id
			)
	]);
	if (Number(results[1]?.meta?.changes ?? 0) !== 1) throw new Error('Lead tidak lagi siap dibuatkan quote');
	return { id, leadId: input.leadId, version, total, payloadHash, status: 'draft' as const };
};

export const requestQuoteApproval = async (db: D1Database, quoteId: string, actor: BusinessActor) => {
	await enforcePolicy(db, { action: 'request_approval', actorType: actor.type, actorId: actor.id });
	const quote = await db
		.prepare(
			`SELECT id, lead_id AS leadId, version, currency, subtotal, discount, total,
				package_snapshot_json AS packageSnapshotJson, assumptions_json AS assumptionsJson,
				payload_hash AS payloadHash, status, expires_at AS expiresAt, created_by AS createdBy
			 FROM business_quotes WHERE id = ?`
		)
		.bind(quoteId)
		.first<QuoteRow>();
	if (!quote) throw new Error('Quote bisnis tidak ditemukan');
	assertBusinessTransition({
		aggregate: 'quote',
		from: quote.status,
		to: 'awaiting_approval',
		event: 'approval_requested'
	});
	if (quote.expiresAt <= Date.now()) throw new Error('Quote sudah kedaluwarsa');

	const approvalId = newId('approval');
	const mutationToken = newId('mutation');
	const transitionId = newId('transition');
	const auditId = newId('audit');
	const now = Date.now();
	const approvalExpiresAt = Math.min(quote.expiresAt, now + 24 * 60 * 60 * 1000);
	const results = await db.batch([
		db
			.prepare(
				`INSERT INTO business_approvals (
					id, action_type, resource_type, resource_id, payload_hash, status,
					requested_by, requested_at, expires_at
				 )
				 SELECT ?, 'quote_approval', 'quote', id, payload_hash, 'pending', ?, ?, ?
				 FROM business_quotes WHERE id = ? AND status = 'draft'`
			)
			.bind(approvalId, actor.id, now, approvalExpiresAt, quoteId),
		db
			.prepare(
				`UPDATE business_quotes SET status = 'awaiting_approval', updated_at = ?, mutation_token = ?
				 WHERE id = ? AND status = 'draft'
				   AND EXISTS (SELECT 1 FROM business_approvals WHERE id = ? AND status = 'pending')`
			)
			.bind(now, mutationToken, quoteId, approvalId),
		db
			.prepare(
				`INSERT INTO business_state_transitions (
					id, aggregate_type, aggregate_id, from_state, to_state, event_type,
					actor_type, actor_id, reason, created_at
				 ) SELECT ?, 'quote', ?, 'draft', 'awaiting_approval', 'approval_requested', ?, ?, NULL, ?
				 WHERE EXISTS (SELECT 1 FROM business_approvals WHERE id = ? AND status = 'pending')
				   AND EXISTS (
					SELECT 1 FROM business_quotes
					WHERE id = ? AND status = 'awaiting_approval' AND mutation_token = ?
				   )`
			)
			.bind(transitionId, quoteId, actor.type, actor.id, now, approvalId, quoteId, mutationToken),
		db
			.prepare(
				`INSERT INTO business_audit_events (
					id, event_type, actor_type, actor_id, resource_type, resource_id, payload_json, created_at
				 ) SELECT ?, 'approval_requested', ?, ?, 'quote', ?, ?, ?
				 WHERE EXISTS (SELECT 1 FROM business_approvals WHERE id = ? AND status = 'pending')
				   AND EXISTS (
					SELECT 1 FROM business_quotes
					WHERE id = ? AND status = 'awaiting_approval' AND mutation_token = ?
				   )`
			)
			.bind(
				auditId,
				actor.type,
				actor.id,
				quoteId,
				JSON.stringify({ approvalId, payloadHash: quote.payloadHash, total: quote.total }),
				now,
				approvalId,
				quoteId,
				mutationToken
			)
	]);
	if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) {
		throw new Error('Quote tidak dapat diajukan untuk approval');
	}
	return { id: approvalId, quoteId, payloadHash: quote.payloadHash, status: 'pending' as const, expiresAt: approvalExpiresAt };
};

export const listPendingBusinessApprovals = async (db: D1Database, limit = 50) => {
	const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
	const result = await db
		.prepare(
			`SELECT
				a.id, a.action_type AS actionType, a.resource_type AS resourceType,
				a.resource_id AS resourceId, a.payload_hash AS payloadHash,
				a.status, a.requested_by AS requestedBy, a.requested_at AS requestedAt,
				a.expires_at AS expiresAt, q.total, q.currency,
				l.contact_name AS contactName, l.organization_name AS organizationName
			 FROM business_approvals a
			 LEFT JOIN business_quotes q ON a.resource_type = 'quote' AND q.id = a.resource_id
			 LEFT JOIN business_leads l ON l.id = q.lead_id
			 WHERE a.status = 'pending' AND a.expires_at > ?
			 ORDER BY a.requested_at ASC
			 LIMIT ?`
		)
		.bind(Date.now(), safeLimit)
		.all();
	return result.results ?? [];
};

const invalidateQuoteApproval = async (
	db: D1Database,
	approval: Pick<ApprovalRow, 'id' | 'resourceId'>,
	status: 'expired' | 'cancelled',
	event: 'approval_expired' | 'approval_cancelled',
	reason: string
) => {
	assertBusinessTransition({ aggregate: 'quote', from: 'awaiting_approval', to: 'draft', event });
	const now = Date.now();
	const mutationToken = newId('mutation');
	const results = await db.batch([
		db
			.prepare("UPDATE business_approvals SET status = ?, mutation_token = ? WHERE id = ? AND status = 'pending'")
			.bind(status, mutationToken, approval.id),
		db
			.prepare(
				`UPDATE business_quotes SET status = 'draft', updated_at = ?, mutation_token = ?
				 WHERE id = ? AND status = 'awaiting_approval'
				   AND EXISTS (
					SELECT 1 FROM business_approvals
					WHERE id = ? AND status = ? AND mutation_token = ?
				   )`
			)
			.bind(now, mutationToken, approval.resourceId, approval.id, status, mutationToken),
		db
			.prepare(
				`INSERT INTO business_state_transitions (
					id, aggregate_type, aggregate_id, from_state, to_state, event_type,
					actor_type, actor_id, reason, created_at
				 ) SELECT ?, 'quote', ?, 'awaiting_approval', 'draft', ?, 'system', 'business-agent-guard', ?, ?
				 WHERE EXISTS (
					SELECT 1 FROM business_quotes WHERE id = ? AND status = 'draft' AND mutation_token = ?
				 )`
			)
			.bind(newId('transition'), approval.resourceId, event, reason, now, approval.resourceId, mutationToken),
		db
			.prepare(
				`INSERT INTO business_audit_events (
					id, event_type, actor_type, actor_id, resource_type, resource_id, payload_json, created_at
				 ) SELECT ?, ?, 'system', 'business-agent-guard', 'approval', ?, ?, ?
				 WHERE EXISTS (
					SELECT 1 FROM business_approvals WHERE id = ? AND status = ? AND mutation_token = ?
				 )`
			)
			.bind(
				newId('audit'),
				event,
				approval.id,
				JSON.stringify({ quoteId: approval.resourceId, reason }),
				now,
				approval.id,
				status,
				mutationToken
			)
	]);
	if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) {
		throw new Error('Approval gagal dibatalkan karena status berubah');
	}
};

export const decideQuoteApproval = async (
	db: D1Database,
	params: { approvalId: string; decision: 'approve' | 'reject'; note?: string },
	actor: BusinessActor
) => {
	const approval = await db
		.prepare(
			`SELECT
				a.id, a.resource_id AS resourceId, a.payload_hash AS payloadHash,
				a.status, a.requested_by AS requestedBy, a.expires_at AS expiresAt,
				q.payload_hash AS currentPayloadHash
			 FROM business_approvals a
			 LEFT JOIN business_quotes q ON q.id = a.resource_id AND a.resource_type = 'quote'
			 WHERE a.id = ? AND a.action_type = 'quote_approval'`
		)
		.bind(params.approvalId)
		.first<ApprovalRow>();
	if (!approval) throw new Error('Approval bisnis tidak ditemukan');
	if (approval.status !== 'pending') throw new Error('Approval bisnis sudah diproses');
	if (approval.expiresAt <= Date.now()) {
		await invalidateQuoteApproval(db, approval, 'expired', 'approval_expired', 'approval_ttl_elapsed');
		throw new Error('Approval bisnis sudah kedaluwarsa');
	}
	if (!approval.currentPayloadHash || approval.currentPayloadHash !== approval.payloadHash) {
		await invalidateQuoteApproval(db, approval, 'cancelled', 'approval_cancelled', 'payload_hash_changed');
		throw new Error('Payload quote berubah; approval lama dibatalkan');
	}
	await enforcePolicy(db, {
		action: 'approve_quote',
		actorType: actor.type,
		actorId: actor.id,
		requestedBy: approval.requestedBy
	});

	const nextApprovalStatus = params.decision === 'approve' ? 'approved' : 'rejected';
	const nextQuoteStatus = params.decision === 'approve' ? 'approved' : 'rejected';
	const event = params.decision === 'approve' ? 'approval_granted' : 'approval_rejected';
	assertBusinessTransition({ aggregate: 'quote', from: 'awaiting_approval', to: nextQuoteStatus, event });
	const now = Date.now();
	const mutationToken = newId('mutation');
	const transitionId = newId('transition');
	const auditId = newId('audit');
	const orderId = params.decision === 'approve' ? newId('order') : null;
	const results = await db.batch([
		db
			.prepare(
				`UPDATE business_approvals
				 SET status = ?, decided_by = ?, decided_at = ?, decision_note = ?, mutation_token = ?
				 WHERE id = ? AND status = 'pending' AND expires_at > ? AND requested_by <> ?
				   AND payload_hash = ?`
			)
			.bind(
				nextApprovalStatus,
				actor.id,
				now,
				params.note ?? null,
				mutationToken,
				params.approvalId,
				now,
				actor.id,
				approval.currentPayloadHash
			),
		db
			.prepare(
				`UPDATE business_quotes SET status = ?, updated_at = ?, mutation_token = ?
				 WHERE id = ? AND status = 'awaiting_approval' AND payload_hash = ?
				   AND EXISTS (
					 SELECT 1 FROM business_approvals
					 WHERE id = ? AND status = ? AND decided_by = ? AND mutation_token = ?
				   )`
			)
			.bind(
				nextQuoteStatus,
				now,
				mutationToken,
				approval.resourceId,
				approval.payloadHash,
				params.approvalId,
				nextApprovalStatus,
				actor.id,
				mutationToken
			),
		...(orderId
			? [
					db
						.prepare(
							`INSERT INTO business_orders (
								id, lead_id, quote_id, status, created_at, updated_at
							 )
							 SELECT ?, q.lead_id, q.id, 'created', ?, ?
							 FROM business_quotes q
							 JOIN business_approvals a ON a.resource_id = q.id
							 WHERE q.id = ? AND q.status = 'approved' AND q.mutation_token = ?
							   AND a.id = ? AND a.status = 'approved' AND a.decided_by = ? AND a.mutation_token = ?`
						)
						.bind(orderId, now, now, approval.resourceId, mutationToken, params.approvalId, actor.id, mutationToken)
				]
			: []),
		db
			.prepare(
				`INSERT INTO business_state_transitions (
					id, aggregate_type, aggregate_id, from_state, to_state, event_type,
					actor_type, actor_id, reason, created_at
				 ) SELECT ?, 'quote', ?, 'awaiting_approval', ?, ?, ?, ?, ?, ?
				 WHERE EXISTS (
					 SELECT 1 FROM business_approvals
					 WHERE id = ? AND status = ? AND decided_by = ? AND mutation_token = ?
				 )
				   AND EXISTS (
					 SELECT 1 FROM business_quotes
					 WHERE id = ? AND status = ? AND mutation_token = ?
				 )`
			)
			.bind(
				transitionId,
				approval.resourceId,
				nextQuoteStatus,
				event,
				actor.type,
				actor.id,
				params.note ?? null,
				now,
				params.approvalId,
				nextApprovalStatus,
				actor.id,
				mutationToken,
				approval.resourceId,
				nextQuoteStatus,
				mutationToken
			),
		db
			.prepare(
				`INSERT INTO business_audit_events (
					id, event_type, actor_type, actor_id, resource_type, resource_id, payload_json, created_at
				 ) SELECT ?, ?, ?, ?, 'approval', ?, ?, ?
				 WHERE EXISTS (
					 SELECT 1 FROM business_approvals
					 WHERE id = ? AND status = ? AND decided_by = ? AND mutation_token = ?
				 )
				   AND EXISTS (
					 SELECT 1 FROM business_quotes
					 WHERE id = ? AND status = ? AND mutation_token = ?
				 )`
			)
			.bind(
				auditId,
				`approval_${nextApprovalStatus}`,
				actor.type,
				actor.id,
				params.approvalId,
				JSON.stringify({ quoteId: approval.resourceId, payloadHash: approval.payloadHash }),
				now,
				params.approvalId,
				nextApprovalStatus,
				actor.id,
				mutationToken,
				approval.resourceId,
				nextQuoteStatus,
				mutationToken
			)
	]);
	if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) {
		throw new Error('Approval gagal karena status berubah atau maker-checker ditolak');
	}
	if (orderId && Number(results[2]?.meta?.changes ?? 0) !== 1) {
		throw new Error('Order bisnis gagal dibuat setelah approval');
	}
	return {
		id: params.approvalId,
		quoteId: approval.resourceId,
		orderId,
		status: nextApprovalStatus
	};
};

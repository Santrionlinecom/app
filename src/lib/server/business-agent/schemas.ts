import { z } from 'zod';

const optionalTrimmedText = (max: number) =>
	z.preprocess(
		(value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined),
		z.string().max(max).optional()
	);

const optionalEmail = z.preprocess(
	(value) => (typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : undefined),
	z.string().email().max(254).optional()
);

export const createLeadSchema = z
	.object({
		source: z.enum(['web', 'telegram', 'admin', 'referral', 'import']),
		contactName: z.string().trim().min(2).max(120),
		contactEmail: optionalEmail,
		contactWhatsapp: optionalTrimmedText(32),
		organizationName: optionalTrimmedText(160),
		needSummary: z.string().trim().min(10).max(4000)
	})
	.refine((value) => Boolean(value.contactEmail || value.contactWhatsapp), {
		message: 'Email atau WhatsApp wajib diisi',
		path: ['contactEmail']
	});

export const createQuoteSchema = z
	.object({
		leadId: z.string().trim().min(1).max(128),
		subtotal: z.number().int().nonnegative().max(2_000_000_000),
		discount: z.number().int().nonnegative().max(2_000_000_000).default(0),
		currency: z.string().trim().length(3).toUpperCase().default('IDR'),
		packageSnapshot: z.record(z.string(), z.unknown()),
		assumptions: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
		expiresAt: z.number().int().positive()
	})
	.refine((value) => value.discount <= value.subtotal, {
		message: 'Diskon tidak boleh melebihi subtotal',
		path: ['discount']
	});

export const approvalDecisionSchema = z.object({
	decision: z.enum(['approve', 'reject']),
	note: optionalTrimmedText(1000)
});

export const leadTransitionSchema = z.object({
	to: z.enum(['discovery', 'qualified', 'quoted', 'lost']),
	event: z.enum(['discovery_started', 'lead_qualified', 'quote_created', 'lead_lost']),
	reason: optionalTrimmedText(1000)
});

export const businessAgentActionSchema = z.discriminatedUnion('action', [
	z.object({ action: z.literal('create_lead'), input: createLeadSchema }),
	z.object({
		action: z.literal('transition_lead'),
		input: leadTransitionSchema.extend({ leadId: z.string().trim().min(1).max(128) })
	}),
	z.object({ action: z.literal('create_quote'), input: createQuoteSchema }),
	z.object({
		action: z.literal('request_quote_approval'),
		input: z.object({ quoteId: z.string().trim().min(1).max(128) })
	})
]);

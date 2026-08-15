import type { D1Database } from '@cloudflare/workers-types';

export type SupportStatus = 'pending_contact' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
export type SupportQueueItem = { id:string; referenceCode:string; productTitle:string; status:SupportStatus; requestedAt:number; updatedAt:number; updatedBy:string|null };
const allowed: Record<SupportStatus, readonly SupportStatus[]> = {
	pending_contact: ['contacted', 'cancelled'],
	contacted: ['scheduled', 'cancelled'],
	scheduled: ['completed', 'cancelled'],
	completed: [],
	cancelled: []
};

export async function listSupportRequests(db: D1Database, status: SupportStatus) {
	const { results } = await db.prepare(`SELECT r.id, s.reference_code referenceCode, p.title productTitle,
		r.status, r.requested_at requestedAt, r.updated_at updatedAt, r.updated_by updatedBy
		FROM digital_support_requests r JOIN digital_product_sales s ON s.id=r.sale_id
		JOIN digital_products p ON p.id=s.product_id WHERE r.status=? ORDER BY r.updated_at ASC LIMIT 100`).bind(status).all<SupportQueueItem>();
	return results ?? [];
}

export async function transitionSupportRequest(db: D1Database, input: { id:string; expectedStatus:SupportStatus; nextStatus:SupportStatus; actorUserId:string; nowMs?:number }) {
	if (!allowed[input.expectedStatus].includes(input.nextStatus)) throw new Error('Transisi status Bantuan tidak diizinkan.');
	const now = input.nowMs ?? Date.now();
	const auditId = crypto.randomUUID();
	const results = await db.batch([
		db.prepare('UPDATE digital_support_requests SET status=?,updated_at=?,updated_by=? WHERE id=? AND status=?').bind(input.nextStatus, now, input.actorUserId, input.id, input.expectedStatus),
		db.prepare(`INSERT INTO digital_support_request_transitions(id,support_request_id,from_status,to_status,actor_user_id,created_at)
			SELECT ?,?,?,?, ?,? WHERE changes()=1`).bind(auditId,input.id,input.expectedStatus,input.nextStatus,input.actorUserId,now)
	]);
	if (Number(results[0]?.meta?.changes ?? 0) !== 1) throw new Error('Status Bantuan sudah berubah; muat ulang antrean.');
}
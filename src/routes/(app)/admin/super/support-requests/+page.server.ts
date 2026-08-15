import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { listSupportRequests, transitionSupportRequest, type SupportStatus } from '$lib/server/domains/digital-store/support-queue';
const statuses: SupportStatus[] = ['pending_contact','contacted','scheduled','completed','cancelled'];
export const load: PageServerLoad = async ({ locals, url }) => { const { db } = requireSuperAdmin(locals); const requested=url.searchParams.get('status') as SupportStatus; const status=statuses.includes(requested)?requested:'pending_contact'; return { requests:await listSupportRequests(db,status), status }; };
export const actions: Actions = { transition: async ({ locals, request }) => { const { db, user }=requireSuperAdmin(locals); const form=await request.formData(); try { await transitionSupportRequest(db,{id:String(form.get('id')??''),expectedStatus:String(form.get('expectedStatus')) as SupportStatus,nextStatus:String(form.get('nextStatus')) as SupportStatus,actorUserId:user.id}); } catch(error){ return fail(409,{message:(error as Error).message}); } return {success:true}; } };

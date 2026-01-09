import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    // Kita tidak perlu import database manual lagi.
    // Cukup kembalikan data user yang sedang login.
    
    return {
        user: locals.user
    };
};
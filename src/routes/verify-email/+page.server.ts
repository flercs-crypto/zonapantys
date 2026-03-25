import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	session: locals.user
});
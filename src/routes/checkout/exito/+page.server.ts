import { verifyAndSummarizeCheckoutSession } from '$lib/services/stripe-checkout.server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const sessionId = url.searchParams.get('session_id');

	if (!locals.user || !sessionId) {
		throw error(400, 'Missing checkout session');
	}

	try {
		const summary = await verifyAndSummarizeCheckoutSession(sessionId, locals.user);

		return {
			summary
		};
	} catch {
		throw error(404, 'Checkout session not found');
	}
};

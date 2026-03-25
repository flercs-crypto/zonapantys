import { resolvePublicSellerStorefront } from '$lib/services/seller-storefront.server';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const storefront = await resolvePublicSellerStorefront(params.sellerId);

	if (!storefront) {
		throw error(404, 'Seller not found');
	}

	throw redirect(301, `/vendedoras/${storefront.canonicalSlug}`);
};

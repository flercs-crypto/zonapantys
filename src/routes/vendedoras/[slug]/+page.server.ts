import { resolvePublicSellerStorefront } from '$lib/services/seller-storefront.server';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const storefront = await resolvePublicSellerStorefront(params.slug);

	if (!storefront) {
		throw error(404, 'Seller not found');
	}

	if (storefront.redirectRequired) {
		throw redirect(301, `/vendedoras/${storefront.canonicalSlug}`);
	}

	return {
		sellerSlug: storefront.canonicalSlug,
		seller: storefront.seller,
		products: storefront.products
	};
};
import { getSellerDirectory } from '$lib/services/seller-storefront.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		sellers: await getSellerDirectory()
	};
};
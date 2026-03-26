import { getLandingFeaturedProducts, getLandingTopSellers } from '$lib/services/landing.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [featuredProducts, topSellers] = await Promise.all([
		getLandingFeaturedProducts(),
		getLandingTopSellers()
	]);

	return {
		featuredProducts,
		topSellers
	};
};
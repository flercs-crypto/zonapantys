import type { FeaturedProduct, SellerCard } from '$lib/components/landing/data';
import { supabaseAdmin } from '$lib/supabase/server';
import { getSellerReviewStatsMap } from './reviews.server';

const PRODUCT_PLACEHOLDER_IMAGE =
	'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';

type SellerProfileRow = {
	avatar_url: string | null;
	display_name: string | null;
};

type LandingSellerRow = {
	id: string;
	store_name: string;
	store_slug: string;
	description: string | null;
	created_at: string;
	profiles: SellerProfileRow | SellerProfileRow[] | null;
};

type LandingProductSellerRow = {
	store_name: string;
	store_slug: string;
	is_active: boolean;
};

type LandingProductRow = {
	id: string;
	name: string;
	price: number;
	images: string[];
	sellers: LandingProductSellerRow | LandingProductSellerRow[] | null;
};

const getRelation = <TRelation>(value: TRelation | TRelation[] | null) => {
	if (Array.isArray(value)) {
		return value[0] ?? null;
	}

	return value;
};

export const getLandingTopSellers = async (): Promise<SellerCard[]> => {
	const { data, error } = await supabaseAdmin
		.from('sellers')
		.select('id, store_name, store_slug, description, created_at, profiles!inner(avatar_url, display_name)')
		.eq('is_active', true)
		.order('created_at', { ascending: false })
		.limit(3);

	if (error) {
		return [];
	}

	const sellers = (data ?? []) as LandingSellerRow[];
	const reviewStatsMap = await getSellerReviewStatsMap(sellers.map((seller) => seller.id));

	return sellers.map((seller) => {
		const profile = getRelation(seller.profiles);
		const reviewStats = reviewStatsMap.get(seller.id);

		return {
			id: seller.id,
			name: seller.store_name,
			rating: reviewStats?.averageRating ?? 0,
			reviewCount: reviewStats?.reviewCount ?? 0,
			description: seller.description,
			image: profile?.avatar_url ?? null
		};
	});
};

export const getLandingFeaturedProducts = async (): Promise<FeaturedProduct[]> => {
	const { data, error } = await supabaseAdmin
		.from('products')
		.select('id, name, price, images, sellers!inner(store_name, store_slug, is_active)')
		.eq('is_active', true)
		.eq('sellers.is_active', true)
		.order('created_at', { ascending: false })
		.limit(4);

	if (error) {
		return [];
	}

	return ((data ?? []) as LandingProductRow[])
		.map((product) => {
			const seller = getRelation(product.sellers);

			if (!seller) {
				return null;
			}

			return {
				id: product.id,
				name: product.name,
				price: Number(product.price),
				image: product.images[0] ?? PRODUCT_PLACEHOLDER_IMAGE,
				alt: product.name,
				sellerName: seller.store_name,
				href: `/vendedoras/${seller.store_slug}/tienda`
			};
		})
		.filter((product): product is FeaturedProduct => product !== null);
};
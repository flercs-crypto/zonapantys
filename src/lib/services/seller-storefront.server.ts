import {
	buildSellerProfile,
	getFallbackSellerProfile,
	mapProductToSellerStoreProduct,
	type SellerDirectoryEntry,
	type SellerProfile,
	type SellerStoreProduct
} from '$lib/components/shop-seller/data';
import { getSellerCompletedSalesCountMap, getSellerReviewStatsMap } from '$lib/services/reviews.server';
import { supabaseAdmin } from '$lib/supabase/server';
import type { Product, Seller } from '$lib/types/database.types';

type SellerStorefrontData = {
	seller: SellerProfile;
	products: SellerStoreProduct[];
};

export type ResolvedPublicSellerStorefront = SellerStorefrontData & {
	canonicalSlug: string;
	redirectRequired: boolean;
};

type SellerProfileRelation = {
	display_name: string | null;
	avatar_url: string | null;
	role?: string;
};

type SellerRecordWithProfile = Seller & {
	profiles: SellerProfileRelation | SellerProfileRelation[] | null;
};

type SellerDirectoryRow = Pick<
	Seller,
	'id' | 'store_name' | 'store_slug' | 'description' | 'logo_url' | 'is_active'
> & {
	profiles:
		| {
				display_name: string | null;
				avatar_url: string | null;
				role: string;
		  }
		| Array<{
				display_name: string | null;
				avatar_url: string | null;
				role: string;
		  }>
		| null;
};

const LEGACY_SELLER_ID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getSellerProfileRelation = (
	value: SellerDirectoryRow['profiles'] | SellerRecordWithProfile['profiles']
) => {
	if (Array.isArray(value)) {
		return value[0] ?? null;
	}

	return value;
};

export const isLegacySellerId = (value: string) => LEGACY_SELLER_ID_PATTERN.test(value);

const getSellerRecordBySlug = async (slug: string): Promise<SellerRecordWithProfile | null> => {
	const { data } = await supabaseAdmin
		.from('sellers')
		.select('*, profiles(display_name, avatar_url)')
		.eq('store_slug', slug)
		.eq('is_active', true)
		.maybeSingle<SellerRecordWithProfile>();

	return data ?? null;
};

const getSellerRecordById = async (sellerId: string): Promise<SellerRecordWithProfile | null> => {
	const { data } = await supabaseAdmin
		.from('sellers')
		.select('*, profiles(display_name, avatar_url)')
		.eq('id', sellerId)
		.eq('is_active', true)
		.maybeSingle<SellerRecordWithProfile>();

	return data ?? null;
};

const buildSellerStorefrontData = async (
	sellerRecord: SellerRecordWithProfile
): Promise<SellerStorefrontData> => {
	const profile = getSellerProfileRelation(sellerRecord.profiles);
	const sellerSlug = sellerRecord.store_slug || sellerRecord.id;
	const [products, reviewStatsBySellerId, completedSalesBySellerId] = await Promise.all([
		getSellerProducts(sellerRecord.id),
		getSellerReviewStatsMap([sellerRecord.id]),
		getSellerCompletedSalesCountMap([sellerRecord.id])
	]);
	const reviewStats = reviewStatsBySellerId.get(sellerRecord.id);
	const seller = buildSellerProfile(sellerRecord, profile?.avatar_url ?? null, sellerSlug, {
		averageRating: reviewStats?.averageRating ?? 0,
		reviewCount: reviewStats?.reviewCount ?? 0,
		positivePercentage: reviewStats?.positivePercentage ?? 0,
		itemsSoldCount: completedSalesBySellerId.get(sellerRecord.id) ?? 0
	});

	return {
		seller,
		products: products.map((product) => mapProductToSellerStoreProduct(product, seller))
	};
};

const getSellerProducts = async (sellerId: string): Promise<Product[]> => {
	const { data } = await supabaseAdmin
		.from('products')
		.select('*')
		.eq('seller_id', sellerId)
		.eq('is_active', true)
		.order('created_at', { ascending: false });

	return data ?? [];
};

export const getSellerDirectory = async (): Promise<SellerDirectoryEntry[]> => {
	const { data } = await supabaseAdmin
		.from('sellers')
		.select(
			'id, store_name, store_slug, description, logo_url, is_active, profiles!inner(display_name, avatar_url, role)'
		)
		.eq('is_active', true)
		.eq('profiles.role', 'seller')
		.order('created_at', { ascending: false });

	return ((data ?? []) as SellerDirectoryRow[]).map((seller) => {
		const profile = getSellerProfileRelation(seller.profiles);
		const fallback = getFallbackSellerProfile(seller.store_slug || seller.id);
		const sellerSlug = seller.store_slug || seller.id;

		return {
			id: seller.id,
			slug: sellerSlug,
			name: seller.store_name || profile?.display_name || fallback.name,
			bio: seller.description ?? fallback.bio,
			avatar: seller.logo_url ?? profile?.avatar_url ?? fallback.avatar
		};
	});
};

export const resolvePublicSellerStorefront = async (
	identifier: string
): Promise<ResolvedPublicSellerStorefront | null> => {
	const sellerRecordBySlug = await getSellerRecordBySlug(identifier);

	if (sellerRecordBySlug) {
		return {
			canonicalSlug: sellerRecordBySlug.store_slug,
			redirectRequired: false,
			...(await buildSellerStorefrontData(sellerRecordBySlug))
		};
	}

	if (!isLegacySellerId(identifier)) {
		return null;
	}

	const sellerRecordById = await getSellerRecordById(identifier);

	if (!sellerRecordById) {
		return null;
	}

	return {
		canonicalSlug: sellerRecordById.store_slug,
		redirectRequired: true,
		...(await buildSellerStorefrontData(sellerRecordById))
	};
};

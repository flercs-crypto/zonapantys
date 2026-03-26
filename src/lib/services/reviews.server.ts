import { supabaseAdmin } from '$lib/supabase/server';
import type { Order, OrderItem, Profile, Review } from '$lib/types/database.types';

export const REVIEWABLE_ORDER_STATUS = 'completed' as const;

export type SellerReviewStats = {
	averageRating: number;
	reviewCount: number;
	positivePercentage: number;
};

export type BuyerProductReviewState = {
	reviewId: string;
	rating: number;
};

type ReviewRow = Pick<Review, 'id' | 'seller_id' | 'product_id' | 'rating'>;
type CompletedOrderRow = Pick<Order, 'id' | 'seller_id'>;
type OrderItemQuantityRow = Pick<OrderItem, 'order_id' | 'quantity'>;

const EMPTY_SELLER_REVIEW_STATS: SellerReviewStats = {
	averageRating: 0,
	reviewCount: 0,
	positivePercentage: 0
};

const getProfileByFirebaseUid = async (firebaseUid: string): Promise<Profile | null> => {
	const { data, error } = await supabaseAdmin
		.from('profiles')
		.select('*')
		.eq('firebase_uid', firebaseUid)
		.maybeSingle();

	if (error) {
		return null;
	}

	return (data ?? null) as Profile | null;
};

export const getSellerReviewStatsMap = async (sellerIds: string[]) => {
	if (sellerIds.length === 0) {
		return new Map<string, SellerReviewStats>();
	}

	const { data, error } = await supabaseAdmin
		.from('reviews')
		.select('id, seller_id, product_id, rating')
		.in('seller_id', sellerIds);

	if (error) {
		return new Map<string, SellerReviewStats>();
	}

	const aggregates = new Map<string, { totalRating: number; reviewCount: number; positiveCount: number }>();

	for (const review of (data ?? []) as ReviewRow[]) {
		const current = aggregates.get(review.seller_id) ?? {
			totalRating: 0,
			reviewCount: 0,
			positiveCount: 0
		};

		current.totalRating += review.rating;
		current.reviewCount += 1;
		if (review.rating >= 4) {
			current.positiveCount += 1;
		}

		aggregates.set(review.seller_id, current);
	}

	return new Map(
		sellerIds.map((sellerId) => {
			const aggregate = aggregates.get(sellerId);

			if (!aggregate || aggregate.reviewCount === 0) {
				return [sellerId, EMPTY_SELLER_REVIEW_STATS] as const;
			}

			return [
				sellerId,
				{
					averageRating: Number((aggregate.totalRating / aggregate.reviewCount).toFixed(1)),
					reviewCount: aggregate.reviewCount,
					positivePercentage: Math.round((aggregate.positiveCount / aggregate.reviewCount) * 100)
				}
			] as const;
		})
	);
};

export const getSellerCompletedSalesCountMap = async (sellerIds: string[]) => {
	if (sellerIds.length === 0) {
		return new Map<string, number>();
	}

	const { data: ordersData, error: ordersError } = await supabaseAdmin
		.from('orders')
		.select('id, seller_id')
		.in('seller_id', sellerIds)
		.eq('status', REVIEWABLE_ORDER_STATUS);

	if (ordersError) {
		return new Map<string, number>();
	}

	const orders = ((ordersData ?? []) as CompletedOrderRow[]).filter(
		(order): order is CompletedOrderRow & { seller_id: string } => typeof order.seller_id === 'string'
	);

	if (orders.length === 0) {
		return new Map<string, number>();
	}

	const sellerIdByOrderId = new Map(orders.map((order) => [order.id, order.seller_id]));
	const { data: orderItemsData, error: orderItemsError } = await supabaseAdmin
		.from('order_items')
		.select('order_id, quantity')
		.in(
			'order_id',
			orders.map((order) => order.id)
		);

	if (orderItemsError) {
		return new Map<string, number>();
	}

	const quantitiesBySellerId = new Map<string, number>();

	for (const item of (orderItemsData ?? []) as OrderItemQuantityRow[]) {
		const sellerId = sellerIdByOrderId.get(item.order_id);

		if (!sellerId) {
			continue;
		}

		quantitiesBySellerId.set(sellerId, (quantitiesBySellerId.get(sellerId) ?? 0) + item.quantity);
	}

	return quantitiesBySellerId;
};

export const getBuyerReviewStateMap = async (profileId: string, productIds: string[]) => {
	if (productIds.length === 0) {
		return new Map<string, BuyerProductReviewState>();
	}

	const { data, error } = await supabaseAdmin
		.from('reviews')
		.select('id, product_id, rating')
		.eq('buyer_id', profileId)
		.in('product_id', productIds);

	if (error) {
		return new Map<string, BuyerProductReviewState>();
	}

	return new Map(
		(data ?? [])
			.map((review) => {
				if (typeof review.product_id !== 'string') {
					return null;
				}

				return [
					review.product_id,
					{
						reviewId: review.id,
						rating: review.rating
					}
				] as const;
			})
			.filter((entry): entry is readonly [string, BuyerProductReviewState] => entry !== null)
	);
};

export const createReviewForBuyer = async (
	firebaseUid: string,
	input: {
		orderId: string;
		productId: string;
		rating: number;
		comment: string;
	}
) => {
	const buyerProfile = await getProfileByFirebaseUid(firebaseUid);

	if (!buyerProfile) {
		return { success: false as const, code: 'buyer/not-found' };
	}

	if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
		return { success: false as const, code: 'review/invalid-rating' };
	}

	const { data: existingReview, error: existingReviewError } = await supabaseAdmin
		.from('reviews')
		.select('id')
		.eq('buyer_id', buyerProfile.id)
		.eq('product_id', input.productId)
		.maybeSingle();

	if (existingReviewError) {
		return { success: false as const, code: 'review/query-failed' };
	}

	if (existingReview?.id) {
		return { success: false as const, code: 'review/already-exists' };
	}

	const { data: order, error: orderError } = await supabaseAdmin
		.from('orders')
		.select('id, buyer_id, seller_id, status')
		.eq('id', input.orderId)
		.eq('buyer_id', buyerProfile.id)
		.eq('status', REVIEWABLE_ORDER_STATUS)
		.maybeSingle();

	if (orderError || !order) {
		return { success: false as const, code: 'review/order-not-eligible' };
	}

	const { data: orderItem, error: orderItemError } = await supabaseAdmin
		.from('order_items')
		.select('id')
		.eq('order_id', input.orderId)
		.eq('product_id', input.productId)
		.limit(1)
		.maybeSingle();

	if (orderItemError || !orderItem) {
		return { success: false as const, code: 'review/order-not-eligible' };
	}

	const { data: product, error: productError } = await supabaseAdmin
		.from('products')
		.select('id, seller_id')
		.eq('id', input.productId)
		.maybeSingle();

	if (productError || !product) {
		return { success: false as const, code: 'review/product-not-found' };
	}

	if (order.seller_id && product.seller_id !== order.seller_id) {
		return { success: false as const, code: 'review/order-not-eligible' };
	}

	const normalizedComment = input.comment.trim();
	const { data: insertedReview, error: insertError } = await supabaseAdmin
		.from('reviews')
		.insert({
			seller_id: product.seller_id,
			buyer_id: buyerProfile.id,
			product_id: input.productId,
			order_id: input.orderId,
			rating: input.rating,
			comment: normalizedComment.length > 0 ? normalizedComment : null
		})
		.select('id')
		.single();

	if (insertError || !insertedReview) {
		return { success: false as const, code: 'review/insert-failed' };
	}

	return {
		success: true as const,
		reviewId: insertedReview.id
	};
};
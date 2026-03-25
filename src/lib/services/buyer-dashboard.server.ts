import { getPrimaryAppRole, normalizeAppRoles } from '$lib/auth/roles';
import { supabaseAdmin } from '$lib/supabase/server';
import type { Favorite, Order, OrderItem, Product, Profile, Seller } from '$lib/types/database.types';

const COMPLETED_ORDER_STATUSES = ['completed', 'confirmed', 'shipped', 'delivered'] as const;
const PURCHASES_PAGE_SIZE = 10;
const PRODUCT_PLACEHOLDER_IMAGE =
	'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';

export type BuyerDashboardOrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export type OwnedBuyerContext = {
	profile: Profile;
};

export type BuyerDashboardProfile = {
	id: string;
	email: string;
	displayName: string;
	avatarUrl: string | null;
	memberSince: string;
	isGoogleAccount: boolean;
	firebaseUid: string;
};

export type BuyerDashboardRecentActivity = {
	orderId: string;
	orderNumber: string;
	createdAt: string;
	total: number;
	status: BuyerDashboardOrderStatus;
};

export type BuyerDashboardFavoriteItem = {
	favoriteId: string;
	productId: string;
	name: string;
	price: number;
	image: string;
	sellerName: string;
	sellerSlug: string;
	createdAt: string;
	storeHref: string;
	productHref: string;
	isAvailable: boolean;
	alt: string;
};

export type BuyerDashboardOrderItem = {
	productId: string | null;
	productName: string;
	image: string;
	quantity: number;
	unitPrice: number;
	total: number;
};

export type BuyerDashboardOrder = {
	id: string;
	orderNumber: string;
	createdAt: string;
	total: number;
	status: BuyerDashboardOrderStatus;
	products: BuyerDashboardOrderItem[];
};

export type BuyerDashboardOrdersPage = {
	items: BuyerDashboardOrder[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
};

export type BuyerDashboardData = {
	profile: BuyerDashboardProfile;
	recentActivity: BuyerDashboardRecentActivity[];
	favorites: BuyerDashboardFavoriteItem[];
	savedPreview: BuyerDashboardFavoriteItem[];
	ordersPage: BuyerDashboardOrdersPage;
};

type FavoriteRow = Pick<Favorite, 'id' | 'profile_id' | 'product_id' | 'created_at'>;
type ProductCardRecord = Pick<Product, 'id' | 'seller_id' | 'name' | 'images' | 'price' | 'is_active'>;
type OrderRecord = Pick<Order, 'id' | 'total' | 'status' | 'created_at'>;
type ProductOrderRecord = Pick<Product, 'id' | 'name' | 'images'>;
type SellerRecord = Pick<Seller, 'id' | 'store_name' | 'store_slug'>;

const buildOrderNumber = (orderId: string) => `#${orderId.slice(0, 8).toUpperCase()}`;

const buildStoreHref = (sellerSlug: string) => `/vendedoras/${sellerSlug}/tienda`;

const buildProductHref = (sellerSlug: string) => `/vendedoras/${sellerSlug}/tienda`;

const normalizeProfile = (profile: Profile | null): Profile | null => {
	if (!profile) {
		return null;
	}

	const roles = normalizeAppRoles(profile.roles, profile.role);
	const role = getPrimaryAppRole(roles, profile.role);

	return role || roles.length > 0
		? {
				...profile,
				role,
				roles
			}
		: null;
};

export const normalizeBuyerOrderStatus = (status: string): BuyerDashboardOrderStatus => {
	if (status === 'cancelled') {
		return 'cancelled';
	}

	if (status === 'shipped') {
		return 'shipped';
	}

	if (status === 'confirmed') {
		return 'processing';
	}

	if (status === 'pending') {
		return 'pending';
	}

	return 'completed';
};

const getOrderItemsByOrderIds = async (orderIds: string[]) => {
	if (orderIds.length === 0) {
		return [] as OrderItem[];
	}

	const { data, error } = await supabaseAdmin
		.from('order_items')
		.select('id, order_id, product_id, quantity, unit_price')
		.in('order_id', orderIds);

	if (error) {
		return [] as OrderItem[];
	}

	return (data ?? []) as OrderItem[];
};

const getProductsByIds = async <TProduct extends ProductCardRecord | ProductOrderRecord>(
	productIds: string[],
	selection: string
) => {
	if (productIds.length === 0) {
		return new Map<string, TProduct>();
	}

	const { data, error } = await supabaseAdmin.from('products').select(selection).in('id', productIds);

	if (error) {
		return new Map<string, TProduct>();
	}

	return new Map(((data ?? []) as unknown as TProduct[]).map((product) => [product.id, product]));
};

const getSellersByIds = async (sellerIds: string[]) => {
	if (sellerIds.length === 0) {
		return new Map<string, SellerRecord>();
	}

	const { data, error } = await supabaseAdmin
		.from('sellers')
		.select('id, store_name, store_slug')
		.in('id', sellerIds);

	if (error) {
		return new Map<string, SellerRecord>();
	}

	return new Map(((data ?? []) as SellerRecord[]).map((seller) => [seller.id, seller]));
};

const getFavoritesForProfile = async (profileId: string): Promise<BuyerDashboardFavoriteItem[]> => {
	const { data, error } = await supabaseAdmin
		.from('favorites')
		.select('id, profile_id, product_id, created_at')
		.eq('profile_id', profileId)
		.order('created_at', { ascending: false });

	if (error) {
		return [];
	}

	const favorites = (data ?? []) as FavoriteRow[];
	const productIds = [...new Set(favorites.map((favorite) => favorite.product_id))];
	const products = await getProductsByIds<ProductCardRecord>(
		productIds,
		'id, seller_id, name, images, price, is_active'
	);
	const sellerIds = [...new Set([...products.values()].map((product) => product.seller_id))];
	const sellers = await getSellersByIds(sellerIds);

	return favorites.flatMap((favorite) => {
		const product = products.get(favorite.product_id);

		if (!product) {
			return [];
		}

		const seller = sellers.get(product.seller_id);
		const sellerSlug = seller?.store_slug ?? product.seller_id;
		const sellerName = seller?.store_name?.trim() || 'Tienda';

		return [
			{
				favoriteId: favorite.id,
				productId: product.id,
				name: product.name,
				price: Number(product.price),
				image: product.images[0] || PRODUCT_PLACEHOLDER_IMAGE,
				sellerName,
				sellerSlug,
				createdAt: favorite.created_at,
				storeHref: buildStoreHref(sellerSlug),
				productHref: buildProductHref(sellerSlug),
				isAvailable: product.is_active,
				alt: product.name
			}
		];
	});
};

const buildOrdersPage = async (
	profileId: string,
	page: number
): Promise<BuyerDashboardOrdersPage> => {
	const safePage = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 1;
	const countResult = await supabaseAdmin
		.from('orders')
		.select('id', { count: 'exact', head: true })
		.eq('buyer_id', profileId);
	const totalItems = countResult.count ?? 0;
	const totalPages = Math.max(1, Math.ceil(totalItems / PURCHASES_PAGE_SIZE));
	const normalizedPage = Math.min(safePage, totalPages);
	const rangeFrom = (normalizedPage - 1) * PURCHASES_PAGE_SIZE;
	const rangeTo = rangeFrom + PURCHASES_PAGE_SIZE - 1;
	const ordersResult = await supabaseAdmin
		.from('orders')
		.select('id, total, status, created_at')
		.eq('buyer_id', profileId)
		.order('created_at', { ascending: false })
		.range(rangeFrom, rangeTo);

	if (ordersResult.error) {
		return {
			items: [],
			page: normalizedPage,
			pageSize: PURCHASES_PAGE_SIZE,
			totalItems,
			totalPages
		};
	}

	const orders = (ordersResult.data ?? []) as OrderRecord[];
	const orderIds = orders.map((order) => order.id);
	const orderItems = await getOrderItemsByOrderIds(orderIds);
	const productIds = [...new Set(orderItems.flatMap((item) => (item.product_id ? [item.product_id] : [])))];
	const products = await getProductsByIds<ProductOrderRecord>(productIds, 'id, name, images');
	const itemsByOrder = new Map<string, BuyerDashboardOrderItem[]>();

	for (const item of orderItems) {
		const orderList = itemsByOrder.get(item.order_id) ?? [];
		const product = item.product_id ? products.get(item.product_id) : null;

		orderList.push({
			productId: item.product_id,
			productName: product?.name ?? 'Producto eliminado',
			image: product?.images[0] ?? PRODUCT_PLACEHOLDER_IMAGE,
			quantity: item.quantity,
			unitPrice: Number(item.unit_price),
			total: Number(item.unit_price) * item.quantity
		});

		itemsByOrder.set(item.order_id, orderList);
	}

	return {
		items: orders.map((order) => ({
			id: order.id,
			orderNumber: buildOrderNumber(order.id),
			createdAt: order.created_at,
			total: Number(order.total),
			status: normalizeBuyerOrderStatus(order.status),
			products: itemsByOrder.get(order.id) ?? []
		})),
		page: normalizedPage,
		pageSize: PURCHASES_PAGE_SIZE,
		totalItems,
		totalPages
	};
};

const getRecentActivity = async (profileId: string): Promise<BuyerDashboardRecentActivity[]> => {
	const { data, error } = await supabaseAdmin
		.from('orders')
		.select('id, total, status, created_at')
		.eq('buyer_id', profileId)
		.order('created_at', { ascending: false })
		.limit(5);

	if (error) {
		return [];
	}

	return ((data ?? []) as OrderRecord[]).map((order) => ({
		orderId: order.id,
		orderNumber: buildOrderNumber(order.id),
		createdAt: order.created_at,
		total: Number(order.total),
		status: normalizeBuyerOrderStatus(order.status)
	}));
};

export const getBuyerDashboardContext = async (
	firebaseUid: string
): Promise<OwnedBuyerContext | null> => {
	const { data: profileRecord } = await supabaseAdmin
		.from('profiles')
		.select('*')
		.eq('firebase_uid', firebaseUid)
		.maybeSingle();

	const profile = normalizeProfile((profileRecord ?? null) as Profile | null);

	if (!profile) {
		return null;
	}

	return {
		profile
	};
};

export const getFavoriteProductIds = async (
	firebaseUid: string,
	productIds: string[]
): Promise<string[]> => {
	if (productIds.length === 0) {
		return [];
	}

	const context = await getBuyerDashboardContext(firebaseUid);

	if (!context) {
		return [];
	}

	const { data, error } = await supabaseAdmin
		.from('favorites')
		.select('product_id')
		.eq('profile_id', context.profile.id)
		.in('product_id', productIds);

	if (error) {
		return [];
	}

	return (data ?? [])
		.map((entry) => entry.product_id)
		.filter((productId): productId is string => typeof productId === 'string');
};

export const toggleFavoriteProduct = async (firebaseUid: string, productId: string) => {
	const context = await getBuyerDashboardContext(firebaseUid);

	if (!context) {
		return { success: false as const, code: 'buyer/not-found' };
	}

	const { data: product, error: productError } = await supabaseAdmin
		.from('products')
		.select('id')
		.eq('id', productId)
		.maybeSingle();

	if (productError || !product) {
		return { success: false as const, code: 'favorite/product-not-found' };
	}

	const { data: existingFavorite } = await supabaseAdmin
		.from('favorites')
		.select('id')
		.eq('profile_id', context.profile.id)
		.eq('product_id', productId)
		.maybeSingle();

	if (existingFavorite?.id) {
		const { error: deleteError } = await supabaseAdmin
			.from('favorites')
			.delete()
			.eq('id', existingFavorite.id)
			.eq('profile_id', context.profile.id);

		if (deleteError) {
			return { success: false as const, code: 'favorite/delete-failed' };
		}

		return { success: true as const, state: 'removed' as const };
	}

	const { error: insertError } = await supabaseAdmin.from('favorites').insert({
		profile_id: context.profile.id,
		product_id: productId
	});

	if (insertError) {
		return { success: false as const, code: 'favorite/insert-failed' };
	}

	return { success: true as const, state: 'saved' as const };
};

export const removeFavoriteProduct = async (firebaseUid: string, productId: string) => {
	const context = await getBuyerDashboardContext(firebaseUid);

	if (!context) {
		return { success: false as const, code: 'buyer/not-found' };
	}

	const { error } = await supabaseAdmin
		.from('favorites')
		.delete()
		.eq('profile_id', context.profile.id)
		.eq('product_id', productId);

	if (error) {
		return { success: false as const, code: 'favorite/delete-failed' };
	}

	return { success: true as const };
};

export const getBuyerDashboardData = async (options: {
	firebaseUid: string;
	fallbackEmail: string | null;
	fallbackDisplayName: string | null;
	fallbackAvatarUrl: string | null;
	isGoogleAccount: boolean;
	purchasesPage: number;
}): Promise<BuyerDashboardData | null> => {
	const context = await getBuyerDashboardContext(options.firebaseUid);

	if (!context) {
		return null;
	}

	const [recentActivity, favorites, ordersPage] = await Promise.all([
		getRecentActivity(context.profile.id),
		getFavoritesForProfile(context.profile.id),
		buildOrdersPage(context.profile.id, options.purchasesPage)
	]);

	const displayName =
		context.profile.display_name?.trim() ||
		options.fallbackDisplayName?.trim() ||
		context.profile.email ||
		options.fallbackEmail ||
		'Comprador';
	const email = options.fallbackEmail ?? context.profile.email;

	return {
		profile: {
			id: context.profile.id,
			email,
			displayName,
			avatarUrl: context.profile.avatar_url ?? options.fallbackAvatarUrl,
			memberSince: context.profile.created_at,
			isGoogleAccount: options.isGoogleAccount,
			firebaseUid: context.profile.firebase_uid
		},
		recentActivity,
		favorites,
		savedPreview: favorites.slice(0, 4),
		ordersPage
	};
};
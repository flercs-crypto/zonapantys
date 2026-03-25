import { getPrimaryAppRole, normalizeAppRoles } from '$lib/auth/roles';
import { sendShippingNotificationEmail } from '$lib/server/transactional-emails';
import { supabaseAdmin } from '$lib/supabase/server';
import type { Order, OrderItem, Product, Profile, Seller } from '$lib/types/database.types';

export const ADMIN_DASHBOARD_SECTIONS = [
	'panel',
	'users',
	'sellers',
	'products',
	'orders',
	'reports',
	'settings'
] as const;

export type AdminDashboardSection = (typeof ADMIN_DASHBOARD_SECTIONS)[number];
export type AdminRoleFilter = 'all' | 'buyer' | 'seller' | 'admin';
export type AdminSellerStatusFilter = 'all' | 'active' | 'inactive';
export type AdminProductStatusFilter = 'all' | 'active' | 'inactive' | 'out_of_stock';
export type AdminOrderStatusFilter =
	| 'all'
	| 'pending'
	| 'processing'
	| 'shipped'
	| 'completed'
	| 'cancelled';
export type AdminMutableRole = 'buyer' | 'seller' | 'admin';
export type AdminMutableOrderStatus = Exclude<AdminOrderStatusFilter, 'all'>;
export type AdminPanelOrderStatus = 'completed' | 'processing' | 'pending' | 'cancelled' | 'shipped';

export type AdminDashboardProfile = {
	id: string;
	displayName: string;
	email: string;
	avatarUrl: string | null;
	createdAt: string;
	isGoogleAccount: boolean;
	firebaseUid: string;
	isActive: boolean;
	roles: Array<'buyer' | 'seller' | 'admin'>;
};

export type AdminMetricCard = {
	value: number;
	change: number;
	progress: number;
};

export type AdminPanelOrder = {
	id: string;
	orderNumber: string;
	customerName: string;
	status: AdminPanelOrderStatus;
	amount: number;
	createdAt: string;
};

export type AdminPanelSeller = {
	id: string;
	storeName: string;
	storeSlug: string;
	logoUrl: string | null;
	createdAt: string;
	highlightHref: string;
	storeHref: string;
};

export type AdminOverviewSectionData = {
	stats: {
		totalUsers: AdminMetricCard;
		activeSellers: AdminMetricCard;
		monthlySales: AdminMetricCard;
	};
	recentOrders: AdminPanelOrder[];
	newSellers: AdminPanelSeller[];
};

export type AdminUsersRow = {
	id: string;
	avatarUrl: string | null;
	name: string;
	email: string;
	roles: Array<'buyer' | 'seller' | 'admin'>;
	createdAt: string;
	isActive: boolean;
	isCurrentAdmin: boolean;
};

export type AdminUsersSectionData = {
	items: AdminUsersRow[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	search: string;
	roleFilter: AdminRoleFilter;
};

export type AdminSellersRow = {
	id: string;
	logoUrl: string | null;
	storeName: string;
	storeSlug: string;
	isActive: boolean;
	createdAt: string;
	totalProducts: number;
	totalSales: number;
	storeHref: string;
	highlightHref: string;
};

export type AdminSellersSectionData = {
	items: AdminSellersRow[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	search: string;
	statusFilter: AdminSellerStatusFilter;
	highlightSellerId: string | null;
};

export type AdminProductsRow = {
	id: string;
	imageUrl: string | null;
	name: string;
	sellerName: string;
	sellerSlug: string | null;
	price: number;
	stock: number;
	isActive: boolean;
	createdAt: string;
};

export type AdminProductsSectionData = {
	items: AdminProductsRow[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	search: string;
	statusFilter: AdminProductStatusFilter;
};

export type AdminOrderItemDetail = {
	id: string;
	productName: string;
	quantity: number;
	unitPrice: number;
	total: number;
};

export type AdminOrdersRow = {
	id: string;
	orderNumber: string;
	buyerName: string;
	sellerName: string;
	total: number;
	status: AdminMutableOrderStatus;
	trackingNumber: string | null;
	shippingProvider: string | null;
	shippedAt: string | null;
	createdAt: string;
	items: AdminOrderItemDetail[];
};

export type AdminOrdersSectionData = {
	items: AdminOrdersRow[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	search: string;
	statusFilter: AdminOrderStatusFilter;
};

export type AdminReportPoint = {
	month: string;
	value: number;
};

export type AdminTopSeller = {
	id: string;
	name: string;
	storeSlug: string;
	value: number;
};

export type AdminTopProduct = {
	id: string;
	name: string;
	value: number;
};

export type AdminReportsSectionData = {
	revenueByMonth: AdminReportPoint[];
	newUsersByMonth: AdminReportPoint[];
	topSellers: AdminTopSeller[];
	topProducts: AdminTopProduct[];
};

const PAGE_SIZE = 20;
const PAID_ORDER_STATUSES = ['completed', 'confirmed', 'shipped', 'delivered'] as const;

type ProfileIdentityRecord = Pick<Profile, 'id' | 'display_name' | 'email' | 'avatar_url'>;
type SellerIdentityRecord = Pick<Seller, 'id' | 'store_name' | 'store_slug' | 'logo_url'>;

const startOfUtcMonth = (date: Date) =>
	new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const addUtcMonths = (date: Date, months: number) =>
	new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));

const buildOrderNumber = (orderId: string) => `#ORD-${orderId.slice(0, 8).toUpperCase()}`;

const clampProgress = (value: number) => Math.max(12, Math.min(100, Math.round(value)));

const sanitizeSearch = (value: string | null | undefined) =>
	(value ?? '').trim().replace(/[,%()]/g, '').slice(0, 80);

const normalizePage = (value: string | null | undefined) => {
	const parsed = Number(value ?? '1');
	return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 1;
};

const normalizeRoles = (profile: Pick<Profile, 'role' | 'roles'>) =>
	normalizeAppRoles(profile.roles, profile.role) as Array<'buyer' | 'seller' | 'admin'>;

const normalizeProfile = (profile: Profile | null): Profile | null => {
	if (!profile) {
		return null;
	}

	const roles = normalizeRoles(profile);
	const primaryRole = getPrimaryAppRole(roles, profile.role);

	return {
		...profile,
		role: primaryRole,
		roles,
		is_active: profile.is_active ?? true
	};
	};

const toAdminProfile = (
	profile: Profile,
	options: {
		fallbackDisplayName: string | null;
		fallbackEmail: string | null;
		fallbackAvatarUrl: string | null;
		isGoogleAccount: boolean;
	}
): AdminDashboardProfile => ({
	id: profile.id,
	displayName: profile.display_name ?? options.fallbackDisplayName ?? options.fallbackEmail ?? 'Admin',
	email: profile.email ?? options.fallbackEmail ?? '',
	avatarUrl: profile.avatar_url ?? options.fallbackAvatarUrl,
	createdAt: profile.created_at,
	isGoogleAccount: options.isGoogleAccount,
	firebaseUid: profile.firebase_uid,
	isActive: profile.is_active ?? true,
	roles: normalizeRoles(profile)
});

const getMonthKey = (value: string) => value.slice(0, 7);

const buildTrailingMonthBuckets = (length: number) => {
	const currentMonth = startOfUtcMonth(new Date());
	return Array.from({ length }, (_, index) => {
		const month = addUtcMonths(currentMonth, -(length - 1 - index));
		return month.toISOString().slice(0, 7);
	});
};

const buildGrowthRate = (current: number, previous: number) => {
	if (previous === 0) {
		return current > 0 ? 100 : 0;
	}

	return Number((((current - previous) / previous) * 100).toFixed(1));
};

const paginateRange = (page: number, totalItems: number, pageSize = PAGE_SIZE) => {
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const normalizedPage = Math.min(Math.max(page, 1), totalPages);
	const from = (normalizedPage - 1) * pageSize;
	const to = from + pageSize - 1;

	return {
		page: normalizedPage,
		pageSize,
		totalPages,
		from,
		to
	};
};

const mapProfileNames = async (profileIds: string[]) => {
	if (profileIds.length === 0) {
		return new Map<string, ProfileIdentityRecord>();
	}

	const { data, error } = await supabaseAdmin
		.from('profiles')
		.select('id, display_name, email, avatar_url')
		.in('id', profileIds);

	if (error) {
		return new Map<string, ProfileIdentityRecord>();
	}

	return new Map(
		((data ?? []) as ProfileIdentityRecord[]).map((profile) => [profile.id, profile])
	);
};

const mapSellerIdentities = async (sellerIds: string[]) => {
	if (sellerIds.length === 0) {
		return new Map<string, SellerIdentityRecord>();
	}

	const { data, error } = await supabaseAdmin
		.from('sellers')
		.select('id, store_name, store_slug, logo_url')
		.in('id', sellerIds);

	if (error) {
		return new Map<string, SellerIdentityRecord>();
	}

	return new Map(((data ?? []) as SellerIdentityRecord[]).map((seller) => [seller.id, seller]));
};

const mapProductNames = async (productIds: string[]) => {
	if (productIds.length === 0) {
		return new Map<string, Pick<Product, 'id' | 'name'>>();
	}

	const { data, error } = await supabaseAdmin.from('products').select('id, name').in('id', productIds);

	if (error) {
		return new Map<string, Pick<Product, 'id' | 'name'>>();
	}

	return new Map(((data ?? []) as Array<Pick<Product, 'id' | 'name'>>).map((product) => [product.id, product]));
};

const normalizePanelOrderStatus = (status: string): AdminPanelOrderStatus => {
	if (status === 'shipped') {
		return 'shipped';
	}

	if (status === 'completed') {
		return 'completed';
	}

	if (status === 'cancelled') {
		return 'cancelled';
	}

	if (status === 'pending') {
		return 'pending';
	}

	return 'processing';
};

const normalizeMutableOrderStatus = (status: string): AdminMutableOrderStatus => {
	if (status === 'shipped') {
		return 'shipped';
	}

	if (status === 'cancelled') {
		return 'cancelled';
	}

	if (status === 'completed' || status === 'delivered') {
		return 'completed';
	}

	if (status === 'pending') {
		return 'pending';
	}

	return 'processing';
};

const toDatabaseOrderStatus = (status: AdminMutableOrderStatus): Order['status'] => {
	if (status === 'processing') {
		return 'confirmed';
	}

	return status;
};

const getCompletedOrdersSince = async (sinceIso: string) => {
	const { data, error } = await supabaseAdmin
		.from('orders')
		.select('id, seller_id, total, status, created_at')
		.in('status', [...PAID_ORDER_STATUSES])
		.gte('created_at', sinceIso)
		.order('created_at', { ascending: true });

	if (error) {
		return [] as Array<Pick<Order, 'id' | 'seller_id' | 'total' | 'status' | 'created_at'>>;
	}

	return (data ?? []) as Array<Pick<Order, 'id' | 'seller_id' | 'total' | 'status' | 'created_at'>>;
	};

export const normalizeAdminSection = (value: string | null | undefined): AdminDashboardSection => {
	if (value && ADMIN_DASHBOARD_SECTIONS.includes(value as AdminDashboardSection)) {
		return value as AdminDashboardSection;
	}

	return 'panel';
};

export const getAdminDashboardProfile = async (
	firebaseUid: string,
	options: {
		fallbackDisplayName: string | null;
		fallbackEmail: string | null;
		fallbackAvatarUrl: string | null;
		isGoogleAccount: boolean;
	}
): Promise<AdminDashboardProfile | null> => {
	const { data, error } = await supabaseAdmin
		.from('profiles')
		.select('*')
		.eq('firebase_uid', firebaseUid)
		.maybeSingle();

	if (error) {
		return null;
	}

	const profile = normalizeProfile((data ?? null) as Profile | null);

	if (!profile) {
		return null;
	}

	return toAdminProfile(profile, options);
};

export const getAdminOverviewSectionData = async (): Promise<AdminOverviewSectionData> => {
	const now = new Date();
	const currentMonthStart = startOfUtcMonth(now);
	const previousMonthStart = addUtcMonths(currentMonthStart, -1);
	const nextMonthStart = addUtcMonths(currentMonthStart, 1);
	const [
		totalUsersResult,
		currentUsersResult,
		previousUsersResult,
		activeSellersResult,
		currentSellersResult,
		previousSellersResult,
		currentSalesResult,
		previousSalesResult,
		recentOrdersResult,
		newSellersResult
	] = await Promise.all([
		supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
		supabaseAdmin
			.from('profiles')
			.select('id', { count: 'exact', head: true })
			.gte('created_at', currentMonthStart.toISOString())
			.lt('created_at', nextMonthStart.toISOString()),
		supabaseAdmin
			.from('profiles')
			.select('id', { count: 'exact', head: true })
			.gte('created_at', previousMonthStart.toISOString())
			.lt('created_at', currentMonthStart.toISOString()),
		supabaseAdmin
			.from('sellers')
			.select('id', { count: 'exact', head: true })
			.eq('is_active', true),
		supabaseAdmin
			.from('sellers')
			.select('id', { count: 'exact', head: true })
			.eq('is_active', true)
			.gte('created_at', currentMonthStart.toISOString())
			.lt('created_at', nextMonthStart.toISOString()),
		supabaseAdmin
			.from('sellers')
			.select('id', { count: 'exact', head: true })
			.eq('is_active', true)
			.gte('created_at', previousMonthStart.toISOString())
			.lt('created_at', currentMonthStart.toISOString()),
		supabaseAdmin
			.from('orders')
			.select('id, total')
			.in('status', [...PAID_ORDER_STATUSES])
			.gte('created_at', currentMonthStart.toISOString())
			.lt('created_at', nextMonthStart.toISOString()),
		supabaseAdmin
			.from('orders')
			.select('id, total')
			.in('status', [...PAID_ORDER_STATUSES])
			.gte('created_at', previousMonthStart.toISOString())
			.lt('created_at', currentMonthStart.toISOString()),
		supabaseAdmin
			.from('orders')
			.select('id, buyer_id, total, status, created_at')
			.order('created_at', { ascending: false })
			.limit(5),
		supabaseAdmin
			.from('sellers')
			.select('id, store_name, store_slug, logo_url, created_at')
			.order('created_at', { ascending: false })
			.limit(4)
	]);

	const currentSales = ((currentSalesResult.data ?? []) as Array<Pick<Order, 'total'>>).reduce(
		(sum, order) => sum + Number(order.total),
		0
	);
	const previousSales = ((previousSalesResult.data ?? []) as Array<Pick<Order, 'total'>>).reduce(
		(sum, order) => sum + Number(order.total),
		0
	);
	const recentOrders = (recentOrdersResult.data ?? []) as Array<
		Pick<Order, 'id' | 'buyer_id' | 'total' | 'status' | 'created_at'>
	>;
	const buyerMap = await mapProfileNames(
		recentOrders.flatMap((order) => (order.buyer_id ? [order.buyer_id] : []))
	);

	return {
		stats: {
			totalUsers: {
				value: totalUsersResult.count ?? 0,
				change: buildGrowthRate(currentUsersResult.count ?? 0, previousUsersResult.count ?? 0),
				progress: clampProgress(((totalUsersResult.count ?? 0) / Math.max((totalUsersResult.count ?? 0) + 50, 1)) * 100)
			},
			activeSellers: {
				value: activeSellersResult.count ?? 0,
				change: buildGrowthRate(currentSellersResult.count ?? 0, previousSellersResult.count ?? 0),
				progress: clampProgress(((activeSellersResult.count ?? 0) / Math.max((totalUsersResult.count ?? 0), 1)) * 100)
			},
			monthlySales: {
				value: currentSales,
				change: buildGrowthRate(currentSales, previousSales),
				progress: clampProgress(currentSales > 0 ? (currentSales / Math.max(currentSales + previousSales, 1)) * 100 : 12)
			}
		},
		recentOrders: recentOrders.map((order) => ({
			id: order.id,
			orderNumber: buildOrderNumber(order.id),
			customerName:
				(order.buyer_id ? buyerMap.get(order.buyer_id)?.display_name : null) ??
				(order.buyer_id ? buyerMap.get(order.buyer_id)?.email : null) ??
				'Cliente eliminado',
			status: normalizePanelOrderStatus(order.status),
			amount: Number(order.total),
			createdAt: order.created_at
		})),
		newSellers: ((newSellersResult.data ?? []) as Array<
			Pick<Seller, 'id' | 'store_name' | 'store_slug' | 'logo_url' | 'created_at'>
		>).map((seller) => ({
			id: seller.id,
			storeName: seller.store_name,
			storeSlug: seller.store_slug,
			logoUrl: seller.logo_url,
			createdAt: seller.created_at,
			highlightHref: `/admin/dashboard?section=sellers&sellerId=${seller.id}`,
			storeHref: `/vendedoras/${seller.store_slug}/tienda`
		}))
	};
};

export const getAdminUsersSectionData = async (options: {
	page: string | null;
	search: string | null;
	role: string | null;
	currentAdminProfileId: string;
}): Promise<AdminUsersSectionData> => {
	const page = normalizePage(options.page);
	const search = sanitizeSearch(options.search);
	const roleFilter: AdminRoleFilter = ['buyer', 'seller', 'admin'].includes(options.role ?? '')
		? (options.role as AdminRoleFilter)
		: 'all';
	let countQuery = supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true });
	let dataQuery = supabaseAdmin
		.from('profiles')
		.select('id, avatar_url, display_name, email, roles, role, created_at, is_active')
		.order('created_at', { ascending: false });

	if (search) {
		countQuery = countQuery.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
		dataQuery = dataQuery.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
	}

	if (roleFilter !== 'all') {
		countQuery = countQuery.contains('roles', [roleFilter]);
		dataQuery = dataQuery.contains('roles', [roleFilter]);
	}

	const countResult = await countQuery;
	const pagination = paginateRange(page, countResult.count ?? 0);
	const { data, error } = await dataQuery.range(pagination.from, pagination.to);

	if (error) {
		return {
			items: [],
			page: pagination.page,
			pageSize: pagination.pageSize,
			totalItems: countResult.count ?? 0,
			totalPages: pagination.totalPages,
			search,
			roleFilter
		};
	}

	return {
		items: ((data ?? []) as Array<
			Pick<Profile, 'id' | 'avatar_url' | 'display_name' | 'email' | 'roles' | 'role' | 'created_at' | 'is_active'>
		>).map((profile) => ({
			id: profile.id,
			avatarUrl: profile.avatar_url,
			name: profile.display_name ?? profile.email ?? 'Sin nombre',
			email: profile.email,
			roles: normalizeRoles(profile),
			createdAt: profile.created_at,
			isActive: profile.is_active ?? true,
			isCurrentAdmin: profile.id === options.currentAdminProfileId
		})),
		page: pagination.page,
		pageSize: pagination.pageSize,
		totalItems: countResult.count ?? 0,
		totalPages: pagination.totalPages,
		search,
		roleFilter
	};
};

export const getAdminSellersSectionData = async (options: {
	page: string | null;
	search: string | null;
	status: string | null;
	highlightSellerId: string | null;
}): Promise<AdminSellersSectionData> => {
	const page = normalizePage(options.page);
	const search = sanitizeSearch(options.search);
	const statusFilter: AdminSellerStatusFilter = ['active', 'inactive'].includes(options.status ?? '')
		? (options.status as AdminSellerStatusFilter)
		: 'all';
	let countQuery = supabaseAdmin.from('sellers').select('id', { count: 'exact', head: true });
	let dataQuery = supabaseAdmin
		.from('sellers')
		.select('id, store_name, store_slug, logo_url, is_active, created_at')
		.order('created_at', { ascending: false });

	if (search) {
		countQuery = countQuery.or(`store_name.ilike.%${search}%,store_slug.ilike.%${search}%`);
		dataQuery = dataQuery.or(`store_name.ilike.%${search}%,store_slug.ilike.%${search}%`);
	}

	if (statusFilter !== 'all') {
		const isActive = statusFilter === 'active';
		countQuery = countQuery.eq('is_active', isActive);
		dataQuery = dataQuery.eq('is_active', isActive);
	}

	const countResult = await countQuery;
	const pagination = paginateRange(page, countResult.count ?? 0);
	const { data, error } = await dataQuery.range(pagination.from, pagination.to);

	if (error) {
		return {
			items: [],
			page: pagination.page,
			pageSize: pagination.pageSize,
			totalItems: countResult.count ?? 0,
			totalPages: pagination.totalPages,
			search,
			statusFilter,
			highlightSellerId: options.highlightSellerId
		};
	}

	const sellers = (data ?? []) as Array<
		Pick<Seller, 'id' | 'store_name' | 'store_slug' | 'logo_url' | 'is_active' | 'created_at'>
	>;
	const sellerIds = sellers.map((seller) => seller.id);
	const [productsResult, salesResult] = await Promise.all([
		sellerIds.length > 0
			? supabaseAdmin.from('products').select('id, seller_id').in('seller_id', sellerIds)
			: Promise.resolve({ data: [], error: null }),
		sellerIds.length > 0
			? supabaseAdmin
				.from('orders')
				.select('id, seller_id, total')
				.in('seller_id', sellerIds)
				.in('status', [...PAID_ORDER_STATUSES])
			: Promise.resolve({ data: [], error: null })
	]);
	const productCountBySeller = new Map<string, number>();
	const totalSalesBySeller = new Map<string, number>();

	for (const product of ((productsResult.data ?? []) as Array<Pick<Product, 'id' | 'seller_id'>>)) {
		productCountBySeller.set(product.seller_id, (productCountBySeller.get(product.seller_id) ?? 0) + 1);
	}

	for (const order of ((salesResult.data ?? []) as Array<Pick<Order, 'seller_id' | 'total'>>)) {
		if (!order.seller_id) {
			continue;
		}

		totalSalesBySeller.set(
			order.seller_id,
			(totalSalesBySeller.get(order.seller_id) ?? 0) + Number(order.total)
		);
	}

	return {
		items: sellers.map((seller) => ({
			id: seller.id,
			logoUrl: seller.logo_url,
			storeName: seller.store_name,
			storeSlug: seller.store_slug,
			isActive: seller.is_active,
			createdAt: seller.created_at,
			totalProducts: productCountBySeller.get(seller.id) ?? 0,
			totalSales: totalSalesBySeller.get(seller.id) ?? 0,
			storeHref: `/vendedoras/${seller.store_slug}/tienda`,
			highlightHref: `/admin/dashboard?section=sellers&sellerId=${seller.id}`
		})),
		page: pagination.page,
		pageSize: pagination.pageSize,
		totalItems: countResult.count ?? 0,
		totalPages: pagination.totalPages,
		search,
		statusFilter,
		highlightSellerId: options.highlightSellerId
	};
};

export const getAdminProductsSectionData = async (options: {
	page: string | null;
	search: string | null;
	status: string | null;
}): Promise<AdminProductsSectionData> => {
	const page = normalizePage(options.page);
	const search = sanitizeSearch(options.search);
	const statusFilter: AdminProductStatusFilter = ['active', 'inactive', 'out_of_stock'].includes(
		options.status ?? ''
	)
		? (options.status as AdminProductStatusFilter)
		: 'all';
	let countQuery = supabaseAdmin.from('products').select('id', { count: 'exact', head: true });
	let dataQuery = supabaseAdmin
		.from('products')
		.select('id, seller_id, name, price, stock, images, is_active, created_at')
		.order('created_at', { ascending: false });

	if (search) {
		countQuery = countQuery.ilike('name', `%${search}%`);
		dataQuery = dataQuery.ilike('name', `%${search}%`);
	}

	if (statusFilter === 'active') {
		countQuery = countQuery.eq('is_active', true).gt('stock', 0);
		dataQuery = dataQuery.eq('is_active', true).gt('stock', 0);
	} else if (statusFilter === 'inactive') {
		countQuery = countQuery.eq('is_active', false);
		dataQuery = dataQuery.eq('is_active', false);
	} else if (statusFilter === 'out_of_stock') {
		countQuery = countQuery.eq('stock', 0);
		dataQuery = dataQuery.eq('stock', 0);
	}

	const countResult = await countQuery;
	const pagination = paginateRange(page, countResult.count ?? 0);
	const { data, error } = await dataQuery.range(pagination.from, pagination.to);

	if (error) {
		return {
			items: [],
			page: pagination.page,
			pageSize: pagination.pageSize,
			totalItems: countResult.count ?? 0,
			totalPages: pagination.totalPages,
			search,
			statusFilter
		};
	}

	const products = (data ?? []) as Array<
		Pick<Product, 'id' | 'seller_id' | 'name' | 'price' | 'stock' | 'images' | 'is_active' | 'created_at'>
	>;
	const sellerMap = await mapSellerIdentities([...new Set(products.map((product) => product.seller_id))]);

	return {
		items: products.map((product) => {
			const seller = sellerMap.get(product.seller_id);

			return {
				id: product.id,
				imageUrl: product.images[0] ?? null,
				name: product.name,
				sellerName: seller?.store_name ?? 'Tienda eliminada',
				sellerSlug: seller?.store_slug ?? null,
				price: Number(product.price),
				stock: product.stock,
				isActive: product.is_active,
				createdAt: product.created_at
			};
		}),
		page: pagination.page,
		pageSize: pagination.pageSize,
		totalItems: countResult.count ?? 0,
		totalPages: pagination.totalPages,
		search,
		statusFilter
	};
};

export const getAdminOrdersSectionData = async (options: {
	page: string | null;
	search: string | null;
	status: string | null;
}): Promise<AdminOrdersSectionData> => {
	const page = normalizePage(options.page);
	const search = sanitizeSearch(options.search);
	const statusFilter: AdminOrderStatusFilter =
		['pending', 'processing', 'shipped', 'completed', 'cancelled'].includes(
		options.status ?? ''
		)
			? (options.status as AdminOrderStatusFilter)
			: 'all';
	const normalizedOrderSearch = search.replace(/^#?ord-/i, '');
	const buyerIdMatches = search
		? await supabaseAdmin
				.from('profiles')
				.select('id')
				.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`)
				.limit(100)
				.then((result) => ((result.data ?? []) as Array<Pick<Profile, 'id'>>).map((profile) => profile.id))
		: [];
	let countQuery = supabaseAdmin.from('orders').select('id', { count: 'exact', head: true });
	let dataQuery = supabaseAdmin
		.from('orders')
		.select('id, buyer_id, seller_id, total, status, tracking_number, shipping_provider, shipped_at, created_at')
		.order('created_at', { ascending: false });

	if (statusFilter !== 'all') {
		if (statusFilter === 'processing') {
			countQuery = countQuery.eq('status', 'confirmed');
			dataQuery = dataQuery.eq('status', 'confirmed');
		} else if (statusFilter === 'completed') {
			countQuery = countQuery.in('status', ['completed', 'delivered']);
			dataQuery = dataQuery.in('status', ['completed', 'delivered']);
		} else {
			countQuery = countQuery.eq('status', statusFilter);
			dataQuery = dataQuery.eq('status', statusFilter);
		}
	}

	if (search) {
		const orParts = [`id.ilike.%${normalizedOrderSearch}%`];

		if (buyerIdMatches.length > 0) {
			orParts.push(`buyer_id.in.(${buyerIdMatches.join(',')})`);
		}

		countQuery = countQuery.or(orParts.join(','));
		dataQuery = dataQuery.or(orParts.join(','));
	}

	const countResult = await countQuery;
	const pagination = paginateRange(page, countResult.count ?? 0);
	const { data, error } = await dataQuery.range(pagination.from, pagination.to);

	if (error) {
		return {
			items: [],
			page: pagination.page,
			pageSize: pagination.pageSize,
			totalItems: countResult.count ?? 0,
			totalPages: pagination.totalPages,
			search,
			statusFilter
		};
	}

	const orders = (data ?? []) as Array<
		Pick<
			Order,
			| 'id'
			| 'buyer_id'
			| 'seller_id'
			| 'total'
			| 'status'
			| 'tracking_number'
			| 'shipping_provider'
			| 'shipped_at'
			| 'created_at'
		>
	>;
	const orderIds = orders.map((order) => order.id);
	const [buyersMap, sellersMap, orderItemsResult] = await Promise.all([
		mapProfileNames(orders.flatMap((order) => (order.buyer_id ? [order.buyer_id] : []))),
		mapSellerIdentities(orders.flatMap((order) => (order.seller_id ? [order.seller_id] : []))),
		orderIds.length > 0
			? supabaseAdmin
				.from('order_items')
				.select('id, order_id, product_id, quantity, unit_price')
				.in('order_id', orderIds)
			: Promise.resolve({ data: [], error: null })
	]);
	const orderItems = (orderItemsResult.data ?? []) as Array<
		Pick<OrderItem, 'id' | 'order_id' | 'product_id' | 'quantity' | 'unit_price'>
	>;
	const productMap = await mapProductNames(
		[...new Set(orderItems.flatMap((item) => (item.product_id ? [item.product_id] : [])))]
	);
	const itemsByOrderId = new Map<string, AdminOrderItemDetail[]>();

	for (const item of orderItems) {
		const list = itemsByOrderId.get(item.order_id) ?? [];
		list.push({
			id: item.id,
			productName: item.product_id ? (productMap.get(item.product_id)?.name ?? 'Producto eliminado') : 'Producto eliminado',
			quantity: item.quantity,
			unitPrice: Number(item.unit_price),
			total: Number(item.unit_price) * item.quantity
		});
		itemsByOrderId.set(item.order_id, list);
	}

	return {
		items: orders.map((order) => ({
			id: order.id,
			orderNumber: buildOrderNumber(order.id),
			buyerName:
				(order.buyer_id ? buyersMap.get(order.buyer_id)?.display_name : null) ??
				(order.buyer_id ? buyersMap.get(order.buyer_id)?.email : null) ??
				'Cliente eliminado',
			sellerName:
				(order.seller_id ? sellersMap.get(order.seller_id)?.store_name : null) ?? 'Tienda eliminada',
			total: Number(order.total),
			status: normalizeMutableOrderStatus(order.status),
			trackingNumber: order.tracking_number,
			shippingProvider: order.shipping_provider,
			shippedAt: order.shipped_at,
			createdAt: order.created_at,
			items: itemsByOrderId.get(order.id) ?? []
		})),
		page: pagination.page,
		pageSize: pagination.pageSize,
		totalItems: countResult.count ?? 0,
		totalPages: pagination.totalPages,
		search,
		statusFilter
	};
};

export const getAdminReportsSectionData = async (): Promise<AdminReportsSectionData> => {
	const monthKeys = buildTrailingMonthBuckets(12);
	const revenueOrders = await getCompletedOrdersSince(`${monthKeys[0]}-01T00:00:00.000Z`);
	const { data: profileData } = await supabaseAdmin
		.from('profiles')
		.select('id, created_at')
		.gte('created_at', `${monthKeys[0]}-01T00:00:00.000Z`)
		.order('created_at', { ascending: true });
	const revenueByMonthMap = new Map<string, number>(monthKeys.map((key) => [key, 0]));
	const usersByMonthMap = new Map<string, number>(monthKeys.map((key) => [key, 0]));
	const sellerTotals = new Map<string, number>();

	for (const order of revenueOrders) {
		const monthKey = getMonthKey(order.created_at);
		revenueByMonthMap.set(monthKey, (revenueByMonthMap.get(monthKey) ?? 0) + Number(order.total));

		if (order.seller_id) {
			sellerTotals.set(order.seller_id, (sellerTotals.get(order.seller_id) ?? 0) + Number(order.total));
		}
	}

	for (const profile of ((profileData ?? []) as Array<Pick<Profile, 'id' | 'created_at'>>)) {
		const monthKey = getMonthKey(profile.created_at);
		if (usersByMonthMap.has(monthKey)) {
			usersByMonthMap.set(monthKey, (usersByMonthMap.get(monthKey) ?? 0) + 1);
		}
	}

	const completedOrderIds = revenueOrders.map((order) => order.id);
	const orderItemsResult =
		completedOrderIds.length > 0
			? await supabaseAdmin
				.from('order_items')
				.select('id, order_id, product_id, quantity')
				.in('order_id', completedOrderIds)
			: { data: [], error: null };
	const productTotals = new Map<string, number>();

	for (const item of ((orderItemsResult.data ?? []) as Array<
		Pick<OrderItem, 'id' | 'order_id' | 'product_id' | 'quantity'>
	>)) {
		if (!item.product_id) {
			continue;
		}

		productTotals.set(item.product_id, (productTotals.get(item.product_id) ?? 0) + item.quantity);
	}

	const topSellerIds = [...sellerTotals.entries()]
		.sort((left, right) => right[1] - left[1])
		.slice(0, 5)
		.map(([sellerId]) => sellerId);
	const topProductIds = [...productTotals.entries()]
		.sort((left, right) => right[1] - left[1])
		.slice(0, 5)
		.map(([productId]) => productId);
	const [sellerMap, productMap] = await Promise.all([
		mapSellerIdentities(topSellerIds),
		mapProductNames(topProductIds)
	]);

	return {
		revenueByMonth: monthKeys.map((month) => ({
			month,
			value: revenueByMonthMap.get(month) ?? 0
		})),
		newUsersByMonth: monthKeys.map((month) => ({
			month,
			value: usersByMonthMap.get(month) ?? 0
		})),
		topSellers: [...sellerTotals.entries()]
			.sort((left, right) => right[1] - left[1])
			.slice(0, 5)
			.map(([sellerId, value]) => ({
				id: sellerId,
				name: sellerMap.get(sellerId)?.store_name ?? 'Tienda eliminada',
				storeSlug: sellerMap.get(sellerId)?.store_slug ?? '',
				value
			})),
		topProducts: [...productTotals.entries()]
			.sort((left, right) => right[1] - left[1])
			.slice(0, 5)
			.map(([productId, value]) => ({
				id: productId,
				name: productMap.get(productId)?.name ?? 'Producto eliminado',
				value
			}))
	};
};

export const updateAdminUserRole = async (
	currentAdminProfileId: string,
	targetProfileId: string,
	nextRole: AdminMutableRole
) => {
	if (currentAdminProfileId === targetProfileId && nextRole !== 'admin') {
		throw new Error('admin-self-role-change-forbidden');
	}

	const { error } = await supabaseAdmin
		.from('profiles')
		.update({ role: nextRole, roles: [nextRole] })
		.eq('id', targetProfileId);

	if (error) {
		throw error;
	}
};

export const updateAdminUserActiveState = async (
	currentAdminProfileId: string,
	targetProfileId: string,
	nextActive: boolean
) => {
	if (currentAdminProfileId === targetProfileId && !nextActive) {
		throw new Error('admin-self-disable-forbidden');
	}

	const { error } = await supabaseAdmin
		.from('profiles')
		.update({ is_active: nextActive })
		.eq('id', targetProfileId);

	if (error) {
		throw error;
	}
};

export const updateAdminSellerActiveState = async (sellerId: string, nextActive: boolean) => {
	const { error } = await supabaseAdmin
		.from('sellers')
		.update({ is_active: nextActive })
		.eq('id', sellerId);

	if (error) {
		throw error;
	}
};

export const updateAdminProductActiveState = async (productId: string, nextActive: boolean) => {
	const { error } = await supabaseAdmin
		.from('products')
		.update({ is_active: nextActive })
		.eq('id', productId);

	if (error) {
		throw error;
	}
};

export const deleteAdminProduct = async (productId: string) => {
	const { error } = await supabaseAdmin.from('products').delete().eq('id', productId);

	if (error) {
		throw error;
	}
};

export const updateAdminOrderStatus = async (orderId: string, nextStatus: AdminMutableOrderStatus) => {
	const status = toDatabaseOrderStatus(nextStatus);
	const { error } = await supabaseAdmin
		.from('orders')
		.update({ status })
		.eq('id', orderId);

	if (error) {
		throw error;
	}
};

export const markAdminOrderShipped = async (
	orderId: string,
	shippingProvider: string,
	trackingNumber: string
) => {
	const { data: orderData, error: orderError } = await supabaseAdmin
		.from('orders')
		.select('id, status')
		.eq('id', orderId)
		.maybeSingle();

	if (orderError || !orderData) {
		throw orderError ?? new Error('admin-order-not-found');
	}

	if (!['pending', 'confirmed'].includes(orderData.status)) {
		throw new Error('admin-order-not-shippable');
	}

	const shippedAt = new Date().toISOString();
	const { error } = await supabaseAdmin
		.from('orders')
		.update({
			status: 'shipped',
			shipping_provider: shippingProvider,
			tracking_number: trackingNumber,
			shipped_at: shippedAt
		})
		.eq('id', orderId);

	if (error) {
		throw error;
	}

	await sendShippingNotificationEmail(orderId);
};
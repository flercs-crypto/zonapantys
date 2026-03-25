import { getPrimaryAppRole, normalizeAppRoles } from '$lib/auth/roles';
import { supabaseAdmin } from '$lib/supabase/server';
import type { Order, OrderItem, Product, Profile, Seller, StoreVisit } from '$lib/types/database.types';

export type OwnedSellerContext = {
	profile: Profile;
	seller: Seller;
};

export type SellerDashboardOrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export type SellerDashboardSalesSummary = {
	totalRevenue: number;
	completedOrdersThisMonth: number;
	averageTicket: number;
	topProductName: string | null;
	topProductUnits: number;
};

export type SellerDashboardOrderItem = {
	productId: string | null;
	productName: string;
	quantity: number;
	unitPrice: number;
	total: number;
};

export type SellerDashboardOrder = {
	id: string;
	orderNumber: string;
	createdAt: string;
	total: number;
	status: SellerDashboardOrderStatus;
	products: SellerDashboardOrderItem[];
};

export type SellerDashboardVisitPoint = {
	date: string;
	visits: number;
};

export type SellerDashboardVisitSummary = {
	totalVisits: number;
	visitsThisWeek: number;
	visitsThisMonth: number;
	points: SellerDashboardVisitPoint[];
};

export type SellerDashboardOrdersPage = {
	items: SellerDashboardOrder[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
};

const COMPLETED_ORDER_STATUSES = ['completed', 'confirmed', 'shipped', 'delivered'] as const;
const ORDER_PAGE_SIZE = 10;
const VISIT_CHART_DAYS = 30;

type ProductNameRecord = Pick<Product, 'id' | 'name'>;

const startOfUtcDay = (date: Date) =>
	new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addUtcDays = (date: Date, days: number) => {
	const copy = new Date(date);
	copy.setUTCDate(copy.getUTCDate() + days);
	return copy;
};

const buildOrderNumber = (orderId: string) => `#${orderId.slice(0, 8).toUpperCase()}`;

export const normalizeSellerOrderStatus = (status: string): SellerDashboardOrderStatus => {
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

const isCompletedOrderStatus = (status: string) =>
	COMPLETED_ORDER_STATUSES.includes(status as (typeof COMPLETED_ORDER_STATUSES)[number]);

const getProductNamesMap = async (productIds: string[]) => {
	if (productIds.length === 0) {
		return new Map<string, string>();
	}

	const { data, error } = await supabaseAdmin.from('products').select('id, name').in('id', productIds);

	if (error) {
		return new Map<string, string>();
	}

	return new Map(((data ?? []) as ProductNameRecord[]).map((product) => [product.id, product.name]));
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

const buildVisitPoints = (visits: StoreVisit[]) => {
	const today = startOfUtcDay(new Date());
	const firstDay = addUtcDays(today, -(VISIT_CHART_DAYS - 1));
	const counts = new Map<string, number>();

	for (const visit of visits) {
		const key = visit.visited_at.slice(0, 10);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}

	return Array.from({ length: VISIT_CHART_DAYS }, (_, index) => {
		const currentDate = addUtcDays(firstDay, index);
		const key = currentDate.toISOString().slice(0, 10);

		return {
			date: key,
			visits: counts.get(key) ?? 0
		};
	});
};

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

export const getSellerDashboardContext = async (
	firebaseUid: string
): Promise<OwnedSellerContext | null> => {
	const { data: profileRecord } = await supabaseAdmin
		.from('profiles')
		.select('*')
		.eq('firebase_uid', firebaseUid)
		.maybeSingle();

	const profile = normalizeProfile((profileRecord ?? null) as Profile | null);

	if (!profile) {
		return null;
	}

	const { data: sellerRecord } = await supabaseAdmin
		.from('sellers')
		.select('*')
		.eq('profile_id', profile.id)
		.maybeSingle();

	const seller = (sellerRecord ?? null) as Seller | null;

	if (!seller) {
		return null;
	}

	return {
		profile,
		seller
	};
};

export const getOwnedSellerById = async (
	firebaseUid: string,
	sellerId: string
): Promise<OwnedSellerContext | null> => {
	const context = await getSellerDashboardContext(firebaseUid);

	if (!context || context.seller.id !== sellerId) {
		return null;
	}

	return context;
};

export const getOwnedProduct = async (
	sellerId: string,
	productId: string
): Promise<Product | null> => {
	const { data } = await supabaseAdmin
		.from('products')
		.select('*')
		.eq('id', productId)
		.eq('seller_id', sellerId)
		.maybeSingle();

	return (data ?? null) as Product | null;
};

export const getSellerProducts = async (sellerId: string): Promise<Product[]> => {
	const { data, error } = await supabaseAdmin
		.from('products')
		.select('*')
		.eq('seller_id', sellerId)
		.order('created_at', { ascending: false });

	if (error) {
		return [];
	}

	return (data ?? []) as Product[];
};

export const getSellerSalesSummary = async (
	sellerId: string
): Promise<SellerDashboardSalesSummary> => {
	const { data, error } = await supabaseAdmin
		.from('orders')
		.select('id, total, status, created_at')
		.eq('seller_id', sellerId)
		.in('status', [...COMPLETED_ORDER_STATUSES]);

	if (error) {
		return {
			totalRevenue: 0,
			completedOrdersThisMonth: 0,
			averageTicket: 0,
			topProductName: null,
			topProductUnits: 0
		};
	}

	const completedOrders = (data ?? []) as Pick<Order, 'id' | 'total' | 'status' | 'created_at'>[];
	const now = new Date();
	const currentYear = now.getUTCFullYear();
	const currentMonth = now.getUTCMonth();
	const totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.total), 0);
	const completedOrdersThisMonth = completedOrders.filter((order) => {
		const createdAt = new Date(order.created_at);
		return (
			createdAt.getUTCFullYear() === currentYear &&
			createdAt.getUTCMonth() === currentMonth
		);
	}).length;
	const averageTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
	const orderItems = await getOrderItemsByOrderIds(completedOrders.map((order) => order.id));
	const productIds = [...new Set(orderItems.flatMap((item) => (item.product_id ? [item.product_id] : [])))];
	const productNames = await getProductNamesMap(productIds);
	const productTotals = new Map<string, { name: string; units: number }>();

	for (const item of orderItems) {
		const key = item.product_id ?? `deleted:${item.id}`;
		const productName = item.product_id
			? (productNames.get(item.product_id) ?? 'Producto eliminado')
			: 'Producto eliminado';
		const current = productTotals.get(key);

		productTotals.set(key, {
			name: productName,
			units: (current?.units ?? 0) + item.quantity
		});
	}

	const topProduct = [...productTotals.values()].sort((left, right) => right.units - left.units)[0] ?? null;

	return {
		totalRevenue,
		completedOrdersThisMonth,
		averageTicket,
		topProductName: topProduct?.name ?? null,
		topProductUnits: topProduct?.units ?? 0
	};
};

export const getSellerOrdersPage = async (
	sellerId: string,
	page: number
): Promise<SellerDashboardOrdersPage> => {
	const safePage = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 1;
	const from = (safePage - 1) * ORDER_PAGE_SIZE;
	const to = from + ORDER_PAGE_SIZE - 1;
	const countResult = await supabaseAdmin
		.from('orders')
		.select('id', { count: 'exact', head: true })
		.eq('seller_id', sellerId);
	const totalItems = countResult.count ?? 0;
	const totalPages = Math.max(1, Math.ceil(totalItems / ORDER_PAGE_SIZE));
	const normalizedPage = Math.min(safePage, totalPages);
	const rangeFrom = (normalizedPage - 1) * ORDER_PAGE_SIZE;
	const rangeTo = rangeFrom + ORDER_PAGE_SIZE - 1;
	const ordersResult = await supabaseAdmin
		.from('orders')
		.select('id, total, status, created_at')
		.eq('seller_id', sellerId)
		.order('created_at', { ascending: false })
		.range(rangeFrom, rangeTo);

	if (ordersResult.error) {
		return {
			items: [],
			page: normalizedPage,
			pageSize: ORDER_PAGE_SIZE,
			totalItems,
			totalPages
		};
	}

	const orders = (ordersResult.data ?? []) as Pick<Order, 'id' | 'total' | 'status' | 'created_at'>[];
	const orderIds = orders.map((order) => order.id);
	const orderItems = await getOrderItemsByOrderIds(orderIds);
	const productIds = [...new Set(orderItems.flatMap((item) => (item.product_id ? [item.product_id] : [])))];
	const productNames = await getProductNamesMap(productIds);
	const itemsByOrder = new Map<string, SellerDashboardOrderItem[]>();

	for (const item of orderItems) {
		const orderList = itemsByOrder.get(item.order_id) ?? [];
		orderList.push({
			productId: item.product_id,
			productName: item.product_id
				? (productNames.get(item.product_id) ?? 'Producto eliminado')
				: 'Producto eliminado',
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
			status: normalizeSellerOrderStatus(order.status),
			products: itemsByOrder.get(order.id) ?? []
		})),
		page: normalizedPage,
		pageSize: ORDER_PAGE_SIZE,
		totalItems,
		totalPages
	};
};

export const getSellerVisitSummary = async (
	sellerId: string
): Promise<SellerDashboardVisitSummary> => {
	const today = startOfUtcDay(new Date());
	const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
	const weekStart = addUtcDays(today, -6);
	const lastThirtyDaysStart = addUtcDays(today, -(VISIT_CHART_DAYS - 1));
	const [totalResult, weekResult, monthResult, chartResult] = await Promise.all([
		supabaseAdmin
			.from('store_visits')
			.select('id', { count: 'exact', head: true })
			.eq('seller_id', sellerId),
		supabaseAdmin
			.from('store_visits')
			.select('id', { count: 'exact', head: true })
			.eq('seller_id', sellerId)
			.gte('visited_at', weekStart.toISOString()),
		supabaseAdmin
			.from('store_visits')
			.select('id', { count: 'exact', head: true })
			.eq('seller_id', sellerId)
			.gte('visited_at', monthStart.toISOString()),
		supabaseAdmin
			.from('store_visits')
			.select('id, seller_id, visited_at')
			.eq('seller_id', sellerId)
			.gte('visited_at', lastThirtyDaysStart.toISOString())
			.order('visited_at', { ascending: true })
	]);

	if (totalResult.error || weekResult.error || monthResult.error || chartResult.error) {
		return {
			totalVisits: 0,
			visitsThisWeek: 0,
			visitsThisMonth: 0,
			points: buildVisitPoints([])
		};
	}

	return {
		totalVisits: totalResult.count ?? 0,
		visitsThisWeek: weekResult.count ?? 0,
		visitsThisMonth: monthResult.count ?? 0,
		points: buildVisitPoints((chartResult.data ?? []) as StoreVisit[])
	};
};

export const recordStoreVisit = async (sellerId: string) => {
	const { error } = await supabaseAdmin.from('store_visits').insert({ seller_id: sellerId });

	if (error) {
		console.error('store-visit-record-failed', {
			sellerId,
			message: error.message
		});
	}
};
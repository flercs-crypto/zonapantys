import {
	getSellerDashboardContext,
	getSellerOrdersPage,
	getSellerProducts,
	getSellerSalesSummary,
	getSellerVisitSummary,
	type SellerDashboardOrdersPage,
	type SellerDashboardSalesSummary,
	type SellerDashboardVisitSummary
} from '$lib/services/seller-dashboard.server';
import type { Product, Profile, Seller } from '$lib/types/database.types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	let profile: Profile | null = null;
	let seller: Seller | null = null;
	let sellerProducts: Product[] = [];
	let salesSummary: SellerDashboardSalesSummary = {
		totalRevenue: 0,
		completedOrdersThisMonth: 0,
		averageTicket: 0,
		topProductName: null,
		topProductUnits: 0
	};
	let ordersPage: SellerDashboardOrdersPage = {
		items: [],
		page: 1,
		pageSize: 10,
		totalItems: 0,
		totalPages: 1
	};
	let visitSummary: SellerDashboardVisitSummary = {
		totalVisits: 0,
		visitsThisWeek: 0,
		visitsThisMonth: 0,
		points: []
	};
	const requestedOrdersPage = Number(url.searchParams.get('ordersPage') ?? '1');

	if (locals.user) {
		const context = await getSellerDashboardContext(locals.user.uid);

		if (context) {
			profile = context.profile;
			seller = context.seller;

			const [products, summary, paginatedOrders, visits] = await Promise.all([
				getSellerProducts(context.seller.id),
				getSellerSalesSummary(context.seller.id),
				getSellerOrdersPage(context.seller.id, requestedOrdersPage),
				getSellerVisitSummary(context.seller.id)
			]);

			sellerProducts = products;
			salesSummary = summary;
			ordersPage = paginatedOrders;
			visitSummary = visits;
		}
	}

	return {
		session: locals.user,
		profile,
		seller,
		sellerProducts,
		salesSummary,
		ordersPage,
		visitSummary
	};
};
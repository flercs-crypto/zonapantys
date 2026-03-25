import * as m from '$lib/paraglide/messages.js';

export const CLIENT_DASHBOARD_SECTIONS = ['profile', 'purchases', 'favorites', 'settings'] as const;

export type ClientSection = (typeof CLIENT_DASHBOARD_SECTIONS)[number];

export type ClientNavItem = {
	label: string;
	href: string;
	section: ClientSection;
	active?: boolean;
	icon: 'profile' | 'purchases' | 'favorites' | 'settings';
};

export type ClientProfile = {
	id: string;
	displayName: string;
	email: string;
	avatarUrl: string | null;
	memberSince: string;
	isGoogleAccount: boolean;
	firebaseUid: string;
};

export type ClientRecentActivity = {
	orderId: string;
	orderNumber: string;
	createdAt: string;
	total: number;
	status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
};

export type ClientFavoriteItem = {
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

export type ClientPurchaseItem = {
	productId: string | null;
	productName: string;
	image: string;
	quantity: number;
	unitPrice: number;
	total: number;
};

export type ClientPurchaseOrder = {
	id: string;
	orderNumber: string;
	createdAt: string;
	total: number;
	status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
	products: ClientPurchaseItem[];
};

export type ClientPurchasesPage = {
	items: ClientPurchaseOrder[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
};

export type ClientDashboardFeedback = {
	intent?: string;
	scope?: ClientSection | 'storefront';
	success?: boolean;
	message?: string;
	productId?: string;
	state?: 'saved' | 'removed';
};

export const normalizeClientSection = (value: string | null | undefined): ClientSection => {
	if (value && CLIENT_DASHBOARD_SECTIONS.includes(value as ClientSection)) {
		return value as ClientSection;
	}

	return 'profile';
};

export const buildClientDashboardHref = (section: ClientSection, purchasesPage = 1) => {
	const searchParams = new URLSearchParams({ section });

	if (section === 'purchases' && purchasesPage > 1) {
		searchParams.set('purchasesPage', String(purchasesPage));
	}

	return `/dashboard?${searchParams.toString()}`;
};

export const getClientNavItems = (activeSection: ClientSection): ClientNavItem[] => [
	{
		label: m.dashboard_client_nav_profile(),
		href: buildClientDashboardHref('profile'),
		section: 'profile',
		active: activeSection === 'profile',
		icon: 'profile'
	},
	{
		label: m.dashboard_client_nav_purchases(),
		href: buildClientDashboardHref('purchases'),
		section: 'purchases',
		active: activeSection === 'purchases',
		icon: 'purchases'
	},
	{
		label: m.dashboard_client_nav_favorites(),
		href: buildClientDashboardHref('favorites'),
		section: 'favorites',
		active: activeSection === 'favorites',
		icon: 'favorites'
	},
	{
		label: m.common_settings(),
		href: buildClientDashboardHref('settings'),
		section: 'settings',
		active: activeSection === 'settings',
		icon: 'settings'
	}
];

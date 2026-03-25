import * as m from '$lib/paraglide/messages.js';

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

export type AdminNavItem = {
	label: string;
	href: string;
	section: AdminDashboardSection;
	active?: boolean;
	icon: 'home' | 'users' | 'store' | 'cube' | 'bag' | 'chart' | 'settings';
};

export type AdminStat = {
	label: string;
	value: string;
	change: string;
	changeTone: 'brand' | 'emerald';
	progressClass: string;
};

export type AdminOrderStatus = 'completed' | 'processing' | 'pending' | 'cancelled' | 'shipped';

export type AdminDashboardFeedback = {
	intent?: string;
	section?: AdminDashboardSection;
	success?: boolean;
	message?: string;
};

export const normalizeAdminSection = (value: string | null | undefined): AdminDashboardSection =>
	value && ADMIN_DASHBOARD_SECTIONS.includes(value as AdminDashboardSection)
		? (value as AdminDashboardSection)
		: 'panel';

export const buildAdminDashboardHref = (section: AdminDashboardSection) =>
	`/admin/dashboard?section=${section}`;

export const getAdminSectionTitle = (section: AdminDashboardSection) => {
	switch (section) {
		case 'users':
			return m.dashboard_admin_nav_users();
		case 'sellers':
			return m.dashboard_admin_nav_sellers();
		case 'products':
			return m.dashboard_admin_nav_products();
		case 'orders':
			return m.dashboard_admin_nav_orders();
		case 'reports':
			return m.dashboard_admin_nav_reports();
		case 'settings':
			return m.common_settings();
		default:
			return m.common_dashboard();
	}
};

export const getAdminNavItems = (activeSection: AdminDashboardSection): AdminNavItem[] => [
	{
		label: m.common_dashboard(),
		href: buildAdminDashboardHref('panel'),
		section: 'panel',
		active: activeSection === 'panel',
		icon: 'home'
	},
	{
		label: m.dashboard_admin_nav_users(),
		href: buildAdminDashboardHref('users'),
		section: 'users',
		active: activeSection === 'users',
		icon: 'users'
	},
	{
		label: m.dashboard_admin_nav_sellers(),
		href: buildAdminDashboardHref('sellers'),
		section: 'sellers',
		active: activeSection === 'sellers',
		icon: 'store'
	},
	{
		label: m.dashboard_admin_nav_products(),
		href: buildAdminDashboardHref('products'),
		section: 'products',
		active: activeSection === 'products',
		icon: 'cube'
	},
	{
		label: m.dashboard_admin_nav_orders(),
		href: buildAdminDashboardHref('orders'),
		section: 'orders',
		active: activeSection === 'orders',
		icon: 'bag'
	},
	{
		label: m.dashboard_admin_nav_reports(),
		href: buildAdminDashboardHref('reports'),
		section: 'reports',
		active: activeSection === 'reports',
		icon: 'chart'
	}
];

export const getAdminFooterNav = (activeSection: AdminDashboardSection): AdminNavItem => ({
	label: m.common_settings(),
	href: buildAdminDashboardHref('settings'),
	section: 'settings',
	active: activeSection === 'settings',
	icon: 'settings'
});

export const getAdminOrderStatusLabel = (status: AdminOrderStatus) => {
	switch (status) {
		case 'completed':
			return m.dashboard_admin_status_completed();
		case 'cancelled':
			return m.dashboard_admin_status_cancelled();
		case 'processing':
			return m.dashboard_admin_status_processing();
			case 'shipped':
				return m.dashboard_admin_status_shipped();
		case 'pending':
			return m.dashboard_admin_status_pending();
	}
};

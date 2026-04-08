import { browser, dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { buildAbsoluteUrl, SITE_NAME } from '$lib/seo';
import type { CheckoutSessionSummary } from '$lib/types/checkout';

type AnalyticsEventParams = Record<string, unknown>;

type SellerStoreAnalyticsPayload = {
	id: string;
	name: string;
	slug: string;
};

const GA_MEASUREMENT_ID = env.PUBLIC_GA_MEASUREMENT_ID?.trim() ?? '';

export const analyticsEnabled = !dev && GA_MEASUREMENT_ID.length > 0;

let analyticsInitialized = false;

const ensureAnalyticsGlobals = () => {
	window.dataLayer = window.dataLayer ?? [];
	window.gtag = window.gtag ?? ((...args: unknown[]) => {
		window.dataLayer.push(args);
	});
};

export const initializeAnalytics = () => {
	if (!browser || !analyticsEnabled || analyticsInitialized) {
		return;
	}

	ensureAnalyticsGlobals();

	if (!document.querySelector(`script[data-ga-id="${GA_MEASUREMENT_ID}"]`)) {
		const script = document.createElement('script');
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
		script.dataset.gaId = GA_MEASUREMENT_ID;
		document.head.appendChild(script);
	}

	window.gtag?.('js', new Date());
	window.gtag?.('config', GA_MEASUREMENT_ID, {
		send_page_view: false
	});

	analyticsInitialized = true;
};

const track = (eventName: string, params: AnalyticsEventParams = {}) => {
	if (!browser || !analyticsEnabled) {
		return;
	}

	initializeAnalytics();
	window.gtag?.('event', eventName, params);
};

export const trackPageView = (path: string, title: string) => {
	track('page_view', {
		page_title: title,
		page_path: path,
		page_location: buildAbsoluteUrl(path)
	});
};

export const trackSignUp = (method: 'email' | 'google', role: 'buyer' | 'seller') => {
	track('sign_up', {
		method,
		user_role: role
	});
};

export const trackSellerStoreView = ({ id, name, slug }: SellerStoreAnalyticsPayload) => {
	track('view_item', {
		currency: 'USD',
		items: [
			{
				item_id: id,
				item_name: name,
				item_brand: SITE_NAME,
				item_category: 'seller_store',
				item_variant: slug
			}
		]
	});
};

const buildPurchaseItem = (item: CheckoutSessionSummary['items'][number]) => ({
	item_id: item.id,
	item_name: item.name,
	price: Number((item.total / Math.max(item.quantity, 1)).toFixed(2)),
	quantity: item.quantity
});

export const trackPurchase = (summary: CheckoutSessionSummary) => {
	track('purchase', {
		transaction_id: summary.sessionId,
		value: summary.total,
		currency: summary.currency.toUpperCase(),
		items: summary.items.map((item) => buildPurchaseItem(item))
	});
};

export const trackPurchaseOnce = (summary: CheckoutSessionSummary) => {
	if (!browser) {
		return;
	}

	const storageKey = `ga_purchase_${summary.sessionId}`;

	if (window.sessionStorage.getItem(storageKey)) {
		return;
	}

	trackPurchase(summary);
	window.sessionStorage.setItem(storageKey, '1');
};
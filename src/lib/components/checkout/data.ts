import { formatPrice } from '$lib/components/shop-seller/data';
import * as m from '$lib/paraglide/messages.js';
import type { CartItem } from '$lib/stores/cart.store';

export type CheckoutItem = {
	id: string;
	name: string;
	seller: string;
	details: string;
	quantity: number;
	price: string;
	image: string;
	alt: string;
	note: string;
};

export type CheckoutSummary = {
	subtotal: string;
	shipping: string;
	tax: string;
	total: string;
	totalValue: number;
};

export type TrustSignal = {
	title: string;
	icon: 'shield' | 'swap';
};

export type FooterLink = {
	label: string;
	href: string;
};

export const getCheckoutItems = (items: CartItem[]): CheckoutItem[] =>
	items.map((item) => ({
		id: item.id,
		name: item.product.name,
		seller: item.product.sellerName,
		details: item.product.description,
		quantity: item.quantity,
		price: formatPrice(item.price * item.quantity),
		image: item.product.image,
		alt: item.product.alt,
		note: item.note
	}));

export const getCheckoutSummary = (subtotal: number): CheckoutSummary => ({
	subtotal: formatPrice(subtotal),
	shipping: m.checkout_shipping_free(),
	tax: formatPrice(0),
	total: formatPrice(subtotal),
	totalValue: subtotal
});

export const getTrustSignals = (): TrustSignal[] => [
	{ title: m.checkout_trust_30_day(), icon: 'shield' },
	{ title: m.checkout_trust_easy_returns(), icon: 'swap' }
];

export const getCheckoutFooterLinks = (): FooterLink[] => [
	{ label: m.common_privacy_policy(), href: '#' },
	{ label: m.common_terms_of_service(), href: '#' },
	{ label: m.common_help_center(), href: '#' }
];

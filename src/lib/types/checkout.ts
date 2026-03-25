import type { CartItem } from '$lib/stores/cart.store';

export type CheckoutShippingDetails = {
	email: string;
	firstName: string;
	lastName: string;
	address: string;
	city: string;
	state: string;
	zip: string;
};

export type CheckoutCreateRequest = {
	cart: CartItem[];
	shipping: CheckoutShippingDetails;
	locale?: string;
};

export type CheckoutCreateResponse = {
	sessionId: string;
	url: string;
};

export type CheckoutSessionSummaryItem = {
	id: string;
	name: string;
	quantity: number;
	total: number;
	currency: string;
};

export type CheckoutSessionSummary = {
	sessionId: string;
	status: string | null;
	paymentStatus: string | null;
	customerEmail: string | null;
	total: number;
	currency: string;
	createdAt: string | null;
	items: CheckoutSessionSummaryItem[];
	shipping: CheckoutShippingDetails | null;
	orderIds: string[];
	orderStatuses: string[];
};

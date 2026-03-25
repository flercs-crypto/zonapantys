import * as m from '$lib/paraglide/messages.js';
import { createCheckoutSession } from '$lib/services/stripe-checkout.server';
import { checkoutRateLimit } from '$lib/services/rate-limit.server';
import type { CheckoutCreateRequest } from '$lib/types/checkout';
import { json, type RequestHandler } from '@sveltejs/kit';

const getErrorMessage = (error: unknown) => {
	if (!(error instanceof Error)) {
		return { status: 500, message: m.api_checkout_session_failed() };
	}

	switch (error.message) {
		case 'cart-empty':
			return { status: 400, message: m.api_checkout_cart_invalid() };
		case 'shipping-invalid':
			return { status: 400, message: m.api_checkout_shipping_invalid() };
		case 'product-missing':
		case 'products-unavailable':
			return { status: 409, message: m.api_checkout_products_unavailable() };
		case 'buyer-profile-unavailable':
			return { status: 500, message: m.api_checkout_profile_unavailable() };
		default:
			return { status: 500, message: m.api_checkout_session_failed() };
	}
};

export const POST: RequestHandler = async ({ request, locals, url, getClientAddress }) => {
	if (!locals.user) {
		return json({ message: m.api_not_authenticated() }, { status: 401 });
	}

	const clientIp = getClientAddress();
	const { allowed, retryAfterMs } = checkoutRateLimit.check(clientIp);

	if (!allowed) {
		return json(
			{ message: 'Too many requests' },
			{
				status: 429,
				headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) }
			}
		);
	}

	let payload: CheckoutCreateRequest;

	try {
		payload = (await request.json()) as CheckoutCreateRequest;
	} catch {
		return json({ message: m.api_invalid_payload() }, { status: 400 });
	}

	try {
		const session = await createCheckoutSession(payload, locals.user, url.origin);
		return json(session);
	} catch (error) {
		const result = getErrorMessage(error);
		return json({ message: result.message }, { status: result.status });
	}
};

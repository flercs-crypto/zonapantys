import { stripe, STRIPE_CURRENCY } from '$lib/stripe/server';
import { supabaseAdmin } from '$lib/supabase/server';
import { ensureFirebaseProfile } from '$lib/services/auth-profile.server';
import { sendOrderCompletionEmails } from '$lib/server/transactional-emails';
import type { CartItem } from '$lib/stores/cart.store';
import type {
	CheckoutCreateRequest,
	CheckoutSessionSummary,
	CheckoutShippingDetails
} from '$lib/types/checkout';
import type { Order, OrderItem, Product, Profile, Seller } from '$lib/types/database.types';
import type Stripe from 'stripe';

const MAX_NOTE_LENGTH = 500;

type AuthenticatedUser = NonNullable<App.Locals['user']>;

type NormalizedCartItem = {
	itemId: string;
	quantity: number;
	note: string;
	product: Product;
};

type DraftOrderContext = {
	orderId: string;
	total: number;
	items: NormalizedCartItem[];
};

const COMPLETED_CHECKOUT_STATUSES = ['completed', 'confirmed', 'shipped', 'delivered'] as const;

type CheckoutProcessingState = 'paid' | 'cancelled';

const normalizeText = (value: unknown, maxLength: number) =>
	typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const isHttpUrl = (value: string | null | undefined) =>
	typeof value === 'string' && /^https?:\/\//i.test(value);

const normalizeShipping = (value: unknown): CheckoutShippingDetails | null => {
	if (!value || typeof value !== 'object') {
		return null;
	}

	const shipping = value as Record<string, unknown>;
	const normalized = {
		email: normalizeText(shipping.email, 320).toLowerCase(),
		firstName: normalizeText(shipping.firstName, 120),
		lastName: normalizeText(shipping.lastName, 120),
		address: normalizeText(shipping.address, 240),
		city: normalizeText(shipping.city, 120),
		state: normalizeText(shipping.state, 120),
		zip: normalizeText(shipping.zip, 40)
	};

	return Object.values(normalized).every((field) => field.length > 0) ? normalized : null;
};

const isCartItem = (value: unknown): value is CartItem => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const item = value as Record<string, unknown>;
	const product = item.product as Record<string, unknown> | undefined;

	return (
		typeof item.id === 'string' &&
		typeof item.quantity === 'number' &&
		Number.isFinite(item.quantity) &&
		item.quantity > 0 &&
		product !== undefined &&
		typeof product.id === 'string'
	);
};

const normalizeCart = (value: unknown): CartItem[] =>
	Array.isArray(value) ? value.filter(isCartItem) : [];

const parseOrderIds = (value: string | null | undefined): string[] =>
	typeof value === 'string' && value.length > 0
		? value
				.split(',')
				.map((entry) => entry.trim())
				.filter(Boolean)
		: [];

	const extractCheckoutPayload = (order: Pick<Order, 'shipping_address'> | null) => {
		if (!order?.shipping_address || typeof order.shipping_address !== 'object') {
			return null;
		}

		const checkout = (order.shipping_address as Record<string, unknown>).checkout;
		return checkout && typeof checkout === 'object'
			? (checkout as Record<string, unknown>)
			: null;
	};

	const isPaidCheckoutProcessed = (
		order: Pick<Order, 'shipping_address'> | null,
		sessionId?: string | null
	) => {
		const checkout = extractCheckoutPayload(order);

		if (!checkout) {
			return false;
		}

		const paymentStatus = checkout.paymentStatus;
		const checkoutStatus = checkout.status;
		const storedSessionId = checkout.sessionId;

		if (typeof storedSessionId === 'string' && sessionId && storedSessionId !== sessionId) {
			return false;
		}

		return paymentStatus === 'paid' || checkoutStatus === 'paid';
	};

const toStripeAmount = (amount: number) => Math.round(amount * 100);

const fromStripeAmount = (amount: number | null) => (amount === null ? 0 : amount / 100);

const extractShippingFromOrder = (
	order: Pick<Order, 'shipping_address'> | null
): CheckoutShippingDetails | null => {
	if (!order?.shipping_address || typeof order.shipping_address !== 'object') {
		return null;
	}

	const payload = order.shipping_address as Record<string, unknown>;
	const recipient = payload.recipient as Record<string, unknown> | undefined;
	const address = payload.address as Record<string, unknown> | undefined;

	if (!recipient || !address) {
		return null;
	}

	return normalizeShipping({
		email: recipient.email,
		firstName: recipient.firstName,
		lastName: recipient.lastName,
		address: address.line1,
		city: address.city,
		state: address.state,
		zip: address.postalCode
	});
};

const formatStripeLineItemDescription = (item: NormalizedCartItem) => {
	if (item.note.length > 0) {
		return item.note;
	}

	return item.product.description?.trim() || undefined;
};

const ensureBuyerProfile = async (user: AuthenticatedUser): Promise<Profile> => {
	const profile = await ensureFirebaseProfile(
		{
			uid: user.uid,
			email: user.email ?? null,
			displayName: user.displayName,
			avatarUrl: null,
			emailVerified: user.emailVerified
		},
		{
			role: 'buyer',
			createIfMissing: true,
			logContext: 'stripe-checkout.ensureBuyerProfile'
		}
	);

	if (!profile) {
		throw new Error('buyer-profile-unavailable');
	}

	return profile;
};

const getProductsByIds = async (productIds: string[]): Promise<Map<string, Product>> => {
	const result = await supabaseAdmin
		.from('products')
		.select('*')
		.in('id', productIds)
		.eq('is_active', true);

	if (result.error) {
		throw new Error('products-unavailable');
	}

	const products = (result.data ?? []) as Product[];
	const sellerIds = [...new Set(products.map((product) => product.seller_id))];
	const sellersResult = sellerIds.length
		? await supabaseAdmin.from('sellers').select('id').in('id', sellerIds).eq('is_active', true)
		: { data: [], error: null };

	if (sellersResult.error) {
		throw new Error('products-unavailable');
	}

	const activeSellerIds = new Set(
		((sellersResult.data ?? []) as Array<Pick<Seller, 'id'>>).map((seller) => seller.id)
	);

	return new Map(
		products
			.filter((product) => activeSellerIds.has(product.seller_id))
			.map((product) => [product.id, product])
	);
};

const normalizeCheckoutItems = async (cart: CartItem[]): Promise<NormalizedCartItem[]> => {
	const uniqueProductIds = [...new Set(cart.map((item) => item.product.id))];
	const productMap = await getProductsByIds(uniqueProductIds);

	return cart.map((item) => {
		const product = productMap.get(item.product.id);

		if (!product) {
			throw new Error('product-missing');
		}

		return {
			itemId: item.id,
			quantity: Math.max(1, Math.trunc(item.quantity)),
			note: normalizeText(item.note, MAX_NOTE_LENGTH),
			product
		};
	});
};

const buildOrderShippingAddress = (
	shipping: CheckoutShippingDetails,
	items: NormalizedCartItem[],
	checkout: Record<string, unknown>
) => ({
	recipient: {
		email: shipping.email,
		firstName: shipping.firstName,
		lastName: shipping.lastName
	},
	address: {
		line1: shipping.address,
		city: shipping.city,
		state: shipping.state,
		postalCode: shipping.zip
	},
	items: items.map((item) => ({
		productId: item.product.id,
		productName: item.product.name,
		quantity: item.quantity,
		unitPrice: item.product.price,
		note: item.note
	})),
	checkout
});

const createDraftOrders = async (
	buyerProfile: Profile,
	shipping: CheckoutShippingDetails,
	items: NormalizedCartItem[]
): Promise<DraftOrderContext[]> => {
	const groups = new Map<string, NormalizedCartItem[]>();

	for (const item of items) {
		const existing = groups.get(item.product.seller_id);

		if (existing) {
			existing.push(item);
			continue;
		}

		groups.set(item.product.seller_id, [item]);
	}

	const draftContexts: DraftOrderContext[] = [];

	for (const [sellerId, sellerItems] of groups) {
		const total = sellerItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
		const orderResult = await supabaseAdmin
			.from('orders')
			.insert({
				buyer_id: buyerProfile.id,
				seller_id: sellerId,
				status: 'pending',
				total,
				shipping_address: buildOrderShippingAddress(shipping, sellerItems, {
					provider: 'stripe',
					status: 'pending',
					currency: STRIPE_CURRENCY,
					mode: 'test'
				})
			})
			.select('*')
			.single();

		const order = (orderResult.data ?? null) as Order | null;

		if (orderResult.error || !order) {
			throw new Error('draft-order-create-failed');
		}

		const orderItemsResult = await supabaseAdmin.from('order_items').insert(
			sellerItems.map((item) => ({
				order_id: order.id,
				product_id: item.product.id,
				quantity: item.quantity,
				unit_price: item.product.price
			}))
		);

		if (orderItemsResult.error) {
			await supabaseAdmin.from('orders').delete().eq('id', order.id);
			throw new Error('draft-order-items-create-failed');
		}

		draftContexts.push({
			orderId: order.id,
			total,
			items: sellerItems
		});
	}

	return draftContexts;
};

const rollbackDraftOrders = async (orderIds: string[]) => {
	if (orderIds.length === 0) {
		return;
	}

	await supabaseAdmin.from('orders').delete().in('id', orderIds);
};

const mergeOrderCheckoutData = (
	order: Pick<Order, 'shipping_address'>,
	session: Stripe.Checkout.Session,
	status: CheckoutProcessingState
) => {
	const base =
		order.shipping_address && typeof order.shipping_address === 'object'
			? order.shipping_address
			: {};

	return {
		...base,
		checkout: {
			provider: 'stripe',
			mode: session.livemode ? 'live' : 'test',
			sessionId: session.id,
			paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
			status,
			paymentStatus: session.payment_status ?? null,
			customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
			completedAt: new Date().toISOString()
		}
	};
};

const applyPaidCheckoutToOrder = async (
	orderId: string,
	checkoutPayload: Record<string, unknown>
) => {

	const orderResult = await supabaseAdmin
		.from('orders')
		.select('id, status, seller_id, shipping_address')
		.eq('id', orderId)
		.maybeSingle();
	const order = (orderResult.data ?? null) as Pick<
		Order,
		'id' | 'status' | 'seller_id' | 'shipping_address'
	> | null;

	if (orderResult.error || !order) {
		throw new Error('draft-order-update-failed');
	}

	if (isPaidCheckoutProcessed(order, String(checkoutPayload.sessionId ?? ''))) {
		return false;
	}

	if (!COMPLETED_CHECKOUT_STATUSES.includes(order.status as never)) {
		const orderItemsResult = await supabaseAdmin
			.from('order_items')
			.select('product_id, quantity')
			.eq('order_id', order.id);

		if (orderItemsResult.error) {
			throw new Error('draft-order-stock-fetch-failed');
		}

		const orderItems = (orderItemsResult.data ?? []) as Pick<OrderItem, 'product_id' | 'quantity'>[];

		for (const item of orderItems) {
			if (!item.product_id) {
				continue;
			}

			const productResult = await supabaseAdmin
				.from('products')
				.select('id, seller_id, stock, is_active')
				.eq('id', item.product_id)
				.maybeSingle();

			if (productResult.error || !productResult.data) {
				throw new Error('draft-order-stock-product-failed');
			}

			const nextStock = Math.max(0, Number(productResult.data.stock) - item.quantity);
			const nextIsActive = nextStock === 0 ? false : productResult.data.is_active;

			const updateProductResult = await supabaseAdmin
				.from('products')
				.update({ stock: nextStock, is_active: nextIsActive })
				.eq('id', item.product_id)
				.eq('seller_id', order.seller_id ?? '');

			if (updateProductResult.error) {
				throw new Error('draft-order-stock-update-failed');
			}
		}
	}

	const updateResult = await supabaseAdmin
		.from('orders')
		.update({
			status: 'pending',
			shipping_address: {
				...(order.shipping_address && typeof order.shipping_address === 'object'
					? order.shipping_address
					: {}),
				checkout: checkoutPayload
			}
		})
		.eq('id', orderId);

	if (updateResult.error) {
		throw new Error('draft-order-update-failed');
	}

	return true;
};

const applyCancelledCheckoutToOrder = async (
	orderId: string,
	checkoutPayload: Record<string, unknown>
) => {
	const orderResult = await supabaseAdmin
		.from('orders')
		.select('id, status, shipping_address')
		.eq('id', orderId)
		.maybeSingle();
	const order = (orderResult.data ?? null) as Pick<Order, 'id' | 'status' | 'shipping_address'> | null;

	if (orderResult.error || !order) {
		throw new Error('draft-order-update-failed');
	}

	if (isPaidCheckoutProcessed(order)) {
		return;
	}

	if (COMPLETED_CHECKOUT_STATUSES.includes(order.status as never)) {
		return;
	}

	const updateResult = await supabaseAdmin
		.from('orders')
		.update({
			status: 'cancelled',
			shipping_address: {
				...(order.shipping_address && typeof order.shipping_address === 'object'
					? order.shipping_address
					: {}),
				checkout: checkoutPayload
			}
		})
		.eq('id', orderId);

	if (updateResult.error) {
		throw new Error('draft-order-update-failed');
	}
};

const updateOrdersFromSession = async (
	session: Stripe.Checkout.Session,
	status: CheckoutProcessingState
) => {
	const orderIds = parseOrderIds(session.metadata?.order_ids);

	if (orderIds.length === 0) {
		return;
	}

	const result = await supabaseAdmin
		.from('orders')
		.select('id, status, shipping_address')
		.in('id', orderIds);
	const orders = (result.data ?? []) as Pick<Order, 'id' | 'status' | 'shipping_address'>[];

	if (result.error) {
		throw new Error('draft-orders-fetch-failed');
	}

	const paidOrderIds: string[] = [];

	for (const order of orders) {
		if (status === 'paid' && isPaidCheckoutProcessed(order, session.id)) {
			continue;
		}

		if (status === 'paid') {
			const didApplyPaidCheckout = await applyPaidCheckoutToOrder(
				order.id,
				mergeOrderCheckoutData(order, session, status).checkout
			);

			if (didApplyPaidCheckout) {
				paidOrderIds.push(order.id);
			}
			continue;
		}

		await applyCancelledCheckoutToOrder(
			order.id,
			mergeOrderCheckoutData(order, session, status).checkout
		);
	}

	if (paidOrderIds.length > 0) {
		await Promise.allSettled(paidOrderIds.map((orderId) => sendOrderCompletionEmails(orderId)));
	}
};

export const createCheckoutSession = async (
	request: CheckoutCreateRequest,
	user: AuthenticatedUser,
	origin: string
) => {
	const cart = normalizeCart(request.cart);
	const shipping = normalizeShipping(request.shipping);

	if (cart.length === 0) {
		throw new Error('cart-empty');
	}

	if (!shipping) {
		throw new Error('shipping-invalid');
	}

	const buyerProfile = await ensureBuyerProfile(user);
	const normalizedItems = await normalizeCheckoutItems(cart);
	const draftOrders = await createDraftOrders(buyerProfile, shipping, normalizedItems);
	const orderIds = draftOrders.map((order) => order.orderId);

	try {
		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			client_reference_id: user.uid,
			customer_email: shipping.email || user.email || undefined,
			locale: request.locale === 'en' ? 'en' : 'es',
			success_url: `${origin}/checkout/exito?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/checkout/cancelado`,
			submit_type: 'pay',
			line_items: normalizedItems.map((item) => ({
				quantity: item.quantity,
				price_data: {
					currency: STRIPE_CURRENCY,
					unit_amount: toStripeAmount(item.product.price),
					product_data: {
						name: item.product.name,
						description: formatStripeLineItemDescription(item),
						images: isHttpUrl(item.product.images[0]) ? [item.product.images[0]] : undefined,
						metadata: {
							product_id: item.product.id,
							seller_id: item.product.seller_id,
							cart_item_id: item.itemId
						}
					}
				}
			})),
			metadata: {
				order_ids: orderIds.join(','),
				buyer_uid: user.uid
			}
		});

		if (!session.url) {
			throw new Error('stripe-session-url-missing');
		}

		return {
			sessionId: session.id,
			url: session.url
		};
	} catch (error) {
		await rollbackDraftOrders(orderIds);
		throw error;
	}
};

export const verifyAndSummarizeCheckoutSession = async (
	sessionId: string,
	user: AuthenticatedUser
): Promise<CheckoutSessionSummary> => {
	const session = await stripe.checkout.sessions.retrieve(sessionId);

	if (session.client_reference_id !== user.uid && session.metadata?.buyer_uid !== user.uid) {
		throw new Error('session-not-found');
	}

	const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
	const orderIds = parseOrderIds(session.metadata?.order_ids);
	const ordersResult = orderIds.length
		? await supabaseAdmin.from('orders').select('id, status, shipping_address').in('id', orderIds)
		: null;
	const orders = ordersResult
		? ((ordersResult.data ?? []) as Pick<Order, 'id' | 'status' | 'shipping_address'>[])
		: [];

	if (ordersResult?.error) {
		throw new Error('session-orders-unavailable');
	}

	return {
		sessionId: session.id,
		status: session.status ?? null,
		paymentStatus: session.payment_status ?? null,
		customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
		total: fromStripeAmount(session.amount_total),
		currency: session.currency ?? STRIPE_CURRENCY,
		createdAt: session.created ? new Date(session.created * 1000).toISOString() : null,
		items: lineItems.data.map((item) => ({
			id: item.id,
			name: item.description ?? 'Product',
			quantity: item.quantity ?? 0,
			total: fromStripeAmount(item.amount_total),
			currency: session.currency ?? STRIPE_CURRENCY
		})),
		shipping: extractShippingFromOrder(orders[0] ?? null),
		orderIds,
		orderStatuses: orders.map((order) => order.status)
	};
};

export const processStripeWebhookEvent = async (event: Stripe.Event) => {
	switch (event.type) {
		case 'checkout.session.completed': {
			const session = event.data.object as Stripe.Checkout.Session;

			if (session.payment_status === 'paid') {
					await updateOrdersFromSession(session, 'paid');
			}
			break;
		}

		case 'checkout.session.expired': {
			const session = event.data.object as Stripe.Checkout.Session;
			await updateOrdersFromSession(session, 'cancelled');
			break;
		}

		default:
			break;
	}
};

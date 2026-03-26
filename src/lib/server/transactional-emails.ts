import { supabaseAdmin } from '$lib/supabase/server';
import type { Order, OrderItem, Product, Profile, Seller } from '$lib/types/database.types';
import { sendEmail } from './resend';
import { buildNewSaleEmail } from './emails/new-sale';
import { buildPurchaseConfirmationEmail } from './emails/purchase-confirmation';
import { buildSellerApprovedEmail } from './emails/seller-approved';
import { buildSellerPendingEmail } from './emails/seller-pending';
import { buildSellerRejectedEmail } from './emails/seller-rejected';
import { buildAbsoluteUrl, buildOrderNumber } from './emails/shared';
import { buildShippingNotificationEmail } from './emails/shipping-notification';

type OrderEmailContext = {
	orderId: string;
	orderNumber: string;
	total: number;
	buyerName: string;
	buyerEmail: string | null;
	sellerName: string;
	sellerEmail: string | null;
	sellerSlug: string | null;
	trackingNumber: string | null;
	shippingProvider: string | null;
	items: Array<{
		name: string;
		quantity: number;
		unitPrice: number;
		total: number;
	}>;
};

type ProfileIdentity = Pick<Profile, 'id' | 'email' | 'display_name'>;
type SellerIdentity = Pick<Seller, 'id' | 'profile_id' | 'store_name' | 'store_slug'>;
type SellerEmailContext = {
	profile: Pick<Profile, 'id' | 'email' | 'display_name'>;
	seller: Pick<Seller, 'profile_id' | 'store_name' | 'store_slug'>;
};

const buildRecipientName = (preferredName: string | null | undefined, fallbackEmail: string | null) => {
	const normalizedName = preferredName?.trim();

	if (normalizedName) {
		return normalizedName;
	}

	if (fallbackEmail) {
		return fallbackEmail.split('@')[0] || 'Cliente';
	}

	return 'Cliente';
};

const extractShippingRecipient = (shippingAddress: Order['shipping_address']) => {
	if (!shippingAddress || typeof shippingAddress !== 'object') {
		return {
			email: null,
			name: null
		};
	}

	const payload = shippingAddress as Record<string, unknown>;
	const recipient = payload.recipient as Record<string, unknown> | undefined;
	const firstName = typeof recipient?.firstName === 'string' ? recipient.firstName.trim() : '';
	const lastName = typeof recipient?.lastName === 'string' ? recipient.lastName.trim() : '';
	const fullName = `${firstName} ${lastName}`.trim();

	return {
		email: typeof recipient?.email === 'string' ? recipient.email.trim().toLowerCase() : null,
		name: fullName || null
	};
};

const runSafeEmailTask = async (label: string, task: () => Promise<void>) => {
	try {
		await task();
	} catch (error) {
		console.error(`${label}-failed`, { error });
	}
};

const loadProfilesByIds = async (profileIds: string[]) => {
	if (profileIds.length === 0) {
		return new Map<string, ProfileIdentity>();
	}

	const { data, error } = await supabaseAdmin
		.from('profiles')
		.select('id, email, display_name')
		.in('id', profileIds);

	if (error) {
		throw error;
	}

	return new Map(((data ?? []) as ProfileIdentity[]).map((profile) => [profile.id, profile]));
};

const loadOrderEmailContext = async (orderId: string): Promise<OrderEmailContext | null> => {
	const { data: orderData, error: orderError } = await supabaseAdmin
		.from('orders')
		.select(
			'id, buyer_id, seller_id, total, shipping_address, tracking_number, shipping_provider'
		)
		.eq('id', orderId)
		.maybeSingle();

	if (orderError) {
		throw orderError;
	}

	const order = (orderData ?? null) as Pick<
		Order,
		'id' | 'buyer_id' | 'seller_id' | 'total' | 'shipping_address' | 'tracking_number' | 'shipping_provider'
	> | null;

	if (!order) {
		return null;
	}

	const { data: sellerData, error: sellerError } = order.seller_id
		? await supabaseAdmin
				.from('sellers')
				.select('id, profile_id, store_name, store_slug')
				.eq('id', order.seller_id)
				.maybeSingle()
		: { data: null, error: null };

	if (sellerError) {
		throw sellerError;
	}

	const seller = (sellerData ?? null) as SellerIdentity | null;
	const profileIds = [order.buyer_id, seller?.profile_id].filter(Boolean) as string[];
	const profileMap = await loadProfilesByIds(profileIds);
	const buyerProfile = order.buyer_id ? profileMap.get(order.buyer_id) ?? null : null;
	const sellerProfile = seller?.profile_id ? profileMap.get(seller.profile_id) ?? null : null;

	const { data: orderItemsData, error: orderItemsError } = await supabaseAdmin
		.from('order_items')
		.select('product_id, quantity, unit_price')
		.eq('order_id', order.id);

	if (orderItemsError) {
		throw orderItemsError;
	}

	const orderItems = (orderItemsData ?? []) as Array<
		Pick<OrderItem, 'product_id' | 'quantity' | 'unit_price'>
	>;
	const productIds = [...new Set(orderItems.flatMap((item) => (item.product_id ? [item.product_id] : [])))];
	const { data: productsData, error: productsError } = productIds.length
		? await supabaseAdmin.from('products').select('id, name').in('id', productIds)
		: { data: [], error: null };

	if (productsError) {
		throw productsError;
	}

	const productMap = new Map(
		((productsData ?? []) as Array<Pick<Product, 'id' | 'name'>>).map((product) => [product.id, product])
	);
	const shippingRecipient = extractShippingRecipient(order.shipping_address);
	const buyerEmail = buyerProfile?.email ?? shippingRecipient.email ?? null;
	const buyerName = buildRecipientName(buyerProfile?.display_name ?? shippingRecipient.name, buyerEmail);
	const sellerEmail = sellerProfile?.email ?? null;
	const sellerName = seller?.store_name ?? buildRecipientName(sellerProfile?.display_name, sellerEmail);

	return {
		orderId: order.id,
		orderNumber: buildOrderNumber(order.id),
		total: Number(order.total),
		buyerName,
		buyerEmail,
		sellerName,
		sellerEmail,
		sellerSlug: seller?.store_slug ?? null,
		trackingNumber: order.tracking_number,
		shippingProvider: order.shipping_provider,
		items: orderItems.map((item) => ({
			name: item.product_id ? (productMap.get(item.product_id)?.name ?? 'Producto eliminado') : 'Producto eliminado',
			quantity: item.quantity,
			unitPrice: Number(item.unit_price),
			total: Number(item.unit_price) * item.quantity
		}))
	};
};

export const sendOrderCompletionEmails = async (orderId: string) => {
	await runSafeEmailTask('send-order-completion-emails', async () => {
		const context = await loadOrderEmailContext(orderId);

		if (!context) {
			return;
		}

		const buyerDashboardHref = buildAbsoluteUrl('/dashboard?section=purchases');
		const sellerDashboardHref = buildAbsoluteUrl('/dashboard/seller');
		const tasks: Promise<unknown>[] = [];

		if (context.buyerEmail) {
			const buyerEmail = buildPurchaseConfirmationEmail({
				buyerName: context.buyerName,
				orderId: context.orderId,
				items: context.items,
				total: context.total,
				dashboardHref: buyerDashboardHref
			});

			tasks.push(
				sendEmail({
					to: context.buyerEmail,
					subject: buyerEmail.subject,
					html: buyerEmail.html
				})
			);
		}

		if (context.sellerEmail) {
			const sellerEmail = buildNewSaleEmail({
				storeName: context.sellerName,
				orderId: context.orderId,
				items: context.items,
				total: context.total,
				dashboardHref: sellerDashboardHref
			});

			tasks.push(
				sendEmail({
					to: context.sellerEmail,
					subject: sellerEmail.subject,
					html: sellerEmail.html
				})
			);
		}

		await Promise.all(tasks);
	});
};

export const sendShippingNotificationEmail = async (orderId: string) => {
	await runSafeEmailTask('send-shipping-notification-email', async () => {
		const context = await loadOrderEmailContext(orderId);

		if (!context?.buyerEmail || !context.trackingNumber || !context.shippingProvider) {
			return;
		}

		const email = buildShippingNotificationEmail({
			buyerName: context.buyerName,
			orderId: context.orderId,
			trackingNumber: context.trackingNumber,
			shippingProvider: context.shippingProvider,
			dashboardHref: buildAbsoluteUrl('/dashboard?section=purchases')
		});

		await sendEmail({
			to: context.buyerEmail,
			subject: email.subject,
			html: email.html
		});
	});
};

const loadSellerEmailContext = async (profileId: string): Promise<SellerEmailContext | null> => {
	const { data: profileData, error: profileError } = await supabaseAdmin
		.from('profiles')
		.select('id, email, display_name')
		.eq('id', profileId)
		.maybeSingle();

	if (profileError) {
		throw profileError;
	}

	const { data: sellerData, error: sellerError } = await supabaseAdmin
		.from('sellers')
		.select('profile_id, store_name, store_slug')
		.eq('profile_id', profileId)
		.maybeSingle();

	if (sellerError) {
		throw sellerError;
	}

	const profile = (profileData ?? null) as Pick<Profile, 'id' | 'email' | 'display_name'> | null;
	const seller = (sellerData ?? null) as Pick<Seller, 'profile_id' | 'store_name' | 'store_slug'> | null;

	if (!profile?.email || !seller?.store_slug) {
		return null;
	}

	return { profile, seller };
};

export const sendSellerPendingEmail = async (profileId: string) => {
	await runSafeEmailTask('send-seller-pending-email', async () => {
		const context = await loadSellerEmailContext(profileId);

		if (!context) {
			return;
		}

		const email = buildSellerPendingEmail({
			sellerName: context.profile.display_name?.trim() || context.seller.store_name,
			dashboardHref: buildAbsoluteUrl('/dashboard/seller'),
			helpHref: buildAbsoluteUrl('/ayuda')
		});

		await sendEmail({
			to: context.profile.email,
			subject: email.subject,
			html: email.html
		});
	});
};

export const sendSellerApprovedEmail = async (profileId: string) => {
	await runSafeEmailTask('send-seller-approved-email', async () => {
		const context = await loadSellerEmailContext(profileId);

		if (!context) {
			return;
		}

		const email = buildSellerApprovedEmail({
			sellerName: context.profile.display_name?.trim() || context.seller.store_name,
			storeSlug: context.seller.store_slug,
			dashboardHref: buildAbsoluteUrl('/dashboard/seller')
		});

		await sendEmail({
			to: context.profile.email,
			subject: email.subject,
			html: email.html
		});
	});
};

export const sendSellerRejectedEmail = async (profileId: string, rejectionReason: string) => {
	await runSafeEmailTask('send-seller-rejected-email', async () => {
		const context = await loadSellerEmailContext(profileId);

		if (!context) {
			return;
		}

		const email = buildSellerRejectedEmail({
			sellerName: context.profile.display_name?.trim() || context.seller.store_name,
			rejectionReason,
			helpHref: buildAbsoluteUrl('/ayuda')
		});

		await sendEmail({
			to: context.profile.email,
			subject: email.subject,
			html: email.html
		});
	});
};
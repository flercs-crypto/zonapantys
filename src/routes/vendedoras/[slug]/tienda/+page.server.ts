import { getFavoriteProductIds, toggleFavoriteProduct } from '$lib/services/buyer-dashboard.server';
import { recordStoreVisit } from '$lib/services/seller-dashboard.server';
import { resolvePublicSellerStorefront } from '$lib/services/seller-storefront.server';
import * as m from '$lib/paraglide/messages.js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const readTextField = (value: FormDataEntryValue | null) =>
	typeof value === 'string' ? value.trim() : '';

export const load: PageServerLoad = async ({ locals, params }) => {
	const storefront = await resolvePublicSellerStorefront(params.slug);

	if (!storefront) {
		throw error(404, 'Seller not found');
	}

	if (storefront.redirectRequired) {
		throw redirect(301, `/vendedoras/${storefront.canonicalSlug}/tienda`);
	}

	await recordStoreVisit(storefront.seller.id);

	const favoriteProductIds =
		locals.user && locals.user.roles.includes('buyer')
			? await getFavoriteProductIds(
					locals.user.uid,
					storefront.products.map((product) => product.id)
				)
			: [];

	return {
		session: locals.user,
		sellerSlug: storefront.canonicalSlug,
		seller: storefront.seller,
		products: storefront.products,
		favoriteProductIds,
		canManageFavorites: Boolean(locals.user?.roles.includes('buyer'))
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		if (!locals.user.roles.includes('buyer')) {
			return fail(403, {
				intent: 'toggle-favorite',
				scope: 'storefront',
				success: false,
				message: m.dashboard_client_favorite_storefront_role_required()
			});
		}

		const formData = await request.formData();
		const intent = readTextField(formData.get('intent'));
		const productId = readTextField(formData.get('productId'));

		if (intent !== 'toggle-favorite' || !productId) {
			return fail(400, {
				intent: 'toggle-favorite',
				scope: 'storefront',
				success: false,
				message: m.dashboard_client_action_invalid()
			});
		}

		const result = await toggleFavoriteProduct(locals.user.uid, productId);

		if (!result.success) {
			return fail(500, {
				intent: 'toggle-favorite',
				scope: 'storefront',
				success: false,
				message: m.dashboard_client_favorite_toggle_failed(),
				productId
			});
		}

		return {
			intent: 'toggle-favorite',
			scope: 'storefront',
			success: true,
			message:
				result.state === 'saved'
					? m.dashboard_client_favorite_saved()
					: m.dashboard_client_favorite_removed(),
			productId,
			state: result.state
		};
	}
};
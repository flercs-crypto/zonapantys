import { getOwnedProduct, getSellerDashboardContext } from '$lib/services/seller-dashboard.server';
import { PRODUCTS_BUCKET, removeStorageFolderObjects } from '$lib/services/storage.server';
import { supabaseAdmin } from '$lib/supabase/server';
import * as m from '$lib/paraglide/messages.js';
import { json, type RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ message: m.api_not_authenticated() }, { status: 401 });
	}

	if (!params.productId) {
		return json({ message: m.api_seller_product_not_found() }, { status: 404 });
	}

	const context = await getSellerDashboardContext(locals.user.uid);

	if (!context) {
		return json({ message: m.api_not_authenticated() }, { status: 403 });
	}

	const product = await getOwnedProduct(context.seller.id, params.productId);

	if (!product) {
		return json({ message: m.api_seller_product_not_found() }, { status: 404 });
	}

	await removeStorageFolderObjects(
		PRODUCTS_BUCKET,
		`products/${context.seller.id}/${product.id}`
	);

	const { error } = await supabaseAdmin.from('products').delete().eq('id', product.id);

	if (error) {
		return json({ message: m.dashboard_seller_product_delete_failed() }, { status: 500 });
	}

	return json({ success: true });
};
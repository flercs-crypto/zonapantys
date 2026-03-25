import { getOwnedProduct, getOwnedSellerById } from '$lib/services/seller-dashboard.server';
import {
	PRODUCTS_BUCKET,
	StorageUploadError,
	buildProductStoragePath,
	removeStorageFolderObjects,
	uploadPublicStorageObject,
	validateImageUpload
} from '$lib/services/storage.server';
import { uploadRateLimit } from '$lib/services/rate-limit.server';
import { supabaseAdmin } from '$lib/supabase/server';
import * as m from '$lib/paraglide/messages.js';
import type { Product } from '$lib/types/database.types';
import { json, type RequestHandler } from '@sveltejs/kit';

const readTextField = (value: FormDataEntryValue | null) =>
	typeof value === 'string' ? value.trim() : '';

const getUploadErrorResponse = (error: unknown) => {
	if (error instanceof StorageUploadError) {
		switch (error.code) {
			case 'storage/file-required':
				return { status: 400, message: m.dashboard_seller_form_image_required() };
			case 'storage/invalid-type':
				return { status: 400, message: m.service_storage_invalid_image_type() };
			case 'storage/file-too-large':
				return { status: 400, message: m.service_storage_image_too_large() };
			default:
				return { status: 500, message: m.service_products_upload_image_failed() };
		}
	}

	return { status: 500, message: m.service_products_upload_image_failed() };
};

export const POST: RequestHandler = async ({ locals, request, getClientAddress }) => {
	if (!locals.user) {
		return json({ message: m.api_not_authenticated() }, { status: 401 });
	}

	const { allowed, retryAfterMs } = uploadRateLimit.check(getClientAddress());

	if (!allowed) {
		return json(
			{ message: 'Too many requests' },
			{
				status: 429,
				headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) }
			}
		);
	}

	const formData = await request.formData();
	const sellerId = readTextField(formData.get('sellerId'));
	const productId = readTextField(formData.get('productId'));
	const name = readTextField(formData.get('name')).slice(0, 200);
	const description = readTextField(formData.get('description')).slice(0, 2000);
	const priceValue = Number(readTextField(formData.get('price')));
	const stockValue = Number(readTextField(formData.get('stock')));
	const existingImageUrl = readTextField(formData.get('existingImageUrl'));
	const imageField = formData.get('image');

	if (
		!sellerId ||
		!name ||
		name.length < 2 ||
		Number.isNaN(priceValue) ||
		priceValue <= 0 ||
		priceValue > 999999 ||
		!Number.isFinite(priceValue) ||
		!Number.isInteger(stockValue) ||
		stockValue < 0 ||
		stockValue > 999999
	) {
		return json({ message: m.dashboard_seller_form_invalid() }, { status: 400 });
	}

	const context = await getOwnedSellerById(locals.user.uid, sellerId);

	if (!context) {
		return json({ message: m.api_not_authenticated() }, { status: 403 });
	}

	const isEditing = productId.length > 0;
	const ownedProduct = isEditing ? await getOwnedProduct(sellerId, productId) : null;

	if (isEditing && !ownedProduct) {
		return json({ message: m.api_seller_product_not_found() }, { status: 404 });
	}

	const resolvedProductId = ownedProduct?.id ?? crypto.randomUUID();
	let imageUrl = existingImageUrl || ownedProduct?.images[0] || '';

	try {
		if (imageField instanceof File && imageField.size > 0) {
			const validatedImage = await validateImageUpload(imageField);
			const productFolder = `products/${sellerId}/${resolvedProductId}`;

			await removeStorageFolderObjects(PRODUCTS_BUCKET, productFolder);

			const upload = await uploadPublicStorageObject({
				bucket: PRODUCTS_BUCKET,
				path: buildProductStoragePath(sellerId, resolvedProductId, validatedImage.fileName),
				file: validatedImage,
				upsert: true
			});

			imageUrl = upload.publicUrl;
		}
	} catch (error) {
		const response = getUploadErrorResponse(error);
		return json({ message: response.message }, { status: response.status });
	}

	if (!imageUrl) {
		return json({ message: m.dashboard_seller_form_image_required() }, { status: 400 });
	}

	const isActive =
		stockValue === 0
			? false
			: ownedProduct
				? ownedProduct.stock === 0
					? true
					: ownedProduct.is_active
				: true;

	const payload = {
		id: resolvedProductId,
		seller_id: sellerId,
		name,
		description: description || null,
		price: priceValue,
		stock: stockValue,
		images: [imageUrl],
		category: null,
		is_active: isActive
	};

	const query = ownedProduct
		? supabaseAdmin.from('products').update(payload).eq('id', resolvedProductId)
		: supabaseAdmin.from('products').insert(payload);

	const { data, error } = await query.select('*').single();

	if (error) {
		return json({ message: m.dashboard_seller_product_save_failed() }, { status: 500 });
	}

	return json({ product: data as Product });
};
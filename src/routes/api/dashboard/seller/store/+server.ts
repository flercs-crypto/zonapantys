import { getSellerDashboardContext } from '$lib/services/seller-dashboard.server';
import {
	AVATARS_BUCKET,
	StorageUploadError,
	buildAvatarStoragePath,
	removeStorageFolderObjects,
	uploadPublicStorageObject,
	validateImageUpload
} from '$lib/services/storage.server';
import { uploadRateLimit } from '$lib/services/rate-limit.server';
import { supabaseAdmin } from '$lib/supabase/server';
import * as m from '$lib/paraglide/messages.js';
import type { Profile, Seller } from '$lib/types/database.types';
import { json, type RequestHandler } from '@sveltejs/kit';

const readTextField = (value: FormDataEntryValue | null) =>
	typeof value === 'string' ? value.trim() : '';

const getUploadErrorResponse = (error: unknown) => {
	if (error instanceof StorageUploadError) {
		switch (error.code) {
			case 'storage/invalid-type':
				return { status: 400, message: m.service_storage_invalid_image_type() };
			case 'storage/file-too-large':
				return { status: 400, message: m.service_storage_image_too_large() };
			default:
				return { status: 500, message: m.dashboard_seller_store_save_failed() };
		}
	}

	return { status: 500, message: m.dashboard_seller_store_save_failed() };
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

	const context = await getSellerDashboardContext(locals.user.uid);

	if (!context) {
		return json({ message: m.dashboard_seller_missing_store_copy() }, { status: 404 });
	}

	const formData = await request.formData();
	const description = readTextField(formData.get('description')).slice(0, 2000);
	const isActive = readTextField(formData.get('isActive')) !== 'false';
	const avatarField = formData.get('avatar');
	let avatarUrl = context.profile.avatar_url;

	try {
		if (avatarField instanceof File && avatarField.size > 0) {
			const validatedAvatar = await validateImageUpload(avatarField);
			const avatarFolder = `avatars/${locals.user.uid}`;

			await removeStorageFolderObjects(AVATARS_BUCKET, avatarFolder);

			const upload = await uploadPublicStorageObject({
				bucket: AVATARS_BUCKET,
				path: buildAvatarStoragePath(locals.user.uid, validatedAvatar.extension),
				file: validatedAvatar,
				upsert: true
			});

			avatarUrl = upload.publicUrl;
		}
	} catch (error) {
		const response = getUploadErrorResponse(error);
		return json({ message: response.message }, { status: response.status });
	}

	const { data: updatedProfile, error: profileError } = await supabaseAdmin
		.from('profiles')
		.update({ avatar_url: avatarUrl })
		.eq('id', context.profile.id)
		.select('*')
		.single();

	if (profileError) {
		return json({ message: m.dashboard_seller_store_save_failed() }, { status: 500 });
	}

	const { data: updatedSeller, error: sellerError } = await supabaseAdmin
		.from('sellers')
		.update({ description: description || null, logo_url: avatarUrl, is_active: isActive })
		.eq('id', context.seller.id)
		.select('*')
		.single();

	if (sellerError) {
		return json({ message: m.dashboard_seller_store_save_failed() }, { status: 500 });
	}

	return json({
		profile: updatedProfile as Profile,
		seller: updatedSeller as Seller
	});
};
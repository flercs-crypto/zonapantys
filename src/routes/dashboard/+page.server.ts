import { normalizeClientSection } from '$lib/components/dashboard-client/data';
import {
	getBuyerDashboardContext,
	getBuyerDashboardData,
	removeFavoriteProduct
} from '$lib/services/buyer-dashboard.server';
import {
	AVATARS_BUCKET,
	StorageUploadError,
	buildAvatarStoragePath,
	removeStorageFolderObjects,
	uploadPublicStorageObject,
	validateImageUpload
} from '$lib/services/storage.server';
import { supabaseAdmin } from '$lib/supabase/server';
import * as m from '$lib/paraglide/messages.js';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const readTextField = (value: FormDataEntryValue | null) =>
	typeof value === 'string' ? value.trim() : '';

const getUploadErrorMessage = (error: unknown) => {
	if (error instanceof StorageUploadError) {
		switch (error.code) {
			case 'storage/invalid-type':
				return m.service_storage_invalid_image_type();
			case 'storage/file-too-large':
				return m.service_storage_image_too_large();
			default:
				return m.dashboard_client_profile_save_failed();
		}
	}

	return m.dashboard_client_profile_save_failed();
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const activeSection = normalizeClientSection(url.searchParams.get('section'));
	const requestedPurchasesPage = Number(url.searchParams.get('purchasesPage') ?? '1');
	let dashboard = null;

	if (locals.user) {
		dashboard = await getBuyerDashboardData({
			firebaseUid: locals.user.uid,
			fallbackEmail: locals.user.email,
			fallbackDisplayName: locals.user.displayName,
			fallbackAvatarUrl: locals.user.avatarUrl,
			isGoogleAccount: locals.user.signInProvider === 'google.com',
			purchasesPage: requestedPurchasesPage
		});
	}

	return {
		session: locals.user,
		activeSection,
		dashboard
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(401, {
				intent: 'unknown',
				success: false,
				message: m.api_not_authenticated()
			});
		}

		const formData = await request.formData();
		const intent = readTextField(formData.get('intent'));
		const scope = readTextField(formData.get('scope')) || 'profile';

		if (intent === 'update-profile') {
			const displayName = readTextField(formData.get('displayName')).slice(0, 120);

			if (displayName.length < 2) {
				return fail(400, {
					intent,
					scope,
					success: false,
					message: m.auth_register_name_too_short()
				});
			}

			const context = await getBuyerDashboardContext(locals.user.uid);

			if (!context) {
				return fail(404, {
					intent,
					scope,
					success: false,
					message: m.dashboard_client_profile_unavailable()
				});
			}

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
				return fail(400, {
					intent,
					scope,
					success: false,
					message: getUploadErrorMessage(error)
				});
			}

			const { error } = await supabaseAdmin
				.from('profiles')
				.update({ display_name: displayName, avatar_url: avatarUrl })
				.eq('id', context.profile.id)
				.eq('firebase_uid', locals.user.uid);

			if (error) {
				return fail(500, {
					intent,
					scope,
					success: false,
					message: m.dashboard_client_profile_save_failed()
				});
			}

			return {
				intent,
				scope,
				success: true,
				message: m.dashboard_client_profile_saved()
			};
		}

		if (intent === 'remove-favorite') {
			const productId = readTextField(formData.get('productId'));

			if (!productId) {
				return fail(400, {
					intent,
					scope,
					success: false,
					message: m.dashboard_client_favorite_remove_failed()
				});
			}

			const result = await removeFavoriteProduct(locals.user.uid, productId);

			if (!result.success) {
				return fail(500, {
					intent,
					scope,
					success: false,
					message: m.dashboard_client_favorite_remove_failed()
				});
			}

			return {
				intent,
				scope,
				success: true,
				message: m.dashboard_client_favorite_removed(),
				productId
			};
		}

		return fail(400, {
			intent,
			success: false,
			message: m.dashboard_client_action_invalid()
		});
	}
};

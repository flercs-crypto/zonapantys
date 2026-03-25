import { hasAppRole } from '$lib/auth/roles';
import {
	deleteAdminProduct,
	getAdminDashboardProfile,
	getAdminOrdersSectionData,
	getAdminOverviewSectionData,
	getAdminProductsSectionData,
	getAdminReportsSectionData,
	getAdminSellersSectionData,
	getAdminUsersSectionData,
	markAdminOrderShipped,
	normalizeAdminSection,
	updateAdminOrderStatus,
	updateAdminProductActiveState,
	updateAdminSellerActiveState,
	updateAdminUserActiveState,
	updateAdminUserRole,
	type AdminDashboardSection,
	type AdminMutableOrderStatus,
	type AdminMutableRole
} from '$lib/services/admin-dashboard.server';
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
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const readTextField = (value: FormDataEntryValue | null) =>
	typeof value === 'string' ? value.trim() : '';

const readBooleanField = (value: FormDataEntryValue | null) => readTextField(value) === 'true';

const getUploadErrorMessage = (error: unknown) => {
	if (error instanceof StorageUploadError) {
		switch (error.code) {
			case 'storage/invalid-type':
				return m.service_storage_invalid_image_type();
			case 'storage/file-too-large':
				return m.service_storage_image_too_large();
			default:
				return m.dashboard_admin_profile_save_failed();
		}
	}

	return m.dashboard_admin_profile_save_failed();
};

const requireAdmin = async (locals: App.Locals) => {
	if (!locals.user || !hasAppRole('admin', locals.user.roles, locals.user.role)) {
		throw redirect(303, '/');
	}

	const adminProfile = await getAdminDashboardProfile(locals.user.uid, {
		fallbackDisplayName: locals.user.displayName,
		fallbackEmail: locals.user.email,
		fallbackAvatarUrl: locals.user.avatarUrl,
		isGoogleAccount: locals.user.signInProvider === 'google.com'
	});

	if (!adminProfile || !adminProfile.roles.includes('admin')) {
		throw redirect(303, '/');
	}

	return adminProfile;
};

const buildSectionData = async (
	section: AdminDashboardSection,
	url: URL,
	adminProfileId: string
) => {
	switch (section) {
		case 'users':
			return {
				users: await getAdminUsersSectionData({
					page: url.searchParams.get('usersPage'),
					search: url.searchParams.get('usersSearch'),
					role: url.searchParams.get('usersRole'),
					currentAdminProfileId: adminProfileId
				})
			};
		case 'sellers':
			return {
				sellers: await getAdminSellersSectionData({
					page: url.searchParams.get('sellersPage'),
					search: url.searchParams.get('sellersSearch'),
					status: url.searchParams.get('sellersStatus'),
					highlightSellerId: url.searchParams.get('sellerId')
				})
			};
		case 'products':
			return {
				products: await getAdminProductsSectionData({
					page: url.searchParams.get('productsPage'),
					search: url.searchParams.get('productsSearch'),
					status: url.searchParams.get('productsStatus')
				})
			};
		case 'orders':
			return {
				orders: await getAdminOrdersSectionData({
					page: url.searchParams.get('ordersPage'),
					search: url.searchParams.get('ordersSearch'),
					status: url.searchParams.get('ordersStatus')
				})
			};
		case 'reports':
			return {
				reports: await getAdminReportsSectionData()
			};
		case 'settings':
			return {};
		default:
			return {
				overview: await getAdminOverviewSectionData()
			};
	}
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const adminProfile = await requireAdmin(locals);
	const activeSection = normalizeAdminSection(url.searchParams.get('section'));
	const sectionData = await buildSectionData(activeSection, url, adminProfile.id);

	return {
		session: locals.user,
		adminProfile,
		activeSection,
		query: Object.fromEntries(url.searchParams.entries()),
		...sectionData
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const adminProfile = await requireAdmin(locals);
		const formData = await request.formData();
		const intent = readTextField(formData.get('intent'));
		const section = normalizeAdminSection(readTextField(formData.get('section')));

		try {
			if (intent === 'update-user-role') {
				const profileId = readTextField(formData.get('profileId'));
				const nextRole = readTextField(formData.get('nextRole')) as AdminMutableRole;

				if (!profileId || !['buyer', 'seller', 'admin'].includes(nextRole)) {
					return fail(400, {
						intent,
						section,
						success: false,
						message: m.dashboard_admin_action_invalid()
					});
				}

				await updateAdminUserRole(adminProfile.id, profileId, nextRole);

				return {
					intent,
					section,
					success: true,
					message: m.dashboard_admin_role_updated()
				};
			}

			if (intent === 'toggle-user-active') {
				const profileId = readTextField(formData.get('profileId'));
				const nextActive = readBooleanField(formData.get('nextActive'));

				if (!profileId) {
					return fail(400, {
						intent,
						section,
						success: false,
						message: m.dashboard_admin_action_invalid()
					});
				}

				await updateAdminUserActiveState(adminProfile.id, profileId, nextActive);

				return {
					intent,
					section,
					success: true,
					message: nextActive
						? m.dashboard_admin_account_activated()
						: m.dashboard_admin_account_deactivated()
				};
			}

			if (intent === 'toggle-seller-active') {
				const sellerId = readTextField(formData.get('sellerId'));
				const nextActive = readBooleanField(formData.get('nextActive'));

				if (!sellerId) {
					return fail(400, {
						intent,
						section,
						success: false,
						message: m.dashboard_admin_action_invalid()
					});
				}

				await updateAdminSellerActiveState(sellerId, nextActive);

				return {
					intent,
					section,
					success: true,
					message: nextActive
						? m.dashboard_admin_seller_activated()
						: m.dashboard_admin_seller_deactivated()
				};
			}

			if (intent === 'toggle-product-active') {
				const productId = readTextField(formData.get('productId'));
				const nextActive = readBooleanField(formData.get('nextActive'));

				if (!productId) {
					return fail(400, {
						intent,
						section,
						success: false,
						message: m.dashboard_admin_action_invalid()
					});
				}

				await updateAdminProductActiveState(productId, nextActive);

				return {
					intent,
					section,
					success: true,
					message: nextActive
						? m.dashboard_admin_product_activated()
						: m.dashboard_admin_product_deactivated()
				};
			}

			if (intent === 'delete-product') {
				const productId = readTextField(formData.get('productId'));

				if (!productId) {
					return fail(400, {
						intent,
						section,
						success: false,
						message: m.dashboard_admin_action_invalid()
					});
				}

				await deleteAdminProduct(productId);

				return {
					intent,
					section,
					success: true,
					message: m.dashboard_admin_product_deleted()
				};
			}

			if (intent === 'update-order-status') {
				const orderId = readTextField(formData.get('orderId'));
				const nextStatus = readTextField(formData.get('nextStatus')) as AdminMutableOrderStatus;

				if (!orderId || !['pending', 'processing', 'shipped', 'completed', 'cancelled'].includes(nextStatus)) {
					return fail(400, {
						intent,
						section,
						success: false,
						message: m.dashboard_admin_action_invalid()
					});
				}

				await updateAdminOrderStatus(orderId, nextStatus);

				return {
					intent,
					section,
					success: true,
					message: m.dashboard_admin_order_updated()
				};
			}

			if (intent === 'mark-order-shipped') {
				const orderId = readTextField(formData.get('orderId'));
				const shippingProvider = readTextField(formData.get('shippingProvider')).slice(0, 80);
				const trackingNumber = readTextField(formData.get('trackingNumber')).slice(0, 120);

				if (!orderId || !shippingProvider || !trackingNumber) {
					return fail(400, {
						intent,
						section,
						success: false,
						message: m.dashboard_admin_shipping_fields_required()
					});
				}

				await markAdminOrderShipped(orderId, shippingProvider, trackingNumber);

				return {
					intent,
					section,
					success: true,
					message: m.dashboard_admin_order_marked_shipped()
				};
			}

			if (intent === 'update-profile') {
				const displayName = readTextField(formData.get('displayName')).slice(0, 120);

				if (displayName.length < 2) {
					return fail(400, {
						intent,
						section,
						success: false,
						message: m.auth_register_name_too_short()
					});
				}

				let avatarUrl = adminProfile.avatarUrl;
				const avatarField = formData.get('avatar');

				try {
					if (avatarField instanceof File && avatarField.size > 0) {
						const validatedAvatar = await validateImageUpload(avatarField);
						const avatarFolder = `avatars/${locals.user?.uid}`;

						await removeStorageFolderObjects(AVATARS_BUCKET, avatarFolder);

						const upload = await uploadPublicStorageObject({
							bucket: AVATARS_BUCKET,
							path: buildAvatarStoragePath(locals.user?.uid ?? adminProfile.firebaseUid, validatedAvatar.extension),
							file: validatedAvatar,
							upsert: true
						});

						avatarUrl = upload.publicUrl;
					}
				} catch (error) {
					return fail(400, {
						intent,
						section,
						success: false,
						message: getUploadErrorMessage(error)
					});
				}

				const { error } = await supabaseAdmin
					.from('profiles')
					.update({ display_name: displayName, avatar_url: avatarUrl })
					.eq('id', adminProfile.id)
					.eq('firebase_uid', adminProfile.firebaseUid);

				if (error) {
					return fail(500, {
						intent,
						section,
						success: false,
						message: m.dashboard_admin_profile_save_failed()
					});
				}

				return {
					intent,
					section,
					success: true,
					message: m.dashboard_admin_profile_saved()
				};
			}
		} catch (error) {
			const message =
				error instanceof Error && error.message === 'admin-self-disable-forbidden'
					? m.dashboard_admin_self_disable_forbidden()
					: error instanceof Error && error.message === 'admin-self-role-change-forbidden'
						? m.dashboard_admin_self_role_change_forbidden()
						: m.dashboard_admin_action_failed();

			return fail(500, {
				intent,
				section,
				success: false,
				message
			});
		}

		return fail(400, {
			intent,
			section,
			success: false,
			message: m.dashboard_admin_action_invalid()
		});
	}
};
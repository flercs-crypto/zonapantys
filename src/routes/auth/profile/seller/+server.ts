import { isRegistrationRole } from '$lib/auth/roles';
import { verifyFirebaseToken } from '$lib/firebase/server';
import * as m from '$lib/paraglide/messages.js';
import {
	ensureFirebaseProfileFromTokenWithResult
} from '$lib/services/auth-profile.server';
import {
	buildVerificationSelfieStoragePath,
	removeStorageFolderObjects,
	removeStorageObject,
	uploadPrivateStorageObject,
	validateImageUpload,
	VERIFICATIONS_BUCKET
} from '$lib/services/storage.server';
import { sendSellerPendingEmail } from '$lib/server/transactional-emails';
import { json, type RequestHandler } from '@sveltejs/kit';

const normalizeText = (value: FormDataEntryValue | null, maxLength: number) =>
	typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const token = normalizeText(formData.get('token'), 4096);
	const displayName = normalizeText(formData.get('displayName'), 120);
	const storeName = normalizeText(formData.get('storeName'), 80);
	const country = normalizeText(formData.get('country'), 80);
	const phone = normalizeText(formData.get('phone'), 40);
	const description = normalizeText(formData.get('description'), 300);
	const selfieField = formData.get('selfie');

	if (!token) {
		return json({ message: m.api_token_required() }, { status: 400 });
	}

	if (!isRegistrationRole('seller')) {
		return json({ message: m.api_role_required() }, { status: 400 });
	}

	if (displayName.length < 2) {
		return json({ message: m.auth_register_name_too_short() }, { status: 400 });
	}

	if (storeName.length < 2) {
		return json({ message: m.api_store_name_required() }, { status: 400 });
	}

	if (country.length < 2) {
		return json({ message: m.api_seller_country_required() }, { status: 400 });
	}

	if (phone.length < 7) {
		return json({ message: m.api_seller_phone_required() }, { status: 400 });
	}

	const payload = await verifyFirebaseToken(token);
	let selfiePath: string | null = null;

	try {
		const validatedSelfie = await validateImageUpload(selfieField);
		const folderPath = payload.sub;

		await removeStorageFolderObjects(VERIFICATIONS_BUCKET, folderPath);

		selfiePath = buildVerificationSelfieStoragePath(payload.sub, validatedSelfie.extension);

		await uploadPrivateStorageObject({
			bucket: VERIFICATIONS_BUCKET,
			path: selfiePath,
			file: validatedSelfie,
			upsert: true
		});

		const profileResult = await ensureFirebaseProfileFromTokenWithResult(payload, {
			role: 'seller',
			storeName,
			sellerDescription: description,
			sellerPhone: phone,
			sellerCountry: country,
			verificationSelfieUrl: selfiePath,
			createIfMissing: true,
			logContext: '/auth/profile/seller POST'
		}).catch((error) => {
			console.error('firebase-profile-sync-failed', {
				context: '/auth/profile/seller POST',
				uid: payload.sub,
				error
			});
			return null;
		});

		if (!profileResult?.profile) {
			throw new Error('seller-profile-sync-failed');
		}

		if (['created', 'role-added'].includes(profileResult.action)) {
			await sendSellerPendingEmail(profileResult.profile.id);
		}

		return json({
			profile: profileResult.profile,
			action: profileResult.action,
			hadRoleBefore: profileResult.hadRoleBefore
		});
	} catch (error) {
		if (selfiePath) {
			await removeStorageObject(VERIFICATIONS_BUCKET, selfiePath).catch(() => undefined);
		}

		const message = error instanceof Error ? error.message : m.api_profile_sync_failed();
		return json({ message }, { status: 400 });
	}
};
import { isRegistrationRole, normalizeAppRole } from '$lib/auth/roles';
import {
	ensureFirebaseProfile,
	ensureFirebaseProfileFromTokenWithResult
} from '$lib/services/auth-profile.server';
import { verifyFirebaseToken } from '$lib/firebase/server';
import * as m from '$lib/paraglide/messages.js';
import { sendSellerWelcomeEmail } from '$lib/server/transactional-emails';
import type { RegistrationRole } from '$lib/types/database.types';
import { json, type RequestHandler } from '@sveltejs/kit';

type ProfileRegistrationRequest = {
	token?: string;
	role?: RegistrationRole;
	profile?: {
		displayName?: string | null;
		avatarUrl?: string | null;
	};
	seller?: {
		storeName?: string | null;
		description?: string | null;
	};
};
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ message: m.api_not_authenticated() }, { status: 401 });
	}

	const profile = await ensureFirebaseProfile(
		{
			uid: locals.user.uid,
			email: locals.user.email,
			displayName: locals.user.displayName,
			avatarUrl: null,
			emailVerified: locals.user.emailVerified
		},
		{
			createIfMissing: false,
			logContext: '/auth/profile GET'
		}
	).catch((error) => {
		console.error('firebase-profile-sync-failed', {
			context: '/auth/profile GET',
			uid: locals.user?.uid,
			error
		});
		return null;
	});

	return json({
		profile: profile
			? {
				...profile,
				role: normalizeAppRole(profile.role),
				roles: profile.roles
			}
			: null
	});
};

export const POST: RequestHandler = async ({ request }) => {
	let token: string | undefined;
	let role: ProfileRegistrationRequest['role'];
	let profile: ProfileRegistrationRequest['profile'];
	let seller: ProfileRegistrationRequest['seller'];

	try {
		const body = (await request.json()) as ProfileRegistrationRequest;
		token = body.token;
		role = body.role;
		profile = body.profile;
		seller = body.seller;
	} catch {
		return json({ message: m.api_invalid_payload() }, { status: 400 });
	}

	if (!token) {
		return json({ message: m.api_token_required() }, { status: 400 });
	}

	const payload = await verifyFirebaseToken(token);

	if (!isRegistrationRole(role)) {
		return json({ message: m.api_role_required() }, { status: 400 });
	}

	const storeName = seller?.storeName?.trim() ?? '';

	if (role === 'seller' && storeName.length < 2) {
		return json({ message: m.api_store_name_required() }, { status: 400 });
	}

	const profileResult = await ensureFirebaseProfileFromTokenWithResult(payload, {
		role,
		storeName,
		sellerDescription: seller?.description ?? null,
		createIfMissing: true,
		logContext: '/auth/profile POST'
	}).catch((error) => {
		console.error('firebase-profile-sync-failed', {
			context: '/auth/profile POST',
			uid: payload.sub,
			error
		});
		return null;
	});

	if (!profileResult?.profile) {
		return json({ message: m.api_profile_sync_failed() }, { status: 500 });
	}

	if (role === 'seller' && ['created', 'role-added'].includes(profileResult.action)) {
		await sendSellerWelcomeEmail(profileResult.profile.id);
	}

	return json({
		profile: profileResult.profile,
		action: profileResult.action,
		hadRoleBefore: profileResult.hadRoleBefore
	});
};

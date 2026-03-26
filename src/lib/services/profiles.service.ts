import { browser } from '$app/environment';
import { normalizeAppRole } from '$lib/auth/roles';
import * as m from '$lib/paraglide/messages.js';
import { supabase } from '$lib/supabase/client';
import type {
	Profile,
	ProfileRegistrationAction,
	ProfileUpdate,
	RegistrationRole
} from '$lib/types/database.types';
import { createDataServiceError } from './service.utils';
import type { User as FirebaseUser } from 'firebase/auth';

type ProfileRegistrationInput = {
	role: RegistrationRole;
	displayName?: string | null;
	avatarUrl?: string | null;
	storeName?: string | null;
};

type SellerVerificationRegistrationInput = {
	displayName?: string | null;
	storeName: string;
	country: string;
	phone: string;
	description: string;
	selfieFile: File;
};

export type ProfileRegistrationResult = {
	profile: Profile;
	action: ProfileRegistrationAction;
	hadRoleBefore: boolean;
};

const readResponseMessage = async (response: Response, fallbackMessage: string) => {
	try {
		const payload = (await response.json()) as { message?: string };
		return typeof payload.message === 'string' && payload.message.length > 0
			? payload.message
			: fallbackMessage;
	} catch {
		return fallbackMessage;
	}
};

const normalizeProfile = (profile: Profile | null): Profile | null => {
	if (!profile) {
		return null;
	}

	const role = normalizeAppRole(profile.role);
	const roles = Array.from(
		new Set(
			(profile.roles ?? []).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
		)
	);

	if (!role && roles.length === 0) {
		return null;
	}

	return {
		...profile,
		role,
		roles
	};
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
	const { data, error } = await supabase
		.from('profiles')
		.select('*')
		.eq('firebase_uid', userId)
		.maybeSingle();

	if (error) {
		throw createDataServiceError(m.service_profiles_fetch_failed(), 'profiles/fetch-failed', error);
	}

	return normalizeProfile(data);
};

export const updateProfile = async (
	userId: string,
	data: Partial<ProfileUpdate>
): Promise<Profile> => {
	const { data: updatedProfile, error } = await supabase
		.from('profiles')
		.update(data)
		.eq('firebase_uid', userId)
		.select('*')
		.single();

	if (error) {
		throw createDataServiceError(
			m.service_profiles_update_failed(),
			'profiles/update-failed',
			error
		);
	}

	return normalizeProfile(updatedProfile) ?? updatedProfile;
};

export const getCurrentSessionProfile = async (): Promise<Profile | null> => {
	if (!browser) {
		return null;
	}

	const response = await fetch('/auth/profile');

	if (response.status === 401) {
		return null;
	}

	if (!response.ok) {
		throw createDataServiceError(
			await readResponseMessage(response, m.service_profiles_current_session_failed()),
			'profiles/current-session-fetch'
		);
	}

	const payload = (await response.json()) as { profile: Profile | null };
	return normalizeProfile(payload.profile);
};

export const createProfileRegistration = async (
	user: FirebaseUser,
	input: ProfileRegistrationInput
): Promise<ProfileRegistrationResult> => {
	if (!browser) {
		throw createDataServiceError(
			m.service_profiles_browser_required(),
			'profiles/browser-required'
		);
	}

	const token = await user.getIdToken(true);
	const response = await fetch('/auth/profile', {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			token,
			role: input.role,
			profile: {
				displayName: input.displayName ?? user.displayName ?? null,
				avatarUrl: input.avatarUrl ?? user.photoURL ?? null
			},
			seller:
				input.role === 'seller'
					? {
						storeName: input.storeName ?? null
					}
					: undefined
		})
	});

	if (!response.ok) {
		throw createDataServiceError(
			await readResponseMessage(response, m.service_profiles_upsert_failed()),
			'profiles/upsert-failed'
		);
	}

	const payload = (await response.json()) as {
		profile: Profile;
		action: ProfileRegistrationAction;
		hadRoleBefore: boolean;
	};
	const profile = normalizeProfile(payload.profile);

	if (!profile) {
		throw createDataServiceError(m.service_profiles_upsert_failed(), 'profiles/upsert-invalid-role');
	}

	return {
		profile,
		action: payload.action,
		hadRoleBefore: payload.hadRoleBefore
	};
};

export const createSellerVerificationRegistration = async (
	user: FirebaseUser,
	input: SellerVerificationRegistrationInput
): Promise<ProfileRegistrationResult> => {
	if (!browser) {
		throw createDataServiceError(
			m.service_profiles_browser_required(),
			'profiles/browser-required'
		);
	}

	const token = await user.getIdToken(true);
	const formData = new FormData();
	formData.set('token', token);
	formData.set('displayName', input.displayName ?? user.displayName ?? '');
	formData.set('storeName', input.storeName);
	formData.set('country', input.country);
	formData.set('phone', input.phone);
	formData.set('description', input.description);
	formData.set('selfie', input.selfieFile);

	const response = await fetch('/auth/profile/seller', {
		method: 'POST',
		body: formData
	});

	if (!response.ok) {
		throw createDataServiceError(
			await readResponseMessage(response, m.service_profiles_upsert_failed()),
			'profiles/seller-registration-failed'
		);
	}

	const payload = (await response.json()) as {
		profile: Profile;
		action: ProfileRegistrationAction;
		hadRoleBefore: boolean;
	};
	const profile = normalizeProfile(payload.profile);

	if (!profile) {
		throw createDataServiceError(m.service_profiles_upsert_failed(), 'profiles/upsert-invalid-role');
	}

	return {
		profile,
		action: payload.action,
		hadRoleBefore: payload.hadRoleBefore
	};
};

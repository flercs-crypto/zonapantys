import { getPrimaryAppRole, normalizeAppRole, normalizeAppRoles, toDatabaseProfileRole } from '$lib/auth/roles';
import type { FirebaseSessionPayload } from '$lib/firebase/server';
import { supabaseAdmin } from '$lib/supabase/server';
import type {
	AppRole,
	Profile,
	ProfileRegistrationAction,
	RegistrationRole,
	Seller
} from '$lib/types/database.types';

type FirebaseProfileSnapshot = {
	uid: string;
	email: string | null;
	displayName: string | null;
	avatarUrl: string | null;
	emailVerified: boolean;
};

type EnsureFirebaseProfileOptions = {
	role?: RegistrationRole;
	storeName?: string | null;
	sellerDescription?: string | null;
	sellerPhone?: string | null;
	sellerCountry?: string | null;
	verificationSelfieUrl?: string | null;
	createIfMissing?: boolean;
	logContext?: string;
};

type PostgrestLikeError = {
	code?: string;
	message?: string;
};

type ProfileSyncResult = {
	profile: Profile | null;
	action: ProfileRegistrationAction;
	hadRoleBefore: boolean;
};

const MAX_RETRIES = 2;

const slugify = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 48);

const buildStoreSlug = (storeName: string, firebaseUid: string) => {
	const slugBase = slugify(storeName) || 'seller';
	return `${slugBase}-${firebaseUid.slice(0, 6).toLowerCase()}`;
};

const normalizeText = (value: string | null | undefined) => {
	const trimmed = value?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : null;
};

const isRoleNotNullConstraintError = (error: unknown) => {
	const candidate = error as PostgrestLikeError | null;
	return (
		candidate?.code === '23502' &&
		typeof candidate.message === 'string' &&
		candidate.message.includes('column "role"') &&
		candidate.message.includes('not-null constraint')
	);
};

const isDuplicateFirebaseUidError = (error: unknown) => {
	const candidate = error as PostgrestLikeError | null;
	return (
		candidate?.code === '23505' &&
		typeof candidate.message === 'string' &&
		candidate.message.includes('profiles_firebase_uid_key')
	);
};

const normalizeProfileRoles = (profile: Pick<Profile, 'role' | 'roles'> | null) => {
	if (!profile) {
		return [] as AppRole[];
	}

	return normalizeAppRoles(profile.roles, profile.role);
};

const resolveStoredPrimaryRole = (
	existingRole: unknown,
	nextRoles: AppRole[],
	requestedRole?: RegistrationRole
) => {
	const normalizedExistingRole = normalizeAppRole(existingRole);

	if (normalizedExistingRole === 'admin' && nextRoles.includes('admin')) {
		return 'admin';
	}

	if (normalizedExistingRole === 'seller' && nextRoles.includes('seller')) {
		return 'seller';
	}

	if (requestedRole === 'seller' && nextRoles.includes('seller')) {
		return 'seller';
	}

	if (normalizedExistingRole && nextRoles.includes(normalizedExistingRole)) {
		return normalizedExistingRole;
	}

	return getPrimaryAppRole(nextRoles);
};

const normalizeProfile = (profile: Profile | null): Profile | null => {
	if (!profile) {
		return null;
	}

	const roles = normalizeAppRoles(profile.roles, profile.role);
	const role = resolveStoredPrimaryRole(profile.role, roles as RegistrationRole[]) ?? null;

	return {
		...profile,
		role,
		roles
	};
};

const toFirebaseProfileSnapshot = (payload: FirebaseSessionPayload): FirebaseProfileSnapshot => ({
	uid: payload.sub,
	email: payload.email ?? null,
	displayName: typeof payload.name === 'string' ? payload.name : null,
	avatarUrl: typeof payload.picture === 'string' ? payload.picture : null,
	emailVerified: payload.email_verified ?? false
});

const withRetry = async <T>(operation: () => Promise<T>, logContext: string) => {
	let lastError: unknown;

	for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;

			if (attempt < MAX_RETRIES) {
				console.error('firebase-profile-sync-retry', {
					context: logContext,
					attempt,
					error
				});
			}
		}
	}

	throw lastError;
};

const ensureSellerProfile = async (
	profile: Profile,
	snapshot: FirebaseProfileSnapshot,
	options: EnsureFirebaseProfileOptions
) => {
	if (options.role !== 'seller') {
		return;
	}

	const storeName = normalizeText(options.storeName);

	if (!storeName) {
		throw new Error('seller-store-name-required');
	}

	const { data: existingSeller, error: existingSellerError } = await supabaseAdmin
		.from('sellers')
		.select('*')
		.eq('profile_id', profile.id)
		.maybeSingle<Seller>();

	if (existingSellerError) {
		throw existingSellerError;
	}

	if (existingSeller) {
		return;
	}

	const { error: sellerError } = await supabaseAdmin.from('sellers').insert({
		profile_id: profile.id,
		store_name: storeName,
		store_slug: buildStoreSlug(storeName, snapshot.uid),
		description: normalizeText(options.sellerDescription),
		phone: normalizeText(options.sellerPhone),
		country: normalizeText(options.sellerCountry),
		logo_url: profile.avatar_url,
		is_active: false,
		verification_status: 'pending',
		verification_selfie_url: normalizeText(options.verificationSelfieUrl),
		rejection_reason: null,
		verified_at: null
	});

	if (sellerError) {
		throw sellerError;
	}
};

const syncFirebaseProfileOnce = async (
	snapshot: FirebaseProfileSnapshot,
	options: EnsureFirebaseProfileOptions = {}
): Promise<ProfileSyncResult> => {
	const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
		.from('profiles')
		.select('*')
		.eq('firebase_uid', snapshot.uid)
		.maybeSingle();

	if (existingProfileError) {
		throw existingProfileError;
	}

	const normalizedEmail = snapshot.email ?? '';
	const normalizedDisplayName = normalizeText(snapshot.displayName);
	const normalizedAvatarUrl = normalizeText(snapshot.avatarUrl);
	const shouldCreate = options.createIfMissing ?? true;
	let matchedProfile = (existingProfile ?? null) as Profile | null;

	if (!matchedProfile && normalizedEmail) {
		const { data: existingProfileByEmail, error: existingProfileByEmailError } = await supabaseAdmin
			.from('profiles')
			.select('*')
			.eq('email', normalizedEmail)
			.maybeSingle();

		if (existingProfileByEmailError) {
			throw existingProfileByEmailError;
		}

		matchedProfile = (existingProfileByEmail ?? null) as Profile | null;
	}

	const existingRoles = normalizeProfileRoles(matchedProfile);
	const hadRoleBefore = existingRoles.length > 0;
	const nextRoles = options.role
		? normalizeAppRoles(existingRoles, options.role)
		: existingRoles;
	const nextStoredRole = toDatabaseProfileRole(
		resolveStoredPrimaryRole(matchedProfile?.role ?? null, nextRoles, options.role)
	);
	const rolesChanged =
		nextRoles.length !== existingRoles.length || nextRoles.some((role) => !existingRoles.includes(role));
	const roleAdded = options.role ? !existingRoles.includes(options.role) : false;
	const profilePayload = {
		firebase_uid: snapshot.uid,
		email: normalizedEmail,
		display_name: normalizedDisplayName,
		avatar_url: normalizedAvatarUrl,
		email_verified: snapshot.emailVerified,
		role: nextStoredRole,
		roles: nextRoles
	};

	if (matchedProfile) {
		const needsUpdate =
			matchedProfile.firebase_uid !== snapshot.uid ||
			matchedProfile.email !== normalizedEmail ||
			matchedProfile.display_name !== normalizedDisplayName ||
			matchedProfile.avatar_url !== normalizedAvatarUrl ||
			matchedProfile.email_verified !== snapshot.emailVerified ||
			matchedProfile.role !== nextStoredRole ||
			rolesChanged;

		if (needsUpdate) {
			const updateResult = await supabaseAdmin
				.from('profiles')
				.upsert(
					{
						id: matchedProfile.id,
						...profilePayload
					},
					{ onConflict: 'id' }
				)
				.select('*')
				.single();

			if (updateResult.error) {
				if (isDuplicateFirebaseUidError(updateResult.error)) {
					return syncFirebaseProfileOnce(snapshot, {
						...options,
						createIfMissing: false
					});
				}

				throw updateResult.error;
			}

			const updatedProfile = normalizeProfile((updateResult.data ?? null) as Profile | null);

			if (updatedProfile && options.role === 'seller') {
				await ensureSellerProfile(updatedProfile, snapshot, options);
			}

			return {
				profile: updatedProfile,
				action: roleAdded ? 'role-added' : 'updated',
				hadRoleBefore
			};
		}

		const normalizedProfile = normalizeProfile(matchedProfile as Profile);

		if (normalizedProfile && options.role === 'seller') {
			await ensureSellerProfile(normalizedProfile, snapshot, options);
		}

		return {
			profile: normalizedProfile,
			action: roleAdded ? 'role-added' : 'noop',
			hadRoleBefore
		};
	}

	if (!shouldCreate) {
		return {
			profile: null,
			action: 'noop',
			hadRoleBefore: false
		};
	}

	const insertResult = await supabaseAdmin
		.from('profiles')
		.upsert(profilePayload, { onConflict: 'firebase_uid' })
		.select('*')
		.single();

	if (insertResult.error) {
		if (isDuplicateFirebaseUidError(insertResult.error)) {
			return syncFirebaseProfileOnce(snapshot, {
				...options,
				createIfMissing: false
			});
		}

		if (!options.role && isRoleNotNullConstraintError(insertResult.error)) {
			console.error('firebase-profile-sync-skipped', {
				context: options.logContext ?? 'unknown',
				uid: snapshot.uid,
				reason: 'profiles.role still requires NOT NULL in database'
			});
			return {
				profile: null,
				action: 'noop',
				hadRoleBefore: false
			};
		}

		throw insertResult.error;
	}

	const createdProfile = normalizeProfile((insertResult.data ?? null) as Profile | null);

	if (createdProfile && options.role === 'seller') {
		await ensureSellerProfile(createdProfile, snapshot, options);
	}

	return {
		profile: createdProfile,
		action: 'created',
		hadRoleBefore: false
	};
};

export const ensureFirebaseProfile = async (
	snapshot: FirebaseProfileSnapshot,
	options: EnsureFirebaseProfileOptions = {}
): Promise<Profile | null> => {
	const logContext = options.logContext ?? 'unknown';

	const result = await withRetry(() => syncFirebaseProfileOnce(snapshot, options), logContext);
	return result.profile;
};

export const ensureFirebaseProfileWithResult = async (
	snapshot: FirebaseProfileSnapshot,
	options: EnsureFirebaseProfileOptions = {}
): Promise<ProfileSyncResult> => {
	const logContext = options.logContext ?? 'unknown';
	return withRetry(() => syncFirebaseProfileOnce(snapshot, options), logContext);
};

export const ensureFirebaseProfileFromToken = async (
	payload: FirebaseSessionPayload,
	options: EnsureFirebaseProfileOptions = {}
) => ensureFirebaseProfile(toFirebaseProfileSnapshot(payload), options);

export const ensureFirebaseProfileFromTokenWithResult = async (
	payload: FirebaseSessionPayload,
	options: EnsureFirebaseProfileOptions = {}
) => ensureFirebaseProfileWithResult(toFirebaseProfileSnapshot(payload), options);
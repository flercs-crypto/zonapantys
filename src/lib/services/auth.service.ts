import { browser } from '$app/environment';
import { resolveRoleHome } from '$lib/auth/roles';
import { auth, authPersistenceReady } from '$lib/firebase/client';
import * as m from '$lib/paraglide/messages.js';
import { clearServerSession, syncServerSession } from '$lib/services/auth-session.service';
import { createProfileRegistration, getCurrentSessionProfile } from '$lib/services/profiles.service';
import type { RegistrationRole } from '$lib/types/database.types';
import {
	GoogleAuthProvider,
	createUserWithEmailAndPassword,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
	updateProfile,
	type User,
	type UserCredential
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

type RegistrationDetails = {
	storeName?: string;
};

type RegisterResult = {
	status: 'created' | 'role-added-existing';
	role: RegistrationRole;
};

type CompleteRegistrationResult = {
	status: 'completed' | 'role-added-existing';
	redirectTo: string;
	role: RegistrationRole;
};

type GoogleLoginResult = {
	credential: UserCredential;
	redirectTo: string;
};

const getFirebaseErrorMessages = (): Record<string, string> => ({
	'auth/email-already-in-use': m.service_auth_email_already_in_use(),
	'auth/invalid-email': m.service_auth_invalid_email(),
	'auth/weak-password': m.service_auth_weak_password(),
	'auth/user-not-found': m.service_auth_invalid_credentials(),
	'auth/wrong-password': m.service_auth_invalid_credentials(),
	'auth/invalid-credential': m.service_auth_invalid_credentials(),
	'auth/popup-closed-by-user': m.service_auth_popup_closed(),
	'auth/popup-blocked': m.service_auth_popup_blocked(),
	'auth/cancelled-popup-request': m.service_auth_popup_cancelled(),
	'auth/account-exists-with-different-credential':
		m.service_auth_account_exists_different_credential(),
	'auth/too-many-requests': m.service_auth_too_many_requests(),
	'auth/network-request-failed': m.service_auth_network_failed(),
	'auth/missing-password': m.service_auth_missing_password(),
	'auth/user-disabled': m.service_auth_user_disabled(),
	'auth/email-not-verified': m.service_auth_email_not_verified()
});

export class AuthServiceError extends Error {
	code: string;
	friendlyMessage: string;
	cause?: unknown;

	constructor(code: string, friendlyMessage: string, cause?: unknown) {
		super(friendlyMessage);
		this.name = 'AuthServiceError';
		this.code = code;
		this.friendlyMessage = friendlyMessage;
		this.cause = cause;
	}
}

const toAuthServiceError = (error: unknown, fallbackMessage: string) => {
	if (error instanceof AuthServiceError) {
		return error;
	}

	if (error instanceof FirebaseError) {
		const firebaseErrorMessages = getFirebaseErrorMessages();
		return new AuthServiceError(
			error.code,
			firebaseErrorMessages[error.code] ?? fallbackMessage,
			error
		);
	}

	return new AuthServiceError('auth/unknown', fallbackMessage, error);
};

const syncAuthenticatedSession = async (user: User) => {
	try {
		return await syncServerSession(user);
	} catch (error) {
		throw new AuthServiceError(
			'auth/session-sync-failed',
			error instanceof Error ? error.message : m.service_auth_session_sync_failed(),
			error
		);
	}
};

const rollbackAuthenticatedUser = async () => {
	const results = await Promise.allSettled([signOut(auth), clearServerSession()]);
	const failedResult = results.find((result) => result.status === 'rejected');

	if (failedResult?.status === 'rejected') {
		throw failedResult.reason;
	}
};

export const register = async (
	email: string,
	password: string,
	displayName: string,
	role: RegistrationRole,
	details?: RegistrationDetails
): Promise<RegisterResult> => {
	await authPersistenceReady;
	let credential: UserCredential | null = null;

	try {
		credential = await createUserWithEmailAndPassword(auth, email, password);
		await updateProfile(credential.user, { displayName });
		await sendEmailVerification(credential.user);
		await createProfileRegistration(credential.user, {
			role,
			displayName,
			avatarUrl: credential.user.photoURL ?? null,
			storeName: details?.storeName
		});
		await syncAuthenticatedSession(credential.user);
		return {
			status: 'created',
			role
		};
	} catch (error) {
		if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
			const existingCredential = await signInWithEmailAndPassword(auth, email, password).catch(
				() => null
			);

			if (!existingCredential) {
				throw new AuthServiceError(
					'auth/account-exists-login',
					m.auth_register_existing_account_login(),
					error
				);
			}

			try {
				if (displayName.trim().length > 0 && displayName.trim() !== (existingCredential.user.displayName ?? '')) {
					await updateProfile(existingCredential.user, { displayName: displayName.trim() });
				}

				const registrationResult = await createProfileRegistration(existingCredential.user, {
					role,
					displayName,
					avatarUrl: existingCredential.user.photoURL ?? null,
					storeName: details?.storeName
				});

				await rollbackAuthenticatedUser().catch(() => undefined);

				if (registrationResult.action === 'role-added' && registrationResult.hadRoleBefore) {
					return {
						status: 'role-added-existing',
						role
					};
				}

				throw new AuthServiceError(
					'auth/account-exists-login',
					m.auth_register_existing_account_login(),
					error
				);
			} catch (roleRegistrationError) {
				await rollbackAuthenticatedUser().catch(() => undefined);

				if (roleRegistrationError instanceof AuthServiceError) {
					throw roleRegistrationError;
				}

				throw toAuthServiceError(roleRegistrationError, m.service_auth_register_failed());
			}
		}

		if (credential) {
			await rollbackAuthenticatedUser().catch(() => undefined);
		}

		throw toAuthServiceError(error, m.service_auth_register_failed());
	}
};

export const login = async (email: string, password: string): Promise<UserCredential> => {
	await authPersistenceReady;
	let credential: UserCredential | null = null;

	try {
		credential = await signInWithEmailAndPassword(auth, email, password);

		if (!credential.user.emailVerified) {
			await sendEmailVerification(credential.user).catch(() => undefined);
		}

		await syncAuthenticatedSession(credential.user);
		return credential;
	} catch (error) {
		if (credential?.user) {
			await rollbackAuthenticatedUser().catch(() => undefined);
		}

		throw toAuthServiceError(error, m.service_auth_login_failed());
	}
};

export const loginWithGoogle = async (): Promise<GoogleLoginResult> => {
	await authPersistenceReady;
	let credential: UserCredential | null = null;

	try {
		const provider = new GoogleAuthProvider();
		provider.setCustomParameters({ prompt: 'select_account' });
		credential = await signInWithPopup(auth, provider);
		const session = await syncAuthenticatedSession(credential.user);

		if (!credential.user.emailVerified) {
			await sendEmailVerification(credential.user).catch(() => undefined);
			return {
				credential,
				redirectTo: session.redirectTo ?? '/verify-email'
			};
		}

		const profile = await getCurrentSessionProfile();

		return {
			credential,
			redirectTo: profile ? (resolveRoleHome(profile.roles, profile.role) ?? '/register') : '/register'
		};
	} catch (error) {
		if (credential?.user) {
			await rollbackAuthenticatedUser().catch(() => undefined);
		}

		throw toAuthServiceError(error, m.service_auth_google_login_failed());
	}
};

export const completeRegistration = async (
	role: RegistrationRole,
	displayName: string,
	details?: RegistrationDetails
): Promise<CompleteRegistrationResult> => {
	await authPersistenceReady;
	const user = auth.currentUser;

	if (!user) {
		throw new AuthServiceError(
			'auth/no-current-user',
			m.service_auth_registration_requires_session()
		);
	}

	try {
		const normalizedDisplayName = displayName.trim();

		if (normalizedDisplayName && normalizedDisplayName !== (user.displayName ?? '')) {
			await updateProfile(user, { displayName: normalizedDisplayName });
		}

		const registrationResult = await createProfileRegistration(user, {
			role,
			displayName: normalizedDisplayName || user.displayName || null,
			avatarUrl: user.photoURL ?? null,
			storeName: details?.storeName
		});
		const profile = registrationResult.profile;

		if (registrationResult.action === 'role-added' && registrationResult.hadRoleBefore) {
			await rollbackAuthenticatedUser().catch(() => undefined);
			return {
				status: 'role-added-existing',
				redirectTo: `/login?message=role-added-${role}`,
				role
			};
		}

		const session = await syncAuthenticatedSession(user);

		if (!session.emailVerified) {
			await sendEmailVerification(user).catch(() => undefined);
			return {
				status: 'completed',
				redirectTo: session.redirectTo ?? '/verify-email',
				role
			};
		}

		return {
			status: 'completed',
			redirectTo: resolveRoleHome(profile.roles, profile.role) ?? '/register',
			role
		};
	} catch (error) {
		throw toAuthServiceError(error, m.service_auth_complete_registration_failed());
	}
};

export const logout = async (): Promise<void> => {
	try {
		await rollbackAuthenticatedUser();
	} catch (error) {
		throw toAuthServiceError(error, m.service_auth_logout_failed());
	}
};

export const resetPassword = async (email: string): Promise<void> => {
	try {
		await sendPasswordResetEmail(auth, email);
	} catch (error) {
		if (error instanceof FirebaseError && error.code === 'auth/user-not-found') {
			return;
		}

		throw toAuthServiceError(error, m.service_auth_reset_failed());
	}
};

export const resendVerificationEmail = async (): Promise<void> => {
	const user = auth.currentUser;

	if (!user) {
		throw new AuthServiceError(
			'auth/no-current-user',
			m.service_auth_email_not_verified()
		);
	}

	try {
		await sendEmailVerification(user);
	} catch (error) {
		throw toAuthServiceError(error, m.service_auth_resend_verification_failed());
	}
};

export const refreshAuthenticatedUser = async (): Promise<User | null> => {
	const user = auth.currentUser;

	if (!user) {
		return null;
	}

	try {
		await user.reload();
		const refreshedUser = auth.currentUser;

		if (refreshedUser) {
			await syncAuthenticatedSession(refreshedUser);
		}

		return refreshedUser;
	} catch (error) {
		throw toAuthServiceError(error, m.service_auth_refresh_session_failed());
	}
};

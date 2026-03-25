import { browser } from '$app/environment';
import * as m from '$lib/paraglide/messages.js';
import type { User } from 'firebase/auth';

type SessionSyncResponse = {
	uid?: string;
	email?: string | null;
	emailVerified?: boolean;
	redirectTo?: string | null;
	message?: string;
};

export type ServerSessionSyncResult = {
	uid: string;
	email: string | null;
	emailVerified: boolean;
	redirectTo: string | null;
};

let lastSyncedUid: string | null = null;
let lastSyncedToken: string | null = null;
let lastSyncedResult: ServerSessionSyncResult | null = null;

const readResponsePayload = async (response: Response): Promise<SessionSyncResponse> =>
	((await response.json().catch(() => ({}))) as SessionSyncResponse);

const resetSessionCache = () => {
	lastSyncedUid = null;
	lastSyncedToken = null;
	lastSyncedResult = null;
};

export const syncServerSession = async (
	user: User,
	options?: { forceRefresh?: boolean }
): Promise<ServerSessionSyncResult> => {
	if (!browser) {
		return {
			uid: user.uid,
			email: user.email,
			emailVerified: user.emailVerified,
			redirectTo: user.emailVerified ? null : '/verify-email'
		};
	}

	const token = await user.getIdToken(options?.forceRefresh ?? false);

	if (lastSyncedUid === user.uid && lastSyncedToken === token) {
		return (
			lastSyncedResult ?? {
				uid: user.uid,
				email: user.email,
				emailVerified: user.emailVerified,
				redirectTo: user.emailVerified ? null : '/verify-email'
			}
		);
	}

	const response = await fetch('/auth/session', {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({ token })
	});
	const payload = await readResponsePayload(response);

	if (!response.ok) {
		resetSessionCache();
		throw new Error(
			typeof payload.message === 'string' && payload.message.length > 0
				? payload.message
				: m.service_auth_session_sync_failed()
		);
	}

	lastSyncedUid = user.uid;
	lastSyncedToken = token;

	const result = {
		uid: typeof payload.uid === 'string' ? payload.uid : user.uid,
		email: typeof payload.email === 'string' || payload.email === null ? payload.email : user.email,
		emailVerified:
			typeof payload.emailVerified === 'boolean' ? payload.emailVerified : user.emailVerified,
		redirectTo: typeof payload.redirectTo === 'string' ? payload.redirectTo : null
	};

	lastSyncedResult = result;

	return result;
};

export const clearServerSession = async (): Promise<void> => {
	if (!browser) {
		return;
	}

	resetSessionCache();

	const response = await fetch('/auth/logout', { method: 'POST' });
	const payload = await readResponsePayload(response);

	if (!response.ok) {
		throw new Error(
			typeof payload.message === 'string' && payload.message.length > 0
				? payload.message
				: m.service_auth_session_clear_failed()
		);
	}
};

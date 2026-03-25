import { dev } from '$app/environment';
import { SESSION_COOKIE_NAME, verifyFirebaseToken } from '$lib/firebase/server';
import { ensureFirebaseProfileFromToken } from '$lib/services/auth-profile.server';
import * as m from '$lib/paraglide/messages.js';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies, request }) => {
	let token: string | undefined;

	try {
		const body = (await request.json()) as { token?: string };
		token = body.token;
	} catch {
		return json({ message: m.api_invalid_payload() }, { status: 400 });
	}

	if (!token) {
		return json({ message: m.api_token_required() }, { status: 400 });
	}

	const payload = await verifyFirebaseToken(token);
	const maxAge = Math.max(0, (payload.exp ?? 0) - Math.floor(Date.now() / 1000));

	if (maxAge <= 0) {
		return json({ message: m.api_token_expired() }, { status: 401 });
	}

	await ensureFirebaseProfileFromToken(payload, {
		createIfMissing: false,
		logContext: '/auth/session'
	}).catch((error) => {
		console.error('firebase-profile-sync-failed', {
			context: '/auth/session',
			uid: payload.sub,
			error
		});
	});

	cookies.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		path: '/',
		sameSite: 'lax',
		secure: !dev,
		maxAge
	});

	return json({
		uid: payload.sub,
		email: payload.email ?? null,
		emailVerified: payload.email_verified ?? false,
		redirectTo: payload.email_verified ? null : '/verify-email'
	});
};

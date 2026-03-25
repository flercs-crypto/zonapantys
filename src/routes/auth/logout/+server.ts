import { dev } from '$app/environment';
import { SESSION_COOKIE_NAME } from '$lib/firebase/server';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.set(SESSION_COOKIE_NAME, '', {
		httpOnly: true,
		path: '/',
		sameSite: 'lax',
		secure: !dev,
		maxAge: 0
	});

	return json({ success: true });
};

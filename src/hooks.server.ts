import { paraglideMiddleware } from '$lib/paraglide/server.js';
import { hasAppRole, normalizeAppRole, normalizeAppRoles, resolveRoleHome } from '$lib/auth/roles';
import { buildLoginHref, CART_REDIRECT_PATH } from '$lib/auth/login-redirect';
import { dev } from '$app/environment';
import { SESSION_COOKIE_NAME, verifyFirebaseToken } from '$lib/firebase/server';
import { ensureFirebaseProfileFromToken } from '$lib/services/auth-profile.server';
import type { AppRole } from '$lib/types/database.types';
import { redirect, type Handle } from '@sveltejs/kit';

const authOnlyPaths = ['/login', '/forgot-password'];
const registrationPaths = ['/register', '/register/buyer', '/register/seller'];
const sessionProtectedPrefixes = ['/checkout'];
const emailVerificationPath = '/verify-email';

const roleProtectedRoutes: Array<{
	matches: (path: string) => boolean;
	requiredRole: AppRole;
}> = [
	{
		matches: (path) => path === '/admin/dashboard' || path.startsWith('/admin/dashboard/'),
		requiredRole: 'admin'
	},
	{
		matches: (path) => path === '/dashboard/seller' || path.startsWith('/dashboard/seller/'),
		requiredRole: 'seller'
	},
	{
		matches: (path) => path === '/dashboard' || (path.startsWith('/dashboard/') && !path.startsWith('/dashboard/seller')),
		requiredRole: 'buyer'
	}
];

const isAuthPath = (path: string) => authOnlyPaths.includes(path) || registrationPaths.includes(path);

export const handle: Handle = async ({ event, resolve }) => {
	return paraglideMiddleware(event.request, async ({ locale }) => {
		const path = event.url.pathname;
		const token = event.cookies.get(SESSION_COOKIE_NAME);

		event.locals.user = null;

		if (token) {
			try {
				const payload = await verifyFirebaseToken(token);
				const profile = await ensureFirebaseProfileFromToken(payload, {
					createIfMissing: false,
					logContext: 'hooks.server'
				}).catch((error) => {
					console.error('firebase-profile-sync-failed', {
						context: 'hooks.server',
						uid: payload.sub,
						error
					});
					return null;
				});

				event.locals.user = {
					uid: payload.sub,
					email: payload.email ?? null,
					displayName: typeof payload.name === 'string' ? payload.name : null,
					avatarUrl: typeof payload.picture === 'string' ? payload.picture : null,
					emailVerified: payload.email_verified ?? false,
					signInProvider:
						typeof payload.firebase?.sign_in_provider === 'string'
							? payload.firebase.sign_in_provider
							: null,
					role: normalizeAppRole(profile?.role),
					roles: normalizeAppRoles(profile?.roles, profile?.role)
				};
			} catch {
				event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
				event.locals.user = null;
			}
		}

		if (
			event.locals.user &&
			!event.locals.user.emailVerified &&
			path !== emailVerificationPath &&
			isAuthPath(path)
		) {
			throw redirect(303, emailVerificationPath);
		}

		if (event.locals.user?.roles.length && isAuthPath(path)) {
			const redirectTarget = resolveRoleHome(event.locals.user.roles, event.locals.user.role);

			if (redirectTarget) {
				throw redirect(303, redirectTarget);
			}
		}

		if (event.locals.user && event.locals.user.roles.length === 0 && authOnlyPaths.includes(path)) {
			throw redirect(303, '/register');
		}

		const matchedRoleRoute = roleProtectedRoutes.find(({ matches }) => matches(path));

		if (matchedRoleRoute) {
			if (!event.locals.user) {
				throw redirect(303, '/login');
			}

			if (!event.locals.user.emailVerified) {
				throw redirect(303, emailVerificationPath);
			}

			if (!hasAppRole(matchedRoleRoute.requiredRole, event.locals.user.roles, event.locals.user.role)) {
				throw redirect(303, '/');
			}
		}

		if (
			sessionProtectedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
		) {
			if (!event.locals.user) {
				throw redirect(303, buildLoginHref(CART_REDIRECT_PATH));
			}
		}

		const response = await resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%lang%', locale)
		});

		response.headers.set('X-Frame-Options', 'DENY');
		response.headers.set('X-Content-Type-Options', 'nosniff');
		response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
		response.headers.set(
			'Permissions-Policy',
			'camera=(), microphone=(), geolocation=(), payment=(self)'
		);
		response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

		if (dev) {
			response.headers.delete('Content-Security-Policy');
		}

		return response;
	});
};

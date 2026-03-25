import { PUBLIC_FIREBASE_PROJECT_ID } from '$env/static/public';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export const SESSION_COOKIE_NAME = 'firebase_session';

const jwks = createRemoteJWKSet(
	new URL(
		'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
	)
);

export type FirebaseSessionPayload = JWTPayload & {
	sub: string;
	email?: string;
	email_verified?: boolean;
	name?: string;
	picture?: string;
	firebase?: {
		sign_in_provider?: string;
	};
};

export const isFirebaseEmailVerified = (payload: FirebaseSessionPayload) =>
	typeof payload.email === 'string' ? payload.email_verified === true : true;

export const verifyFirebaseToken = async (token: string): Promise<FirebaseSessionPayload> => {
	const { payload } = await jwtVerify(token, jwks, {
		issuer: `https://securetoken.google.com/${PUBLIC_FIREBASE_PROJECT_ID}`,
		audience: PUBLIC_FIREBASE_PROJECT_ID
	});

	if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
		throw new Error('Firebase token without subject');
	}

	return payload as FirebaseSessionPayload;
};

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { AppRole } from '$lib/types/database.types';

declare global {
	interface Window {
		dataLayer: unknown[][];
		gtag?: (...args: unknown[]) => void;
	}

	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				uid: string;
				email: string | null;
				displayName: string | null;
				avatarUrl: string | null;
				emailVerified: boolean;
				signInProvider: string | null;
				role: AppRole | null;
				roles: AppRole[];
			} | null;
		}
		interface PageData {
			session?: App.Locals['user'];
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

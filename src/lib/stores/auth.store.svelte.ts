import { browser } from '$app/environment';
import { auth, authPersistenceReady } from '$lib/firebase/client';
import { clearServerSession, syncServerSession } from '$lib/services/auth-session.service';
import { onIdTokenChanged, type User } from 'firebase/auth';

class AuthStore {
	currentUser = $state<User | null>(null);
	isLoading = $state(true);
	isAuthenticated = $derived(this.currentUser !== null);
	unsubscribe: (() => void) | null = null;

	private async handleUserChange(user: User | null) {
		this.currentUser = user;

		try {
			if (user) {
				await syncServerSession(user);
			} else {
				await clearServerSession();
			}
		} catch {
			// Keep the client session alive and let the next auth/token event retry the sync.
		} finally {
			this.isLoading = false;
		}
	}

	init() {
		if (!browser || this.unsubscribe) {
			return;
		}

		void authPersistenceReady.finally(() => {
			this.unsubscribe = onIdTokenChanged(auth, (user) => {
				void this.handleUserChange(user);
			});
		});
	}

	reset() {
		this.currentUser = null;
		this.isLoading = false;
	}

	destroy() {
		this.unsubscribe?.();
		this.unsubscribe = null;
	}
}

export const authStore = new AuthStore();

if (browser) {
	authStore.init();
}

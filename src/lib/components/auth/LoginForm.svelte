<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { CART_REDIRECT_PATH, getSafeInternalRedirectPath } from '$lib/auth/login-redirect';
	import { resolveRoleHome } from '$lib/auth/roles';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { AuthServiceError, login, loginWithGoogle } from '$lib/services/auth.service';
	import { getCurrentSessionProfile } from '$lib/services/profiles.service';
	import { cartStore } from '$lib/stores/cart.store';

	type LoginAction = 'password' | 'google' | null;

	let loadingAction = $state<LoginAction>(null);
	let isLoading = $derived(loadingAction !== null);
	let errorMessage = $state<string | null>(null);
	const successMessage = $derived.by(() => {
		if (!browser) {
			return null;
		}

		const message = new URLSearchParams(window.location.search).get('message');

		if (message === 'role-added-buyer') {
			return m.auth_register_role_added_buyer();
		}

		if (message === 'role-added-seller') {
			return m.auth_register_role_added_seller();
		}

		return null;
	});

	const getRequestedRedirect = () => {
		if (!browser) {
			return null;
		}

		return getSafeInternalRedirectPath(
			new URLSearchParams(window.location.search).get('redirect')
		);
	};

	const resolveRedirect = async (fallbackRedirect?: string | null) => {
		if (fallbackRedirect === '/verify-email') {
			return fallbackRedirect;
		}

		const requestedRedirect = getRequestedRedirect();

		if (requestedRedirect === CART_REDIRECT_PATH && cartStore.totalItems > 0) {
			return CART_REDIRECT_PATH;
		}

		if (fallbackRedirect) {
			return fallbackRedirect;
		}

		try {
			const profile = await getCurrentSessionProfile();

			if (!profile) {
				return '/register';
			}

			return resolveRoleHome(profile.roles, profile.role) ?? '/register';
		} catch {
			return '/register';
		}
	};

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		errorMessage = null;
		loadingAction = 'password';

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');

		try {
			const credential = await login(email, password);

			if (!credential.user.emailVerified) {
				await goto('/verify-email');
				return;
			}

			await goto(await resolveRedirect());
		} catch (error) {
			errorMessage =
				error instanceof AuthServiceError ? error.friendlyMessage : m.auth_login_error_fallback();
		} finally {
			loadingAction = null;
		}
	};

	const handleGoogleLogin = async () => {
		errorMessage = null;
		loadingAction = 'google';

		try {
			const result = await loginWithGoogle();
			await goto(await resolveRedirect(result.redirectTo));
		} catch (error) {
			errorMessage =
				error instanceof AuthServiceError
					? error.friendlyMessage
					: m.auth_login_google_error_fallback();
		} finally {
			loadingAction = null;
		}
	};
</script>

<section class="rounded-3xl border border-slate-200 bg-white p-8 shadow-card" data-locale={$currentLocale}>
	<form aria-busy={isLoading} class="space-y-6" onsubmit={handleSubmit}>
		<fieldset class="space-y-6" disabled={isLoading}>
			{#if successMessage}
				<p
					aria-live="polite"
					class="rounded-custom border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
					role="status"
				>
					{successMessage}
				</p>
			{/if}

			<div class="space-y-1">
				<label class="block text-sm font-medium text-slate-700" for="login-email">
					{m.common_email_address()}
				</label>
				<input
					class="block w-full rounded-custom border-slate-300 px-4 py-3 focus:border-brand focus:ring-brand"
					id="login-email"
					name="email"
					autocomplete="email"
					placeholder={m.auth_placeholder_login_email()}
					required
					type="email"
				/>
			</div>

			<div class="space-y-1">
				<div class="flex items-center justify-between">
					<label class="block text-sm font-medium text-slate-700" for="login-password">
						{m.common_password()}
					</label>
					<a class="text-xs font-semibold text-brand hover:text-brand-dark" href="/forgot-password"
						>{m.auth_forgot_password()}</a
					>
				</div>
				<input
					class="block w-full rounded-custom border-slate-300 px-4 py-3 focus:border-brand focus:ring-brand"
					id="login-password"
					name="password"
					autocomplete="current-password"
					minlength="8"
					placeholder="••••••••"
					required
					type="password"
				/>
			</div>

			{#if errorMessage}
				<p
					aria-live="assertive"
					class="rounded-custom border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
					role="alert"
				>
					{errorMessage}
				</p>
			{/if}

			<div class="space-y-3">
				<button
					class="flex w-full justify-center rounded-custom bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
					type="submit"
				>
					{loadingAction === 'password' ? m.auth_signing_in() : m.auth_sign_in()}
				</button>

				<button
					class="flex w-full items-center justify-center gap-3 rounded-custom border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
					onclick={handleGoogleLogin}
					type="button"
				>
					<svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
						<path
							fill="#EA4335"
							d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.5-5.4 3.5-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3 14.5 2 12 2 6.9 2 2.8 6.1 2.8 11.1S6.9 20.2 12 20.2c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.2H12Z"
						></path>
						<path
							fill="#34A853"
							d="M2.8 11.1c0 1.6.4 3.1 1.2 4.4l3.4-2.6c-.2-.5-.4-1.1-.4-1.8s.1-1.2.4-1.8L4 6.7a9 9 0 0 0-1.2 4.4Z"
						></path>
						<path
							fill="#FBBC05"
							d="M12 20.2c2.5 0 4.7-.8 6.2-2.3l-3-2.3c-.8.6-1.8 1-3.2 1-2.5 0-4.7-1.7-5.4-4l-3.5 2.7c1.6 3 4.8 4.9 8.9 4.9Z"
						></path>
						<path
							fill="#4285F4"
							d="M18.2 17.9c1.8-1.6 2.9-4 2.9-6.8 0-.5-.1-.9-.1-1.3H12v3.9h5.4c-.3 1.4-1.1 2.6-2.2 3.5l3 2.3Z"
						></path>
					</svg>
					{loadingAction === 'google' ? m.auth_connecting_google() : m.auth_continue_google()}
				</button>
			</div>
		</fieldset>
	</form>

	<footer class="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
		{m.auth_dont_have_account()}
		<a class="font-semibold text-brand hover:text-brand-dark" href="/register"
			>{m.common_register()}</a
		>
	</footer>
</section>

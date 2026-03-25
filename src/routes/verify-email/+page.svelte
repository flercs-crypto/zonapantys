<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolveRoleHome } from '$lib/auth/roles';
	import AuthBrandHeader from '$lib/components/auth/AuthBrandHeader.svelte';
	import AuthSupportText from '$lib/components/auth/AuthSupportText.svelte';
	import { getAuthSupportLinks } from '$lib/components/auth/data';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import {
		AuthServiceError,
		logout,
		resendVerificationEmail
	} from '$lib/services/auth.service';
	import { getCurrentSessionProfile } from '$lib/services/profiles.service';
	import { authStore } from '$lib/stores/auth.store';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type VerifyAction = 'resend' | 'refresh' | null;

	let activeAction = $state<VerifyAction>(null);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	const authSupportLinks = $derived.by(() => {
		$currentLocale;
		return getAuthSupportLinks();
	});

	const isLoading = $derived(activeAction !== null);
	const sessionEmail = $derived(data.session?.email ?? authStore.currentUser?.email ?? null);
	const hasVerifiedSession = $derived(data.session?.emailVerified ?? authStore.currentUser?.emailVerified ?? false);

	const handleResend = async () => {
		errorMessage = null;
		successMessage = null;
		activeAction = 'resend';

		try {
			await resendVerificationEmail();
			successMessage = m.auth_verify_email_resent();
		} catch (error) {
			errorMessage =
				error instanceof AuthServiceError
					? error.friendlyMessage
					: m.service_auth_resend_verification_failed();
		} finally {
			activeAction = null;
		}
	};

	const handleRefresh = async () => {
		errorMessage = null;
		successMessage = null;
		activeAction = 'refresh';

		try {
			if (hasVerifiedSession) {
				const profile = await getCurrentSessionProfile();
				await goto(resolveRoleHome(profile?.roles, profile?.role) ?? '/register');
				return;
			}

			await logout().catch(() => undefined);
			await goto('/login');
		} catch (error) {
			errorMessage =
				error instanceof AuthServiceError
					? error.friendlyMessage
					: m.service_auth_refresh_session_failed();
		} finally {
			activeAction = null;
		}
	};
</script>

<svelte:head>
	<title>{m.auth_verify_email_page_title()}</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-4 py-10" data-locale={$currentLocale}>
	<div class="w-full max-w-md space-y-8">
		<AuthBrandHeader title="Zonapantys" subtitle={m.auth_verify_email_title()} />

		<section class="rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
			<div class="space-y-5">
				<p class="rounded-custom border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
					{m.auth_verify_email_copy()}
				</p>

				<p class="text-sm leading-6 text-slate-600">
					{#if sessionEmail}
						{m.auth_verify_email_sent_to({ email: sessionEmail })}
					{:else}
						{m.auth_verify_email_help()}
					{/if}
				</p>

				{#if errorMessage}
					<p
						aria-live="assertive"
						class="rounded-custom border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
						role="alert"
					>
						{errorMessage}
					</p>
				{/if}

				{#if successMessage}
					<p
						aria-live="polite"
						class="rounded-custom border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
						role="status"
					>
						{successMessage}
					</p>
				{/if}

				<div class="space-y-3">
					<button
						class="flex w-full justify-center rounded-custom bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
						disabled={isLoading || hasVerifiedSession}
						onclick={handleResend}
						type="button"
					>
						{activeAction === 'resend'
							? m.auth_verify_email_resending()
							: m.auth_verify_email_resend()}
					</button>

					<button
						class="flex w-full justify-center rounded-custom border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
						disabled={isLoading}
						onclick={handleRefresh}
						type="button"
					>
						{activeAction === 'refresh'
							? m.auth_verify_email_refreshing()
							: m.auth_verify_email_refresh()}
					</button>
				</div>
			</div>
		</section>

		<AuthSupportText copy={m.auth_support_copy_register()} links={authSupportLinks} />
	</div>
</main>
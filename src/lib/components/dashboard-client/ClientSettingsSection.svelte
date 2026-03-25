<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { resetPassword } from '$lib/services/auth.service';
	import type { ClientDashboardFeedback, ClientProfile } from './data';

	type Props = {
		profile: ClientProfile;
		feedback: ClientDashboardFeedback | null;
	};

	let { profile, feedback }: Props = $props();
	let passwordMessage = $state<string | null>(null);
	let passwordError = $state<string | null>(null);
	let isSendingPasswordReset = $state(false);

	const handlePasswordReset = async () => {
		passwordMessage = null;
		passwordError = null;
		isSendingPasswordReset = true;

		try {
			await resetPassword(profile.email);
			passwordMessage = m.dashboard_client_settings_password_sent();
		} catch {
			passwordError = m.dashboard_client_settings_password_failed();
		} finally {
			isSendingPasswordReset = false;
		}
	};
</script>

<section class="space-y-6" data-locale={$currentLocale}>
	<div class="rounded-[1.5rem] bg-white p-6 shadow-card">
		<p class="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
			{m.dashboard_client_settings_section_kicker()}
		</p>
		<h1 class="mt-2 text-3xl font-bold text-slate-900">{m.dashboard_client_settings_title()}</h1>
		<p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
			{m.dashboard_client_settings_copy()}
		</p>
	</div>

	<div class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
		<form class="rounded-[1.5rem] bg-white p-6 shadow-card" method="POST">
			<input name="intent" type="hidden" value="update-profile" />
			<input name="scope" type="hidden" value="settings" />

			<div class="space-y-5">
				<label class="block text-sm font-medium text-slate-700">
					<span class="mb-2 block">{m.auth_display_name()}</span>
					<input
						class="block w-full rounded-custom border-slate-300 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:ring-brand"
						name="displayName"
						placeholder={m.auth_placeholder_full_name()}
						required
						type="text"
						value={profile.displayName}
					/>
				</label>

				<label class="block text-sm font-medium text-slate-700">
					<span class="mb-2 block">{m.common_email_address()}</span>
					<input
						class="block w-full rounded-custom border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
						readonly
						type="email"
						value={profile.email}
					/>
				</label>

				<button
					class="rounded-custom bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
					type="submit"
				>
					{m.dashboard_client_settings_save()}
				</button>

				{#if feedback?.scope === 'settings' && feedback.message}
					<p class={`text-sm ${feedback.success ? 'text-emerald-600' : 'text-red-600'}`}>
						{feedback.message}
					</p>
				{/if}
			</div>
		</form>

		<div class="rounded-[1.5rem] bg-white p-6 shadow-card">
			<h2 class="text-lg font-semibold text-slate-900">{m.dashboard_client_settings_password_title()}</h2>
			{#if profile.isGoogleAccount}
				<p class="mt-3 text-sm leading-6 text-slate-500">
					{m.dashboard_client_settings_google_auth_copy()}
				</p>
			{:else}
				<p class="mt-3 text-sm leading-6 text-slate-500">
					{m.dashboard_client_settings_password_copy()}
				</p>
				<button
					class="mt-5 rounded-custom border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
					disabled={isSendingPasswordReset}
					onclick={handlePasswordReset}
					type="button"
				>
					{isSendingPasswordReset
						? m.dashboard_client_settings_password_sending()
						: m.dashboard_client_settings_password_action()}
				</button>

				{#if passwordMessage}
					<p class="mt-4 text-sm text-emerald-600">{passwordMessage}</p>
				{/if}

				{#if passwordError}
					<p class="mt-4 text-sm text-red-600">{passwordError}</p>
				{/if}
			{/if}
		</div>
	</div>
</section>
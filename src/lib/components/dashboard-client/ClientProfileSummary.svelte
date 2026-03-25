<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { ClientDashboardFeedback, ClientProfile } from './data';

	type Props = {
		profile: ClientProfile;
		feedback: ClientDashboardFeedback | null;
	};

	let { profile, feedback }: Props = $props();

	const memberSince = $derived.by(() =>
		new Intl.DateTimeFormat($currentLocale, {
			month: 'long',
			year: 'numeric'
		}).format(new Date(profile.memberSince))
	);

	const profileInitial = $derived(profile.displayName.trim().charAt(0).toUpperCase() || 'U');
</script>

<section
	class="mb-10 rounded-[1.5rem] bg-white p-6 shadow-card"
	data-locale={$currentLocale}
>
	<div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
		<div class="flex flex-col items-center gap-4 text-center lg:flex-row lg:text-left">
			<div class="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-slate-50 bg-slate-100 text-3xl font-semibold text-slate-500">
				{#if profile.avatarUrl}
					<img
						alt={m.dashboard_client_user_avatar_alt()}
						class="h-full w-full object-cover"
						src={profile.avatarUrl}
					/>
				{:else}
					<span>{profileInitial}</span>
				{/if}
				<span class="absolute right-1 bottom-1 h-5 w-5 rounded-full border-2 border-white bg-green-500"></span>
			</div>

			<div>
				<p class="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
					{m.dashboard_client_profile_section_kicker()}
				</p>
				<h1 class="mt-2 text-3xl font-bold text-slate-900">{profile.displayName}</h1>
				<p class="mt-2 text-sm text-slate-500">
					{m.dashboard_client_member_since_label({ date: memberSince })}
				</p>
			</div>
		</div>

		<div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
			<p class="font-semibold text-slate-900">{profile.email}</p>
			<p class="mt-1">
				{profile.isGoogleAccount
					? m.dashboard_client_account_provider_google()
					: m.dashboard_client_account_provider_password()}
			</p>
		</div>
	</div>

	<form class="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]" enctype="multipart/form-data" method="POST">
		<input name="intent" type="hidden" value="update-profile" />
		<input name="scope" type="hidden" value="profile" />

		<div class="grid gap-4 md:grid-cols-2">
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
				<span class="mb-2 block">{m.dashboard_client_profile_avatar_label()}</span>
				<input
					accept="image/png,image/jpeg,image/webp"
					class="block w-full rounded-custom border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:font-semibold file:text-brand hover:file:bg-brand/15"
					name="avatar"
					type="file"
				/>
			</label>
		</div>

		<button
			class="self-end rounded-custom bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
			type="submit"
		>
			{m.dashboard_client_save_profile()}
		</button>
	</form>

	{#if feedback?.scope === 'profile' && feedback.message}
		<p class={`mt-4 text-sm ${feedback.success ? 'text-emerald-600' : 'text-red-600'}`}>
			{feedback.message}
		</p>
	{/if}
</section>

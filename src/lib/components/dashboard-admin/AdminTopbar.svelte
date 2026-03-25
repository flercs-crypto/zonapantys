<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { logout } from '$lib/services/auth.service';

	type Props = {
		title: string;
		adminName: string;
		avatarUrl: string | null;
	};

	let { title, adminName, avatarUrl }: Props = $props();
	let isSigningOut = $state(false);

	const handleLogout = async () => {
		if (isSigningOut) {
			return;
		}

		isSigningOut = true;

		try {
			await logout();
			await goto('/login');
		} finally {
			isSigningOut = false;
		}
	};
</script>

<header
	class="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8"
	data-locale={$currentLocale}
>
	<div>
		<h2 class="text-lg font-semibold text-slate-800">{title}</h2>
		<p class="mt-1 text-sm text-slate-500">{m.dashboard_admin_topbar_welcome({ name: adminName })}</p>
	</div>
	<div class="flex items-center gap-4">
		<button
			aria-label={m.dashboard_admin_notifications_aria()}
			class="relative p-2 text-slate-400 hover:text-slate-600"
			type="button"
		>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
				></path>
			</svg>
			<span class="absolute top-2 right-2 block h-2 w-2 rounded-full bg-brand ring-2 ring-white"
			></span>
		</button>

		<button
			aria-label={m.common_sign_out()}
			class="rounded-custom border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
			disabled={isSigningOut}
			onclick={handleLogout}
			type="button"
		>
			{isSigningOut ? `${m.common_sign_out()}...` : m.common_sign_out()}
		</button>

		<div class="flex items-center gap-3">
			<div class="hidden text-right sm:block">
				<p class="text-sm font-semibold text-slate-800">{adminName}</p>
				<p class="text-xs text-slate-500">{m.dashboard_admin_profile_alt()}</p>
			</div>
			<div class="h-8 w-8 overflow-hidden rounded-full border border-slate-300 bg-slate-200">
				{#if avatarUrl}
					<img alt={m.dashboard_admin_profile_alt()} class="h-full w-full object-cover" src={avatarUrl} />
				{:else}
					<div class="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
						{adminName.slice(0, 1).toUpperCase()}
					</div>
				{/if}
			</div>
		</div>
	</div>
</header>

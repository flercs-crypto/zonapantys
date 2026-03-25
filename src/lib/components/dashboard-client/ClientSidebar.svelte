<script lang="ts">
	import { logout } from '$lib/services/auth.service';
	import { goto } from '$app/navigation';
	import BrandLogoLink from '$lib/components/brand/BrandLogoLink.svelte';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { ClientNavItem } from './data';

	type Props = {
		items: ClientNavItem[];
	};

	let { items }: Props = $props();

	const navClass = (item: ClientNavItem) =>
		item.active
			? 'flex items-center rounded-custom border-l-4 border-brand bg-brand/5 px-4 py-3 text-sm font-medium text-brand hover:bg-slate-50'
			: 'flex items-center rounded-custom px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand';

	const handleLogout = async () => {
		await logout();
		await goto('/login');
	};

	const iconPath = (icon: ClientNavItem['icon']) => {
		switch (icon) {
			case 'profile':
				return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
			case 'purchases':
				return 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z';
			case 'favorites':
				return 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z';
			case 'settings':
				return 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z';
		}
	};
</script>

<aside
	class="w-full border-r border-slate-200 bg-white md:w-64 md:flex-shrink-0"
	data-locale={$currentLocale}
>
	<div class="p-6">
		<BrandLogoLink rootClass="inline-flex items-center" imageClass="h-12 w-auto" title="" />
	</div>

	<nav class="mt-4 space-y-1 px-4">
		{#each items as item}
			<a class={navClass(item)} href={item.href}>
				<svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						d={iconPath(item.icon)}
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
					></path>
					{#if item.icon === 'settings'}
						<path
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
						></path>
					{/if}
				</svg>
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="border-t border-slate-100 p-4">
		<button
			aria-label={m.dashboard_client_sign_out_aria()}
			class="flex w-full items-center px-4 py-2 text-sm text-slate-500 hover:text-red-600"
			onclick={handleLogout}
			type="button"
		>
			<svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
				></path>
			</svg>
			{m.common_sign_out()}
		</button>
	</div>
</aside>

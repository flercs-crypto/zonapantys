<script lang="ts">
	import { browser } from '$app/environment';
	import { buildLoginHref, CART_REDIRECT_PATH } from '$lib/auth/login-redirect';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { resolveRoleHome } from '$lib/auth/roles';
	import BrandLogoLink from '$lib/components/brand/BrandLogoLink.svelte';
	import CartButton from '$lib/components/cart/CartButton.svelte';
	import { getCurrentSessionProfile } from '$lib/services/profiles.service';
	import { authStore } from '$lib/stores/auth.store';
	import { cartStore } from '$lib/stores/cart.store';
	import type { Profile } from '$lib/types/database.types';
	import type { LandingNavLink } from './data';

	type Props = {
		links: LandingNavLink[];
	};

	let { links }: Props = $props();
	let isMenuOpen = $state(false);
	let currentProfile = $state<Profile | null>(null);
	let isProfileLoading = $state(false);
	let requestedProfileForUid = $state<string | null>(null);

	const profileHref = $derived.by(
		() => resolveRoleHome(currentProfile?.roles, currentProfile?.role) ?? '/dashboard'
	);
	const loginHref = $derived(
		buildLoginHref(cartStore.totalItems > 0 ? CART_REDIRECT_PATH : null)
	);
	const showGuestActions = $derived(!authStore.isLoading && !authStore.isAuthenticated);
	const showProfileAction = $derived(!authStore.isLoading && authStore.isAuthenticated);

	$effect(() => {
		if (!browser) {
			return;
		}

		const currentUser = authStore.currentUser;

		if (authStore.isLoading) {
			return;
		}

		if (!currentUser) {
			currentProfile = null;
			isProfileLoading = false;
			requestedProfileForUid = null;
			return;
		}

		if (requestedProfileForUid === currentUser.uid) {
			return;
		}

		requestedProfileForUid = currentUser.uid;
		isProfileLoading = true;

		void getCurrentSessionProfile()
			.then((profile) => {
				if (authStore.currentUser?.uid !== currentUser.uid) {
					return;
				}

				currentProfile = profile;
			})
			.catch(() => {
				if (authStore.currentUser?.uid !== currentUser.uid) {
					return;
				}

				currentProfile = null;
			})
			.finally(() => {
				if (authStore.currentUser?.uid === currentUser.uid) {
					isProfileLoading = false;
				}
			});
	});
</script>

<nav
	class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur"
	data-locale={$currentLocale}
>
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<BrandLogoLink
			rootClass="inline-flex items-center"
			imageClass="h-10 w-auto"
			title=""
		/>

		<div class="hidden items-center gap-8 md:flex">
			{#each links as link (link.href)}
				<a class="text-sm font-semibold text-slate-600 hover:text-brand" href={link.href}
					>{link.label}</a
				>
			{/each}
			<CartButton />
			{#if showGuestActions}
				<a
					class="rounded-custom bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
					href={loginHref}
				>
					{m.common_login()}
				</a>
				<a
					class="rounded-custom bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
					href="/register/seller"
				>
					{m.landing_nav_become_seller()}
				</a>
			{:else if showProfileAction && !isProfileLoading}
				<a
					class="rounded-custom bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
					href={profileHref}
				>
					{m.common_go_to_profile()}
				</a>
			{/if}
		</div>

		<div class="flex items-center gap-3 md:hidden">
			<CartButton />
			<button
				class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600"
				type="button"
				onclick={() => (isMenuOpen = !isMenuOpen)}
				aria-expanded={isMenuOpen}
				aria-label={m.landing_nav_open_navigation()}
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						d="M4 6h16M4 12h16m-7 6h7"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
					></path>
				</svg>
			</button>
		</div>
	</div>

	{#if isMenuOpen}
		<div class="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
			<div class="flex flex-col gap-3">
				{#each links as link (link.href)}
					<a
						class="rounded-custom px-3 py-2 text-sm font-medium text-slate-600 hover:bg-brand-soft hover:text-brand"
						href={link.href}
					>
						{link.label}
					</a>
				{/each}
				<a
					class="rounded-custom border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
					href="/carrito"
				>
					{m.cart_view()}
				</a>
				{#if showGuestActions}
					<a
						class="rounded-custom bg-brand px-3 py-2 text-sm font-semibold text-white"
						href={loginHref}
					>
						{m.common_login()}
					</a>
					<a
						class="rounded-custom bg-brand px-3 py-2 text-sm font-semibold text-white"
						href="/register/seller"
					>
						{m.landing_nav_become_seller()}
					</a>
				{:else if showProfileAction && !isProfileLoading}
					<a
						class="rounded-custom bg-brand px-3 py-2 text-sm font-semibold text-white"
						href={profileHref}
					>
						{m.common_go_to_profile()}
					</a>
				{/if}
			</div>
		</div>
	{/if}
</nav>

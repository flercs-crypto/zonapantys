<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BrandLogoLink from '$lib/components/brand/BrandLogoLink.svelte';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { formatPrice } from '$lib/components/shop-seller/data';
	import { logout } from '$lib/services/auth.service';
	import SellerOrdersHistory from '$lib/components/dashboard-seller/SellerOrdersHistory.svelte';
	import SellerProductsManager from '$lib/components/dashboard-seller/SellerProductsManager.svelte';
	import SellerSalesSummary from '$lib/components/dashboard-seller/SellerSalesSummary.svelte';
	import SellerStoreSettings from '$lib/components/dashboard-seller/SellerStoreSettings.svelte';
	import SellerVisitsOverview from '$lib/components/dashboard-seller/SellerVisitsOverview.svelte';
	import type { Profile, Seller } from '$lib/types/database.types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let sellerOverride = $state<Seller | null>(null);
	let profileOverride = $state<Profile | null>(null);
	let isSigningOut = $state(false);
	const seller = $derived(sellerOverride ?? data.seller);
	const profile = $derived(profileOverride ?? data.profile);

	const navigationItems = $derived.by(() => {
		$currentLocale;
		return [
			{
				id: 'store',
				label: m.dashboard_seller_nav_store(),
				copy: m.dashboard_seller_nav_store_copy()
			},
			{
				id: 'products',
				label: m.dashboard_seller_nav_products(),
				copy: m.dashboard_seller_nav_products_copy()
			},
			{
				id: 'sales',
				label: m.dashboard_seller_nav_sales(),
				copy: m.dashboard_seller_nav_sales_copy()
			},
			{
				id: 'orders',
				label: m.dashboard_seller_nav_orders(),
				copy: m.dashboard_seller_nav_orders_copy()
			},
			{
				id: 'stats',
				label: m.dashboard_seller_nav_stats(),
				copy: m.dashboard_seller_nav_stats_copy()
			}
		];
	});

	const heroStats = $derived.by(() => [
		{
			label: m.dashboard_seller_hero_revenue(),
			value: formatPrice(data.salesSummary.totalRevenue)
		},
		{
			label: m.dashboard_seller_hero_orders(),
			value: String(data.ordersPage.totalItems)
		},
		{
			label: m.dashboard_seller_hero_products(),
			value: String(data.sellerProducts.length)
		},
		{
			label: m.dashboard_seller_hero_visits(),
			value: String(data.visitSummary.totalVisits)
		}
	]);
	const sellerStatusBanner = $derived.by(() => {
		if (!seller) {
			return null;
		}

		if (seller.verification_status === 'pending') {
			return {
				tone: 'amber',
				message: m.dashboard_seller_verification_pending_banner()
			};
		}

		if (seller.verification_status === 'rejected') {
			return {
				tone: 'rose',
				message: m.dashboard_seller_verification_rejected_banner({
					reason: seller.rejection_reason ?? m.dashboard_seller_verification_rejected_reason_missing()
				})
			};
		}

		return null;
	});

	const handleStoreSaved = (event: CustomEvent<{ seller: Seller; profile: Profile }>) => {
		sellerOverride = event.detail.seller;
		profileOverride = event.detail.profile;
	};

	const handleLogout = async () => {
		if (isSigningOut) {
			return;
		}

		isSigningOut = true;

		try {
			await logout();
			await goto(resolve('/'));
		} finally {
			isSigningOut = false;
		}
	};
</script>

<svelte:head>
	<title>{m.dashboard_seller_page_title()}</title>
</svelte:head>

<div
	class="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(139,26,74,0.18),_transparent_28%),radial-gradient(circle_at_85%_10%,_rgba(201,149,106,0.12),_transparent_24%),linear-gradient(180deg,_#fbf4ec_0%,_#f7efe4_45%,_#f1e5da_100%)]"
	data-locale={$currentLocale}
>
	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		{#if seller && profile}
			<div class="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
				<aside class="lg:sticky lg:top-6 lg:self-start">
					<div
						class="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-card backdrop-blur"
					>
						<BrandLogoLink
							rootClass="inline-flex items-center rounded-[1.25rem] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2"
							imageClass="h-14 w-auto"
							title=""
						/>

						<h1 class="mt-3 text-3xl font-bold text-slate-950">{seller.store_name}</h1>
						<p class="mt-3 text-sm leading-6 text-slate-500">
							{m.dashboard_seller_sidebar_copy()}
						</p>

						<nav class="mt-6 space-y-3">
							{#each navigationItems as item (item.id)}
								<a
									class="block rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-brand/20 hover:bg-brand/5"
									href={`#${item.id}`}
								>
									<p class="text-sm font-semibold text-slate-900">{item.label}</p>
									<p class="mt-1 text-xs leading-5 text-slate-500">{item.copy}</p>
								</a>
							{/each}
						</nav>

						<div class="mt-6 border-t border-slate-200 pt-6">
							<button
								class="flex w-full items-center justify-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-70"
								disabled={isSigningOut}
								onclick={handleLogout}
								type="button"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
					</div>
				</aside>

				<div class="space-y-8">
					{#if sellerStatusBanner}
						<div
							class={`rounded-[1.5rem] border px-5 py-4 text-sm font-medium ${sellerStatusBanner.tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-rose-200 bg-rose-50 text-rose-800'}`}
						>
							{sellerStatusBanner.message}
						</div>
					{/if}

					<section
						class="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 px-6 py-7 text-slate-900 shadow-card backdrop-blur lg:px-8"
					>
						<div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<p class="text-xs font-semibold tracking-[0.28em] text-accent uppercase">
									{m.dashboard_seller_hero_badge()}
								</p>
								<h2 class="mt-3 max-w-3xl text-3xl leading-tight font-bold sm:text-4xl">
									{m.dashboard_seller_hero_title({ storeName: seller.store_name })}
								</h2>
								<p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
									{m.dashboard_seller_hero_copy()}
								</p>
							</div>

							<div class="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
								{#each heroStats as stat (stat.label)}
									<div class="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
										<p class="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
											{stat.label}
										</p>
										<p class="mt-2 text-2xl font-bold text-slate-900">
											{stat.value}
										</p>
									</div>
								{/each}
							</div>
						</div>
					</section>

					<section id="store">
						<SellerStoreSettings {profile} {seller} on:saved={handleStoreSaved} />
					</section>

					<section id="products">
						<SellerProductsManager initialProducts={data.sellerProducts} {seller} />
					</section>

					<section id="sales">
						<SellerSalesSummary summary={data.salesSummary} />
					</section>

					<section id="orders">
						<SellerOrdersHistory ordersPage={data.ordersPage} />
					</section>

					<section id="stats">
						<SellerVisitsOverview visitSummary={data.visitSummary} />
					</section>
				</div>
			</div>
		{:else}
			<section class="rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
				<h1 class="text-2xl font-semibold text-slate-900">{m.dashboard_seller_page_title()}</h1>
				<p class="mt-3 text-sm text-slate-600">{m.dashboard_seller_missing_store_copy()}</p>
			</section>
		{/if}
	</main>
</div>

<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import SellerCatalogSection from '$lib/components/shop-seller/SellerCatalogSection.svelte';
	import SellerFooter from '$lib/components/shop-seller/SellerFooter.svelte';
	import SellerNavigation from '$lib/components/shop-seller/SellerNavigation.svelte';
	import SellerProfileHeader from '$lib/components/shop-seller/SellerProfileHeader.svelte';
	import type { ClientDashboardFeedback } from '$lib/components/dashboard-client/data';
	import {
		getFallbackSellerProfile,
		type SellerProfile,
		type SellerStoreProduct
	} from '$lib/components/shop-seller/data';
	import type { ActionData } from './$types';

	type SellerStorePageData = {
		session?: App.Locals['user'];
		sellerSlug: string;
		seller?: SellerProfile;
		products?: SellerStoreProduct[];
		favoriteProductIds?: string[];
		canManageFavorites?: boolean;
	};

	type Props = {
		data: SellerStorePageData;
		form?: ActionData;
	};

	let { data, form }: Props = $props();
	const seller = $derived(data.seller ?? getFallbackSellerProfile(data.sellerSlug));
	const products = $derived(data.products ?? []);
	const favoriteProductIds = $derived(data.favoriteProductIds ?? []);
	const favoriteFeedback = $derived((form ?? null) as ClientDashboardFeedback | null);
</script>

<svelte:head>
	<title>{m.seller_store_page_title({ sellerName: seller.name })}</title>
</svelte:head>

<SellerNavigation />

<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" data-locale={$currentLocale}>
	<div class="mb-6 flex items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white px-6 py-5 shadow-card">
		<div>
			<p class="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
				{m.seller_store_tag()}
			</p>
			<h1 class="mt-2 text-2xl font-bold text-slate-900">{seller.name}</h1>
		</div>
		<a
			class="rounded-custom border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
			href={seller.profileHref}
		>
			{m.seller_back_to_profile()}
		</a>
	</div>

	<SellerProfileHeader {seller} sellerSlug={seller.slug} />
	<SellerCatalogSection
		{products}
		{seller}
		favoriteFeedback={favoriteFeedback}
		favoriteProductIds={favoriteProductIds}
		canManageFavorites={data.canManageFavorites ?? false}
		isAuthenticated={Boolean(data.session)}
	/>
</main>

<SellerFooter sections={seller.footerSections} />
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
	<SellerProfileHeader
		buttonHref={seller.profileHref}
		buttonLabel={m.seller_back_to_profile()}
		{seller}
		sellerSlug={seller.slug}
	/>
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
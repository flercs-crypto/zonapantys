<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import SellerCatalogSection from '$lib/components/shop-seller/SellerCatalogSection.svelte';
	import SellerFooter from '$lib/components/shop-seller/SellerFooter.svelte';
	import SellerNavigation from '$lib/components/shop-seller/SellerNavigation.svelte';
	import SellerProfileHeader from '$lib/components/shop-seller/SellerProfileHeader.svelte';
	import {
		getFallbackSellerProfile,
		type SellerProfile,
		type SellerStoreProduct
	} from '$lib/components/shop-seller/data';

	type SellerPageData = {
		sellerSlug: string;
		seller?: SellerProfile;
		products?: SellerStoreProduct[];
	};

	let { data }: { data: SellerPageData } = $props();
	const seller = $derived(data.seller ?? getFallbackSellerProfile(data.sellerSlug));
	const products = $derived(data.products ?? []);
</script>

<svelte:head>
	<title>{m.seller_page_title({ sellerName: seller.name })}</title>
</svelte:head>

<SellerNavigation />

<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" data-locale={$currentLocale}>
	<SellerProfileHeader {seller} sellerSlug={seller.slug} />
	<SellerCatalogSection {products} {seller} />
</main>

<SellerFooter sections={seller.footerSections} />
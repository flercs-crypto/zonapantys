<script lang="ts">
	import { resolve } from '$app/paths';
	import { currentLocale } from '$lib/i18n';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import LandingNavbar from '$lib/components/landing/LandingNavbar.svelte';
	import {
		getFooterGroups,
		getLandingNavLinks,
		getSocialLinks
	} from '$lib/components/landing/data';
	import * as m from '$lib/paraglide/messages.js';
	import type { SellerDirectoryEntry } from '$lib/components/shop-seller/data';

	type SellerDirectoryPageData = {
		sellers: SellerDirectoryEntry[];
	};

	let { data }: { data: SellerDirectoryPageData } = $props();

	const landingNavLinks = $derived.by(() => {
		$currentLocale;
		return getLandingNavLinks();
	});

	const footerGroups = $derived.by(() => {
		$currentLocale;
		return getFooterGroups();
	});

	const socialLinks = $derived.by(() => {
		$currentLocale;
		return getSocialLinks();
	});
</script>

<svelte:head>
	<title>{m.seller_directory_page_title()}</title>
	<meta name="description" content={m.seller_directory_page_description()} />
</svelte:head>

<LandingNavbar links={landingNavLinks} />

<main class="relative overflow-hidden pb-20" data-locale={$currentLocale}>
	<div class="absolute inset-x-0 top-0 -z-10 h-112 bg-[radial-gradient(circle_at_top_left,rgba(139,26,74,0.24),transparent_48%),radial-gradient(circle_at_88%_12%,rgba(201,149,106,0.14),transparent_26%),linear-gradient(180deg,var(--color-text-brand)_0%,rgba(245,230,208,0)_100%)]"></div>

	<section class="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8 lg:pt-20">
		<div class="max-w-3xl">
			<p class="inline-flex rounded-full border border-brand/10 bg-white/80 px-4 py-1 text-xs font-semibold tracking-[0.24em] text-brand uppercase backdrop-blur">
				{m.seller_directory_badge()}
			</p>
			<h1 class="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl">
				{m.seller_directory_title()}
			</h1>
			<p class="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
				{m.seller_directory_copy()}
			</p>
		</div>

		{#if data.sellers.length === 0}
			<div class="mt-14 rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-card">
				<h2 class="text-2xl font-bold text-slate-950">{m.seller_directory_empty_title()}</h2>
				<p class="mt-3 text-sm leading-7 text-slate-500">
					{m.seller_directory_empty_copy()}
				</p>
				<a
					class="mt-8 inline-flex rounded-custom bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
					href={resolve('/')}
				>
					{m.cart_continue_shopping()}
				</a>
			</div>
		{:else}
			<div class="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
				{#each data.sellers as seller (seller.id)}
					<article class="group flex overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_24px_70px_-38px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_32px_90px_-40px_rgba(15,23,42,0.5)]">
						<div class="flex w-full flex-col">
						<a
							class="block overflow-hidden bg-slate-100"
							href={resolve('/vendedoras/[slug]', { slug: seller.slug })}
						>
							<img
								alt={seller.name}
								class="aspect-[4/4.6] w-full object-cover transition duration-300 group-hover:scale-105"
								src={seller.avatar}
							/>
						</a>

						<div class="flex flex-1 flex-col space-y-4 p-6">
							<p class="inline-flex rounded-full text-white bg-brand-light px-3 py-1 text-[11px] font-semibold tracking-[0.2em] uppercase w-56">
								{m.seller_directory_card_badge()}
							</p>
							<div class="flex-1">
								<a
									class="text-2xl font-bold tracking-tight text-slate-950 hover:text-brand"
									href={resolve('/vendedoras/[slug]', { slug: seller.slug })}
								>
									{seller.name}
								</a>
								<p class="mt-3 text-sm leading-7 text-slate-600">{seller.bio}</p>
							</div>

							<a
								class="mt-auto inline-flex w-full items-center justify-center gap-3 rounded-custom bg-brand px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-brand-dark"
								href={resolve('/vendedoras/[slug]/tienda', { slug: seller.slug })}
							>
								{m.seller_view_store()}
								<svg aria-hidden="true" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										d="M5 12h14m-6-6 6 6-6 6"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2.25"
									></path>
								</svg>
							</a>
						</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</section>
</main>

<LandingFooter groups={footerGroups} {socialLinks} />
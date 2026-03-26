<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages/_index.js';
	import type { SellerCard } from './data';

	type Props = {
		sellers: SellerCard[];
	};

	let { sellers }: Props = $props();
	const landingMessages = m as typeof m & {
		landing_seller_description_fallback: () => string;
	};

	const ratingFormatter = $derived.by(
		() =>
			new Intl.NumberFormat($currentLocale, {
				minimumFractionDigits: 1,
				maximumFractionDigits: 1
			})
	);

	const getSellerInitial = (name: string) => name.trim().charAt(0).toUpperCase() || 'S';
</script>

<section class="bg-slate-50 py-20" id="sellers" data-locale={$currentLocale}>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<h2 class="mb-12 text-center text-3xl font-bold text-slate-950">
			{m.landing_top_sellers_title()}
		</h2>
		<div class="grid gap-8 md:grid-cols-3">
			{#each sellers as seller (seller.id)}
				<article
					class="rounded-[1.25rem] bg-white p-6 text-center shadow-card transition hover:-translate-y-1"
				>
					{#if seller.image}
						<img
							alt={seller.name}
							class="mx-auto mb-4 h-20 w-20 rounded-full object-cover"
							src={seller.image}
						/>
					{:else}
						<div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 text-2xl font-bold text-brand">
							{getSellerInitial(seller.name)}
						</div>
					{/if}
					<h3 class="text-lg font-bold text-slate-900">{seller.name}</h3>
					<div class="mt-1 mb-2 flex items-center justify-center gap-2 text-sm">
						<span class="text-base text-amber-500">★</span>
						<span class="font-semibold text-slate-800">{ratingFormatter.format(seller.rating)}</span>
						<span class="text-slate-500">({seller.reviewCount})</span>
					</div>
					<p class="text-sm text-slate-500">
						{seller.description?.trim() || landingMessages.landing_seller_description_fallback()}
					</p>
				</article>
			{/each}
		</div>
	</div>
</section>

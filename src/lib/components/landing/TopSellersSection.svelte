<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { SellerCard } from './data';

	type Props = {
		sellers: SellerCard[];
	};

	let { sellers }: Props = $props();
</script>

<section class="bg-slate-50 py-20" id="sellers" data-locale={$currentLocale}>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<h2 class="mb-12 text-center text-3xl font-bold text-slate-950">
			{m.landing_top_sellers_title()}
		</h2>
		<div class="grid gap-8 md:grid-cols-3">
			{#each sellers as seller}
				<article
					class="rounded-[1.25rem] bg-white p-6 text-center shadow-card transition hover:-translate-y-1"
				>
					<img
						alt={seller.name}
						class="mx-auto mb-4 h-20 w-20 rounded-full object-cover"
						src={seller.image}
					/>
					<h3 class="text-lg font-bold text-slate-900">{seller.name}</h3>
					<div class="mt-1 mb-2 flex items-center justify-center gap-2 text-yellow-400">
						<span>{seller.rating}</span>
						<span class="text-sm text-slate-500">{seller.reviews}</span>
					</div>
					<p class="text-sm text-slate-500">{seller.description}</p>
				</article>
			{/each}
		</div>
	</div>
</section>

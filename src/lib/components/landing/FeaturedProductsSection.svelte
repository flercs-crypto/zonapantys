<script lang="ts">
	import { resolve } from '$app/paths';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { FeaturedProduct } from './data';

	type Props = {
		products: FeaturedProduct[];
	};

	let { products }: Props = $props();
</script>

<section class="bg-white py-20" id="featured" data-locale={$currentLocale}>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h2 class="text-3xl font-bold text-slate-950">{m.landing_featured_title()}</h2>
				<p class="mt-2 text-slate-500">{m.landing_featured_copy()}</p>
			</div>
			<div class="flex shrink-0 items-start sm:items-end sm:justify-end">
				<a
					class="group inline-flex items-center justify-center gap-3 self-start rounded-full border border-brand/15 bg-brand px-6 py-3 text-sm font-bold text-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:bg-brand-dark"
					href={resolve('/vendedoras')}
				>
					{m.landing_featured_view_all()}
					<svg
						aria-hidden="true"
						class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
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

		<div class="grid grid-cols-2 gap-6 lg:grid-cols-4">
			{#each products as product (product.name)}
				<article class="group cursor-pointer">
					<div class="mb-4 aspect-3/4 overflow-hidden rounded-[1.25rem] bg-slate-100">
						<img
							alt={product.alt}
							class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
							src={product.image}
						/>
					</div>
					<h3 class="font-semibold text-slate-900">{product.name}</h3>
					<div class="mt-1 flex items-center justify-between gap-3">
						<span class="font-bold text-brand">{product.price}</span>
						<span
							class="rounded-custom bg-slate-100 px-2 py-1 text-[10px] font-bold tracking-wide text-slate-500 uppercase"
							>{product.condition}</span
						>
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>

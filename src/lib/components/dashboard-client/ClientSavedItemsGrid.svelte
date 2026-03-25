<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { ClientFavoriteItem } from './data';

	type Props = {
		items: ClientFavoriteItem[];
	};

	let { items }: Props = $props();

	const currencyFormatter = $derived.by(
		() =>
			new Intl.NumberFormat($currentLocale, {
				style: 'currency',
				currency: 'USD'
			})
	);
</script>

<section class="lg:col-span-2" data-locale={$currentLocale}>
	<div class="overflow-hidden rounded-[1.25rem] bg-white shadow-card">
		<div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
			<h3 class="font-bold text-slate-800">{m.dashboard_client_saved_title()}</h3>
			<button
				aria-label={m.dashboard_client_saved_more_actions()}
				class="text-slate-400 hover:text-brand"
				type="button"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
					></path>
				</svg>
			</button>
		</div>

		<div class="p-6">
			{#if items.length === 0}
				<div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
					<h4 class="text-sm font-semibold text-slate-900">{m.dashboard_client_saved_empty_title()}</h4>
					<p class="mt-2 text-sm text-slate-500">{m.dashboard_client_saved_empty_copy()}</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4">
					{#each items as item (item.favoriteId)}
						<article class="group rounded-[1.25rem] border border-slate-100 p-3 transition hover:border-brand/20">
							<div class="relative mb-3 aspect-square overflow-hidden rounded-custom bg-slate-100">
								<img
									alt={item.alt}
									class="h-full w-full object-cover transition duration-300 group-hover:scale-110"
									src={item.image}
								/>
							</div>
							<h4 class="truncate text-sm font-semibold text-slate-800">{item.name}</h4>
							<p class="mt-1 text-sm font-bold text-brand">
								{currencyFormatter.format(item.price)}
							</p>
							<p class="mt-1 truncate text-xs text-slate-500">{item.sellerName}</p>
							<a
								class="mt-3 inline-flex w-full items-center justify-center rounded-custom border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
								href={item.storeHref}
							>
								{m.dashboard_client_saved_view_store()}
							</a>
						</article>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</section>

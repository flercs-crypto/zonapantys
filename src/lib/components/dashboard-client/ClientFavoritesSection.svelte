<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { ClientDashboardFeedback, ClientFavoriteItem } from './data';

	type Props = {
		items: ClientFavoriteItem[];
		feedback: ClientDashboardFeedback | null;
	};

	let { items, feedback }: Props = $props();

	const currencyFormatter = $derived.by(
		() =>
			new Intl.NumberFormat($currentLocale, {
				style: 'currency',
				currency: 'USD'
			})
	);
</script>

<section class="space-y-6" data-locale={$currentLocale}>
	<div class="rounded-[1.5rem] bg-white p-6 shadow-card">
		<p class="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
			{m.dashboard_client_favorites_section_kicker()}
		</p>
		<h1 class="mt-2 text-3xl font-bold text-slate-900">{m.dashboard_client_favorites_title()}</h1>
		<p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
			{m.dashboard_client_favorites_copy()}
		</p>
		{#if feedback?.scope === 'favorites' && feedback.message}
			<p class={`mt-4 text-sm ${feedback.success ? 'text-emerald-600' : 'text-red-600'}`}>
				{feedback.message}
			</p>
		{/if}
	</div>

	{#if items.length === 0}
		<div class="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-8 py-12 text-center shadow-card">
			<h2 class="text-xl font-semibold text-slate-900">{m.dashboard_client_favorites_empty_title()}</h2>
			<p class="mt-3 text-sm text-slate-500">{m.dashboard_client_favorites_empty_copy()}</p>
			<a
				class="mt-6 inline-flex rounded-custom bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
				href="/vendedoras"
			>
				{m.dashboard_client_favorites_empty_cta()}
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
			{#each items as item (item.favoriteId)}
				<article class="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-card">
					<div class="aspect-[4/5] overflow-hidden bg-slate-100">
						<img alt={item.alt} class="h-full w-full object-cover" src={item.image} />
					</div>
					<div class="space-y-4 p-5">
						<div>
							<div class="flex items-start justify-between gap-4">
								<h2 class="text-lg font-semibold text-slate-900">{item.name}</h2>
								<p class="text-lg font-bold text-slate-900">{currencyFormatter.format(item.price)}</p>
							</div>
							<p class="mt-2 text-sm text-slate-500">{item.sellerName}</p>
						</div>

						<div class="flex gap-3">
							<a
								class="flex-1 rounded-custom border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
								href={item.storeHref}
							>
								{m.dashboard_client_saved_view_store()}
							</a>
							<form class="flex-1" method="POST">
								<input name="intent" type="hidden" value="remove-favorite" />
								<input name="scope" type="hidden" value="favorites" />
								<input name="productId" type="hidden" value={item.productId} />
								<button
									class="w-full rounded-custom bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
									type="submit"
								>
									{m.dashboard_client_saved_remove()}
								</button>
							</form>
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>
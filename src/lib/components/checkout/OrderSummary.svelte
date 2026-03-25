<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { CheckoutItem, CheckoutSummary, TrustSignal } from './data';

	type Props = {
		items: CheckoutItem[];
		summary: CheckoutSummary;
		trustSignals: TrustSignal[];
	};

	let { items, summary, trustSignals }: Props = $props();
</script>

<aside class="lg:col-span-5" data-locale={$currentLocale}>
	<div
		class="sticky top-8 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-card"
	>
		<div class="border-b border-slate-200 bg-slate-50 p-4">
			<h3 class="font-semibold text-slate-800">
				{m.checkout_order_summary_title({ count: items.length })}
			</h3>
		</div>

		<div class="p-6">
			<div class="mb-8 space-y-6">
				{#each items as item (item.id)}
					<div class="flex gap-4">
						<div
							class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-custom border border-slate-100 bg-slate-50"
						>
							<img alt={item.alt} class="h-full w-full object-cover" src={item.image} />
						</div>
						<div class="flex-1">
							<h4 class="text-sm font-medium text-slate-900">{item.name}</h4>
							<p class="mt-0.5 text-xs text-slate-500">
								{m.checkout_order_seller({ seller: item.seller })}
							</p>
							<p class="text-xs text-slate-500">{item.details}</p>
							{#if item.note}
								<p class="mt-2 rounded-custom bg-slate-50 px-3 py-2 text-xs text-slate-600">
									<strong>{m.cart_special_note_label()}</strong> {item.note}
								</p>
							{/if}
							<div class="mt-2 flex items-end justify-between">
								<span class="text-sm text-slate-600"
									>{m.checkout_order_quantity({ quantity: item.quantity })}</span
								>
								<span class="text-sm font-semibold text-slate-900">{item.price}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="space-y-3 border-t border-slate-100 pt-6 text-sm">
				<div class="flex justify-between text-slate-600">
					<span>{m.checkout_subtotal()}</span><span>{summary.subtotal}</span>
				</div>
				<div class="flex justify-between text-slate-600">
					<span>{m.checkout_shipping()}</span><span class="font-medium text-emerald-600"
						>{summary.shipping}</span
					>
				</div>
				<div class="flex justify-between text-slate-600">
					<span>{m.checkout_estimated_tax()}</span><span>{summary.tax}</span>
				</div>
				<div
					class="mt-3 flex justify-between border-t border-slate-100 pt-3 text-lg font-bold text-slate-900"
				>
					<span>{m.checkout_total()}</span><span>{summary.total}</span>
				</div>
			</div>

			<div class="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
				{#each trustSignals as signal (signal.title)}
					<div class="p-2 text-center">
						<div class="mb-1 flex justify-center text-brand">
							{#if signal.icon === 'shield'}
								<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016Z"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									></path>
								</svg>
							{:else}
								<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										d="M8 7h12m0 0-4-4m4 4-4 4m0 6H4m0 0 4 4m-4-4 4-4"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									></path>
								</svg>
							{/if}
						</div>
						<p class="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
							{signal.title}
						</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</aside>

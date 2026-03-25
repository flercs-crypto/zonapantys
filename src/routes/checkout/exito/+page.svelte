<script lang="ts">
	import { onMount } from 'svelte';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { cartStore } from '$lib/stores/cart.store';
	import type { CheckoutSessionSummary } from '$lib/types/checkout';
	import { formatPrice } from '$lib/components/shop-seller/data';

	let { data }: { data: { summary: CheckoutSessionSummary } } = $props();
	const isPaid = $derived(data.summary.paymentStatus === 'paid');
	const totalLabel = $derived(formatPrice(data.summary.total));
	const createdLabel = $derived(
		data.summary.createdAt
			? new Intl.DateTimeFormat($currentLocale === 'en' ? 'en-US' : 'es-CL', {
				dateStyle: 'medium',
				timeStyle: 'short'
			}).format(new Date(data.summary.createdAt))
			: null
	);

	onMount(() => {
		if (data.summary.paymentStatus === 'paid') {
			cartStore.clear();
		}
	});
</script>

<svelte:head>
	<title>{m.checkout_success_page_title()}</title>
</svelte:head>

<main class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8" data-locale={$currentLocale}>
	<section class="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-card">
		<div class="border-b border-slate-200 bg-slate-50 px-6 py-8 sm:px-8">
			<p class="text-xs font-semibold tracking-[0.24em] text-emerald-600 uppercase">
				{isPaid ? m.checkout_success_status_paid() : m.checkout_success_status_processing()}
			</p>
			<h1 class="mt-3 text-3xl font-bold text-slate-950">{m.checkout_success_title()}</h1>
			<p class="mt-3 max-w-2xl text-sm text-slate-600">
				{isPaid ? m.checkout_success_copy() : m.checkout_success_processing_copy()}
			</p>
		</div>

		<div class="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px]">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">{m.checkout_order_summary_title({ count: data.summary.items.length })}</h2>
				<div class="mt-6 space-y-4">
					{#each data.summary.items as item (item.id)}
						<div class="flex items-start justify-between gap-4 rounded-[1rem] border border-slate-100 p-4">
							<div>
								<h3 class="text-sm font-semibold text-slate-900">{item.name}</h3>
								<p class="mt-1 text-sm text-slate-500">{m.checkout_order_quantity({ quantity: item.quantity })}</p>
							</div>
							<p class="text-sm font-semibold text-slate-900">{formatPrice(item.total)}</p>
						</div>
					{/each}
				</div>
			</div>

			<aside class="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-5">
				<div class="space-y-4 text-sm text-slate-600">
					<div>
						<p class="font-semibold text-slate-900">{m.checkout_success_payment_reference()}</p>
						<p class="mt-1 break-all">{data.summary.sessionId}</p>
					</div>

					{#if data.summary.orderIds.length > 0}
						<div>
							<p class="font-semibold text-slate-900">{m.checkout_success_order_ids()}</p>
							<p class="mt-1 break-all">{data.summary.orderIds.join(', ')}</p>
						</div>
					{/if}

					<div>
						<p class="font-semibold text-slate-900">{m.checkout_success_total_label()}</p>
						<p class="mt-1 text-lg font-bold text-slate-950">{totalLabel}</p>
					</div>

					{#if createdLabel}
						<div>
							<p class="font-semibold text-slate-900">{m.checkout_success_date_label()}</p>
							<p class="mt-1">{createdLabel}</p>
						</div>
					{/if}

					{#if data.summary.shipping}
						<div>
							<p class="font-semibold text-slate-900">{m.checkout_success_shipping_title()}</p>
							<p class="mt-1">{data.summary.shipping.firstName} {data.summary.shipping.lastName}</p>
							<p>{data.summary.shipping.address}</p>
							<p>{data.summary.shipping.city}, {data.summary.shipping.state} {data.summary.shipping.zip}</p>
							<p>{data.summary.shipping.email}</p>
						</div>
					{/if}
				</div>

				<div class="mt-6 flex flex-col gap-3">
					<a class="inline-flex items-center justify-center rounded-custom bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark" href="/dashboard">
						{m.checkout_success_go_dashboard()}
					</a>
					<a class="inline-flex items-center justify-center rounded-custom border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white" href="/">
						{m.checkout_success_continue_shopping()}
					</a>
				</div>
			</aside>
		</div>
	</section>
</main>

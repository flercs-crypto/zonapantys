<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { buildClientDashboardHref, type ClientPurchasesPage } from './data';

	type Props = {
		ordersPage: ClientPurchasesPage;
	};

	let { ordersPage }: Props = $props();

	const currencyFormatter = $derived.by(
		() =>
			new Intl.NumberFormat($currentLocale, {
				style: 'currency',
				currency: 'USD'
			})
	);

	const dateFormatter = $derived.by(
		() =>
			new Intl.DateTimeFormat($currentLocale, {
				dateStyle: 'medium'
			})
	);

	const statusClass = (status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled') => {
		switch (status) {
			case 'processing':
				return 'bg-blue-50 text-blue-700';
			case 'shipped':
				return 'bg-violet-50 text-violet-700';
			case 'completed':
				return 'bg-emerald-50 text-emerald-700';
			case 'cancelled':
				return 'bg-red-50 text-red-700';
			default:
				return 'bg-amber-50 text-amber-700';
		}
	};

	const statusLabel = (status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled') => {
		switch (status) {
			case 'processing':
				return m.dashboard_client_purchase_status_processing();
			case 'shipped':
				return m.dashboard_client_purchase_status_shipped();
			case 'completed':
				return m.dashboard_client_purchase_status_completed();
			case 'cancelled':
				return m.dashboard_client_purchase_status_cancelled();
			default:
				return m.dashboard_client_purchase_status_pending();
		}
	};
</script>

<section class="space-y-6" data-locale={$currentLocale}>
	<div class="rounded-[1.5rem] bg-white p-6 shadow-card">
		<p class="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
			{m.dashboard_client_purchases_section_kicker()}
		</p>
		<h1 class="mt-2 text-3xl font-bold text-slate-900">{m.dashboard_client_purchases_title()}</h1>
		<p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
			{m.dashboard_client_purchases_copy()}
		</p>
	</div>

	{#if ordersPage.items.length === 0}
		<div class="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-8 py-12 text-center shadow-card">
			<h2 class="text-xl font-semibold text-slate-900">{m.dashboard_client_purchases_empty_title()}</h2>
			<p class="mt-3 text-sm text-slate-500">{m.dashboard_client_purchases_empty_copy()}</p>
			<a
				class="mt-6 inline-flex rounded-custom bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
				href="/vendedoras"
			>
				{m.dashboard_client_purchases_empty_cta()}
			</a>
		</div>
	{:else}
		<div class="space-y-4">
			{#each ordersPage.items as order (order.id)}
				<article class="rounded-[1.5rem] bg-white p-6 shadow-card">
					<div class="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
						<div>
							<p class="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
								{m.dashboard_client_purchases_order_label()}
							</p>
							<h2 class="mt-2 text-xl font-semibold text-slate-900">{order.orderNumber}</h2>
							<p class="mt-2 text-sm text-slate-500">
								{dateFormatter.format(new Date(order.createdAt))}
							</p>
						</div>

						<div class="flex flex-col items-start gap-3 md:items-end">
							<span class={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.status)}`}>
								{statusLabel(order.status)}
							</span>
							<p class="text-lg font-bold text-slate-900">{currencyFormatter.format(order.total)}</p>
						</div>
					</div>

					<ul class="mt-5 space-y-4">
						{#each order.products as product, index (`${order.id}-${product.productId ?? index}`)}
							<li class="flex items-center gap-4">
								<img
									alt={product.productName}
									class="h-16 w-16 rounded-2xl object-cover"
									src={product.image}
								/>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-semibold text-slate-900">{product.productName}</p>
									<p class="mt-1 text-xs text-slate-500">
										{m.dashboard_client_purchase_item_meta({
											quantity: product.quantity,
											price: currencyFormatter.format(product.unitPrice)
										})}
									</p>
								</div>
								<p class="text-sm font-semibold text-slate-700">
									{currencyFormatter.format(product.total)}
								</p>
							</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>

		{#if ordersPage.totalPages > 1}
			<nav class="flex items-center justify-between rounded-[1.25rem] bg-white px-5 py-4 shadow-card">
				<a
					aria-disabled={ordersPage.page <= 1}
					class={`rounded-custom px-4 py-2 text-sm font-semibold ${ordersPage.page <= 1 ? 'pointer-events-none text-slate-300' : 'text-brand hover:bg-brand/5'}`}
					href={buildClientDashboardHref('purchases', ordersPage.page - 1)}
				>
					{m.dashboard_client_pagination_previous()}
				</a>
				<p class="text-sm text-slate-500">
					{m.dashboard_client_pagination_summary({
						page: ordersPage.page,
						totalPages: ordersPage.totalPages
					})}
				</p>
				<a
					aria-disabled={ordersPage.page >= ordersPage.totalPages}
					class={`rounded-custom px-4 py-2 text-sm font-semibold ${ordersPage.page >= ordersPage.totalPages ? 'pointer-events-none text-slate-300' : 'text-brand hover:bg-brand/5'}`}
					href={buildClientDashboardHref('purchases', ordersPage.page + 1)}
				>
					{m.dashboard_client_pagination_next()}
				</a>
			</nav>
		{/if}
	{/if}
</section>
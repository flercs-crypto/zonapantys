<script lang="ts">
	import { resolve } from '$app/paths';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { formatPrice } from '$lib/components/shop-seller/data';

	type DashboardOrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

	type Props = {
		ordersPage: {
			items: Array<{
				id: string;
				orderNumber: string;
				createdAt: string;
				total: number;
				status: DashboardOrderStatus;
				products: Array<{
					productName: string;
					quantity: number;
				}>;
			}>;
			page: number;
			pageSize: number;
			totalItems: number;
			totalPages: number;
		};
	};

	let { ordersPage }: Props = $props();

	const dateFormatter = $derived.by(() => {
		$currentLocale;
		return new Intl.DateTimeFormat($currentLocale === 'en' ? 'en-US' : 'es-CL', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	});

	const getStatusClassName = (status: DashboardOrderStatus) => {
		switch (status) {
			case 'processing':
				return 'bg-blue-100 text-blue-800';
			case 'shipped':
				return 'bg-violet-100 text-violet-800';
			case 'completed':
				return 'bg-emerald-100 text-emerald-800';
			case 'cancelled':
				return 'bg-rose-100 text-rose-700';
			default:
				return 'bg-amber-100 text-amber-800';
		}
	};

	const getStatusLabel = (status: DashboardOrderStatus) => {
		switch (status) {
			case 'processing':
				return m.dashboard_seller_order_status_processing();
			case 'shipped':
				return m.dashboard_seller_order_status_shipped();
			case 'completed':
				return m.dashboard_seller_order_status_completed();
			case 'cancelled':
				return m.dashboard_seller_order_status_cancelled();
			default:
				return m.dashboard_seller_order_status_pending();
		}
	};

	const paginationLinks = $derived.by(() =>
		Array.from({ length: ordersPage.totalPages }, (_, index) => index + 1)
	);
</script>

<div class="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-card lg:p-8" data-locale={$currentLocale}>
	<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
				{m.dashboard_seller_orders_label()}
			</p>
			<h2 class="mt-2 text-3xl font-bold text-slate-950">{m.dashboard_seller_orders_title()}</h2>
			<p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
				{m.dashboard_seller_orders_copy()}
			</p>
		</div>
		<div class="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
			{m.dashboard_seller_orders_count({ count: ordersPage.totalItems })}
		</div>
	</div>

	{#if ordersPage.items.length === 0}
		<div class="mt-8 rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
			<h3 class="text-lg font-semibold text-slate-900">{m.dashboard_seller_orders_empty_title()}</h3>
			<p class="mt-3 text-sm text-slate-500">{m.dashboard_seller_orders_empty_copy()}</p>
		</div>
	{:else}
		<div class="mt-8 overflow-x-auto">
			<table class="min-w-full divide-y divide-slate-200">
				<thead>
					<tr class="text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
						<th class="pb-4 pr-4">{m.dashboard_seller_orders_date()}</th>
						<th class="pb-4 pr-4">{m.dashboard_seller_orders_number()}</th>
						<th class="pb-4 pr-4">{m.dashboard_seller_orders_products()}</th>
						<th class="pb-4 pr-4">{m.dashboard_seller_orders_total()}</th>
						<th class="pb-4">{m.dashboard_seller_orders_status()}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each ordersPage.items as order (order.id)}
						<tr class="align-top">
							<td class="py-5 pr-4 text-sm text-slate-600">{dateFormatter.format(new Date(order.createdAt))}</td>
							<td class="py-5 pr-4 text-sm font-semibold text-slate-900">{order.orderNumber}</td>
							<td class="py-5 pr-4 text-sm text-slate-600">
								<div class="space-y-2">
									{#each order.products as product (`${order.id}-${product.productName}-${product.quantity}`)}
										<p>{product.productName} x{product.quantity}</p>
									{/each}
								</div>
							</td>
							<td class="py-5 pr-4 text-sm font-semibold text-slate-900">{formatPrice(order.total)}</td>
							<td class="py-5">
								<span class={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase ${getStatusClassName(order.status)}`}>
									{getStatusLabel(order.status)}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if ordersPage.totalPages > 1}
			<div class="mt-8 flex flex-wrap items-center gap-2">
				{#each paginationLinks as pageNumber (pageNumber)}
					<form action={`${resolve('/dashboard/seller')}#orders`} method="GET">
						<button
							class:active-page={pageNumber === ordersPage.page}
							class="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
							name="ordersPage"
							type="submit"
							value={pageNumber}
						>
							{pageNumber}
						</button>
					</form>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.active-page {
		border-color: rgb(15 23 42);
		background: rgb(15 23 42);
		color: white;
	}
</style>
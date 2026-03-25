<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { formatPrice } from '$lib/components/shop-seller/data';

	type Props = {
		summary: {
			totalRevenue: number;
			completedOrdersThisMonth: number;
			averageTicket: number;
			topProductName: string | null;
			topProductUnits: number;
		};
	};

	let { summary }: Props = $props();

	const cards = $derived.by(() => [
		{
			label: m.dashboard_seller_sales_total_revenue(),
			value: formatPrice(summary.totalRevenue),
			copy: m.dashboard_seller_sales_total_revenue_copy()
		},
		{
			label: m.dashboard_seller_sales_month_orders(),
			value: String(summary.completedOrdersThisMonth),
			copy: m.dashboard_seller_sales_month_orders_copy()
		},
		{
			label: m.dashboard_seller_sales_top_product(),
			value:
				summary.topProductName ?? m.dashboard_seller_sales_top_product_empty(),
			copy:
				summary.topProductUnits > 0
					? m.dashboard_seller_sales_top_product_units({ count: summary.topProductUnits })
					: m.dashboard_seller_sales_top_product_copy()
		},
		{
			label: m.dashboard_seller_sales_average_ticket(),
			value: formatPrice(summary.averageTicket),
			copy: m.dashboard_seller_sales_average_ticket_copy()
		}
	]);
</script>

<div class="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-card lg:p-8" data-locale={$currentLocale}>
	<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
				{m.dashboard_seller_sales_label()}
			</p>
			<h2 class="mt-2 text-3xl font-bold text-slate-950">{m.dashboard_seller_sales_title()}</h2>
			<p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
				{m.dashboard_seller_sales_copy()}
			</p>
		</div>
	</div>

	<div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
		{#each cards as card (card.label)}
			<article class="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-5">
				<p class="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">{card.label}</p>
				<p class="mt-3 text-2xl font-bold text-slate-950">{card.value}</p>
				<p class="mt-3 text-sm leading-6 text-slate-500">{card.copy}</p>
			</article>
		{/each}
	</div>
</div>
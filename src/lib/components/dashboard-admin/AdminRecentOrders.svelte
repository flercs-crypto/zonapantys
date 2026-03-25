<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { getAdminOrderStatusLabel } from './data';
	import type { AdminPanelOrder } from '$lib/services/admin-dashboard.server';

	type Props = {
		orders: AdminPanelOrder[];
		viewAllHref: string;
	};

	let { orders, viewAllHref }: Props = $props();
	const currencyFormatter = $derived.by(
		() =>
			new Intl.NumberFormat($currentLocale, {
				style: 'currency',
				currency: 'USD'
			})
	);

	const badgeClass = (status: AdminPanelOrder['status']) => {
		switch (status) {
			case 'completed':
				return 'bg-emerald-100 text-emerald-700';
			case 'cancelled':
				return 'bg-rose-100 text-rose-700';
			case 'processing':
				return 'bg-blue-100 text-blue-700';
			case 'shipped':
				return 'bg-violet-100 text-violet-700';
			case 'pending':
				return 'bg-amber-100 text-amber-700';
		}
	};
</script>

<section
	class="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-card lg:col-span-2"
	data-locale={$currentLocale}
>
	<div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
		<h3 class="text-lg font-semibold text-slate-800">{m.dashboard_admin_recent_orders_title()}</h3>
		<a class="text-sm font-medium text-brand hover:text-brand-dark" href={viewAllHref}>{m.common_view_all()}</a>
	</div>

	<div class="overflow-x-auto">
		<table class="w-full border-collapse text-left">
			<thead>
				<tr class="bg-slate-50">
					<th class="px-6 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase"
						>{m.dashboard_admin_order_id()}</th
					>
					<th class="px-6 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase"
						>{m.dashboard_admin_customer()}</th
					>
					<th class="px-6 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase"
						>{m.dashboard_admin_status()}</th
					>
					<th
						class="px-6 py-3 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase"
						>{m.dashboard_admin_amount()}</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-100">
				{#each orders as order}
					<tr class="transition hover:bg-slate-50">
						<td class="px-6 py-4 text-sm font-medium text-slate-900">{order.orderNumber}</td>
						<td class="px-6 py-4 text-sm text-slate-600">{order.customerName}</td>
						<td class="px-6 py-4"
							><span
								class={`${badgeClass(order.status)} rounded-full px-2 py-1 text-xs font-medium`}
								>{getAdminOrderStatusLabel(order.status)}</span
							></td
						>
						<td class="px-6 py-4 text-right text-sm font-medium text-slate-900">{currencyFormatter.format(order.amount)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { ClientRecentActivity } from './data';

	type Props = {
		items: ClientRecentActivity[];
	};

	let { items }: Props = $props();

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

	const toneClass = (status: ClientRecentActivity['status']) => {
		switch (status) {
			case 'processing':
				return 'bg-blue-50 text-blue-600';
			case 'shipped':
				return 'bg-violet-50 text-violet-600';
			case 'completed':
				return 'bg-emerald-50 text-emerald-600';
			case 'cancelled':
				return 'bg-red-50 text-red-600';
			default:
				return 'bg-amber-50 text-amber-600';
		}
	};

	const iconPath = (status: ClientRecentActivity['status']) => {
		switch (status) {
			case 'processing':
				return 'M12 6v6l4 2';
			case 'shipped':
				return 'M3 7h11l4 5v5H8a2 2 0 01-4 0H3V7zm13 3h2.586L21 13.414V15h-5v-5zM7 17a2 2 0 11-4 0 2 2 0 014 0zm11 0a2 2 0 11-4 0 2 2 0 014 0z';
			case 'completed':
				return 'M5 13l4 4L19 7';
			case 'cancelled':
				return 'M6 18L18 6M6 6l12 12';
			default:
				return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
		}
	};
</script>

<section class="lg:col-span-1" data-locale={$currentLocale}>
	<div class="overflow-hidden rounded-[1.25rem] bg-white shadow-card">
		<div class="border-b border-slate-100 px-6 py-4">
			<h3 class="font-bold text-slate-800">{m.dashboard_client_recent_activity_title()}</h3>
		</div>

		<div class="p-6">
			{#if items.length === 0}
				<div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
					<h4 class="text-sm font-semibold text-slate-900">
						{m.dashboard_client_recent_activity_empty_title()}
					</h4>
					<p class="mt-2 text-sm text-slate-500">
						{m.dashboard_client_recent_activity_empty_copy()}
					</p>
				</div>
			{:else}
				<ul class="space-y-6">
					{#each items as item (item.orderId)}
						<li class="flex items-start">
							<div
								class={`${toneClass(item.status)} mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full`}
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										d={iconPath(item.status)}
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									></path>
								</svg>
							</div>
							<div>
								<p class="text-sm font-medium text-slate-800">
									{m.dashboard_client_recent_activity_item({
										orderNumber: item.orderNumber,
										total: currencyFormatter.format(item.total)
									})}
								</p>
								<p class="text-xs text-slate-500">
									{dateFormatter.format(new Date(item.createdAt))}
								</p>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</section>

<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { AdminPanelSeller } from '$lib/services/admin-dashboard.server';

	type Props = {
		sellers: AdminPanelSeller[];
		viewAllHref: string;
	};

	let { sellers, viewAllHref }: Props = $props();
	const relativeFormatter = $derived.by(
		() =>
			new Intl.RelativeTimeFormat($currentLocale === 'en' ? 'en-US' : 'es-CL', {
				numeric: 'auto'
			})
	);
	const getRelativeTimeLabel = (createdAt: string) => {
		const deltaSeconds = Math.round((new Date(createdAt).getTime() - Date.now()) / 1000);

		if (Math.abs(deltaSeconds) < 3600) {
			return relativeFormatter.format(Math.round(deltaSeconds / 60), 'minute');
		}

		if (Math.abs(deltaSeconds) < 86400) {
			return relativeFormatter.format(Math.round(deltaSeconds / 3600), 'hour');
		}

		return relativeFormatter.format(Math.round(deltaSeconds / 86400), 'day');
	};
</script>

<section
	class="flex flex-col overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-card"
	data-locale={$currentLocale}
>
	<div class="border-b border-slate-100 px-6 py-4">
		<h3 class="text-lg font-semibold text-slate-800">{m.dashboard_admin_new_sellers_title()}</h3>
	</div>

	<div class="space-y-4 p-6">
		{#each sellers as seller}
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-brand"
					>
						{seller.storeName.slice(0, 1).toUpperCase()}
					</div>
					<div>
						<p class="text-sm font-semibold text-slate-900">{seller.storeName}</p>
						<p class="text-xs text-slate-500">{getRelativeTimeLabel(seller.createdAt)}</p>
					</div>
				</div>
				<a
					class="rounded-custom bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
					href={seller.highlightHref}>{m.dashboard_admin_review()}</a
				>
			</div>
		{/each}
	</div>

	<div class="mt-auto border-t border-slate-100 bg-slate-50 p-4">
		<a class="block w-full text-center text-sm font-medium text-slate-600 hover:text-brand" href={viewAllHref}>{m.dashboard_admin_view_all_applications()}</a>
	</div>
</section>

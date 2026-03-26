<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';

	type Props = {
		visitSummary: {
			totalVisits: number;
			visitsThisWeek: number;
			visitsThisMonth: number;
			points: Array<{
				date: string;
				visits: number;
			}>;
		};
	};

	let { visitSummary }: Props = $props();

	const maxVisits = $derived(Math.max(...visitSummary.points.map((point) => point.visits), 1));
	const dayFormatter = $derived.by(() => {
		$currentLocale;
		return new Intl.DateTimeFormat($currentLocale === 'en' ? 'en-US' : 'es-CL', {
			month: 'short',
			day: 'numeric'
		});
	});
	const highlightedLabels = $derived.by(() =>
		visitSummary.points
			.map((point, index) => ({
				index,
				label: dayFormatter.format(new Date(`${point.date}T00:00:00Z`))
			}))
			.filter((entry) => entry.index === 0 || entry.index === 9 || entry.index === 19 || entry.index === 29)
	);
</script>

<div class="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-card lg:p-8" data-locale={$currentLocale}>
	<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
				{m.dashboard_seller_stats_label()}
			</p>
			<h2 class="mt-2 text-3xl font-bold text-slate-950">{m.dashboard_seller_stats_title()}</h2>
			<p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
				{m.dashboard_seller_stats_copy()}
			</p>
		</div>
	</div>

	<div class="mt-8 grid gap-4 md:grid-cols-3">
		<div class="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
			<p class="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">{m.dashboard_seller_stats_total_visits()}</p>
			<p class="mt-3 text-3xl font-bold text-slate-950">{visitSummary.totalVisits}</p>
		</div>
		<div class="rounded-[1.25rem] border border-blue-200 bg-blue-50 p-5">
			<p class="text-xs font-semibold tracking-[0.18em] text-blue-700 uppercase">{m.dashboard_seller_stats_week_visits()}</p>
			<p class="mt-3 text-3xl font-bold text-blue-950">{visitSummary.visitsThisWeek}</p>
		</div>
		<div class="rounded-[1.25rem] border border-violet-200 bg-violet-50 p-5">
			<p class="text-xs font-semibold tracking-[0.18em] text-violet-700 uppercase">{m.dashboard_seller_stats_month_visits()}</p>
			<p class="mt-3 text-3xl font-bold text-violet-950">{visitSummary.visitsThisMonth}</p>
		</div>
	</div>

	<div class="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
		<div class="flex items-center justify-between gap-4">
			<div>
				<h3 class="text-lg font-semibold text-slate-900">{m.dashboard_seller_stats_chart_title()}</h3>
				<p class="mt-2 text-sm text-slate-500">{m.dashboard_seller_stats_chart_copy()}</p>
			</div>
			<p class="text-sm font-semibold text-slate-500">{m.dashboard_seller_stats_chart_peak({ count: maxVisits })}</p>
		</div>

		<div class="mt-8 grid h-56 grid-cols-30 items-end gap-2">
			{#each visitSummary.points as point (point.date)}
				<div class="flex h-full items-end">
					<div
						class="w-full rounded-t-2xl bg-[linear-gradient(180deg,var(--color-accent)_0%,var(--color-brand)_100%)]"
						style:height={`${Math.max((point.visits / maxVisits) * 100, point.visits > 0 ? 8 : 0)}%`}
						title={`${point.date}: ${point.visits}`}
					></div>
				</div>
			{/each}
		</div>

		<div class="mt-4 flex items-center justify-between gap-4 text-xs font-medium text-slate-500">
			{#each highlightedLabels as item (item.index)}
				<span>{item.label}</span>
			{/each}
		</div>
	</div>
</div>

<style>
	.grid-cols-30 {
		grid-template-columns: repeat(30, minmax(0, 1fr));
	}
</style>
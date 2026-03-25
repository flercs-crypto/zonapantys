<script lang="ts">
	import type { AdminStat } from './data';

	type Props = {
		stats: AdminStat[];
	};

	let { stats }: Props = $props();

	const changeClass = (stat: AdminStat) =>
		stat.changeTone === 'brand'
			? 'mb-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand'
			: 'mb-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600';
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
	{#each stats as stat}
		<article class="flex flex-col rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-card">
			<span class="mb-1 text-sm font-medium text-slate-500">{stat.label}</span>
			<div class="flex items-end gap-2">
				<span class="text-3xl font-bold text-slate-900">{stat.value}</span>
				<span class={changeClass(stat)}>{stat.change}</span>
			</div>
			<div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100">
				<div class={`${stat.progressClass} h-full bg-brand`}></div>
			</div>
		</article>
	{/each}
</div>
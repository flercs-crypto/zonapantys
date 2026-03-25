<script lang="ts">
	import type { AuthLink } from './data';

	type Props = {
		copy: string;
		links?: AuthLink[];
	};

	let { copy, links = [] }: Props = $props();
</script>

<div class="space-y-3 text-center text-xs text-slate-400">
	<p>{copy}</p>
	{#if links.length > 0}
		<div class="flex flex-wrap justify-center gap-4">
			{#each links as link}
				<a class="hover:text-brand" href={link.href}>{link.label}</a>
			{/each}
		</div>
	{/if}
</div>
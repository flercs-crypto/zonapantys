<script lang="ts">
	import BrandLogoLink from '$lib/components/brand/BrandLogoLink.svelte';

	type Props = {
		title: string;
		subtitle: string;
	};

	let { title, subtitle }: Props = $props();
</script>

<header class="text-center">
	<div class="flex justify-center">
		<BrandLogoLink rootClass="inline-flex items-center" imageClass="h-22 w-auto" title="" alt={title} />
	</div>
	<p class="mt-2 text-sm text-slate-600">{subtitle}</p>
</header>
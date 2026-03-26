<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { LandingStep } from './data';

	type Props = {
		steps: LandingStep[];
	};

	let { steps }: Props = $props();
</script>

<section class="bg-slate-100 py-20" data-locale={$currentLocale}>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-16 text-center">
			<h2 class="text-3xl font-bold text-slate-950">{m.landing_how_title()}</h2>
			<div class="mx-auto mt-4 h-1 w-20 rounded-full bg-brand"></div>
		</div>

		<div class="grid gap-8 md:grid-cols-3">
			{#each steps as item}
				<article class="rounded-[1.25rem] bg-white p-8 text-center shadow-card">
					<div
						class="mx-auto text-white flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-2xl font-bold text-brand"
					>
						{item.step}
					</div>
					<h3 class="mt-5 text-xl font-bold text-slate-900">{item.title}</h3>
					<p class="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
				</article>
			{/each}
		</div>
	</div>
</section>

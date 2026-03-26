<script lang="ts">
	import { resolve } from '$app/paths';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { SellerFooterSection } from './data';

	type Props = {
		sections: SellerFooterSection[];
	};

	let { sections }: Props = $props();
</script>

<footer class="mt-16 border-t border-slate-200 bg-white py-12" data-locale={$currentLocale}>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-8 grid gap-8 md:grid-cols-3">
			{#each sections as section}
				<div>
					<h4 class="mb-4 text-xs font-bold tracking-[0.2em] text-slate-900 uppercase">
						{section.title}
					</h4>
					<p class="text-sm leading-7 text-slate-500">{section.copy}</p>
				</div>
			{/each}
		</div>

		<div
			class="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 text-sm text-slate-400 md:flex-row"
		>
			<p>{m.seller_footer_copyright()}</p>
			<div class="flex gap-6">
				<a class="hover:underline" href={resolve('/privacidad')}>{m.common_privacy_policy()}</a>
				<a class="hover:underline" href={resolve('/terminos')}>{m.common_terms_of_service()}</a>
			</div>
		</div>
	</div>
</footer>

<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { FooterLink } from './data';

	type Props = {
		links: FooterLink[];
	};

	let { links }: Props = $props();
</script>

<footer class="border-t border-slate-200 bg-slate-50 py-12" data-locale={$currentLocale}>
	<div class="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
		<p class="mb-4 text-sm text-slate-500">{m.checkout_footer_copyright()}</p>
		<div class="flex justify-center gap-6 text-xs font-medium text-slate-400">
			{#each links as link}
				<a class="hover:text-brand" href={link.href}>{link.label}</a>
			{/each}
		</div>
	</div>
</footer>

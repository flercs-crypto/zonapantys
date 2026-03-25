<script lang="ts">
	import { availableLocales, currentLocale, setAppLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { Locale } from '$lib/paraglide/runtime.js';

	const labelForLocale = (locale: Locale) =>
		locale === 'es' ? m.locale_name_es() : m.locale_name_en();
</script>

<div class="fixed right-4 bottom-4 z-50" data-locale={$currentLocale}>
	<div
		class="flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur"
	>
		<span class="sr-only">{m.locale_selector_label()}</span>
		{#each availableLocales as locale}
			<button
				aria-label={labelForLocale(locale)}
				aria-pressed={$currentLocale === locale}
				class={$currentLocale === locale
					? 'rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white'
					: 'rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100'}
				onclick={() => setAppLocale(locale)}
				type="button"
			>
				{locale.toUpperCase()}
			</button>
		{/each}
	</div>
</div>

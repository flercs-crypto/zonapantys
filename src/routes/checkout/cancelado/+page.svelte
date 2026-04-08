<script lang="ts">
	import { resolve } from '$app/paths';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import { NOINDEX_FOLLOW, type SeoMetadata } from '$lib/seo';

	const seo = $derived.by<SeoMetadata>(() => {
		$currentLocale;
		return {
			title: m.checkout_cancelled_page_title(),
			description: m.checkout_cancelled_page_description(),
			robots: NOINDEX_FOLLOW
		};
	});
</script>

<SeoHead {seo} />

<main class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8" data-locale={$currentLocale}>
	<section class="rounded-[1.5rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-card sm:px-10">
		<p class="text-xs font-semibold tracking-[0.24em] text-amber-600 uppercase">
			{m.checkout_cancelled_badge()}
		</p>
		<h1 class="mt-4 text-3xl font-bold text-slate-950">{m.checkout_cancelled_title()}</h1>
		<p class="mt-4 text-sm leading-6 text-slate-600">{m.checkout_cancelled_copy()}</p>
		<div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
			<a class="inline-flex items-center justify-center rounded-custom bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark" href={resolve('/carrito')}>
				{m.checkout_cancelled_back_to_cart()}
			</a>
			<a class="inline-flex items-center justify-center rounded-custom border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={resolve('/')}>
				{m.checkout_cancelled_back_to_store()}
			</a>
		</div>
	</section>
</main>

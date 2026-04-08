<script lang="ts">
	import { resolve } from '$app/paths';
	import { currentLocale } from '$lib/i18n';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import LandingNavbar from '$lib/components/landing/LandingNavbar.svelte';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import {
		getFooterGroups,
		getLandingNavLinks,
		getSocialLinks
	} from '$lib/components/landing/data';
	import * as m from '$lib/paraglide/messages.js';
	import { NOINDEX_FOLLOW, type SeoMetadata } from '$lib/seo';

	type Props = {
		error?: (App.Error & { message?: string }) | null;
		status?: number;
	};

	let { error = null, status = 500 }: Props = $props();

	const landingNavLinks = $derived.by(() => {
		$currentLocale;
		return getLandingNavLinks();
	});

	const footerGroups = $derived.by(() => {
		$currentLocale;
		return getFooterGroups();
	});

	const socialLinks = $derived.by(() => {
		$currentLocale;
		return getSocialLinks();
	});

	const isNotFound = $derived(status === 404);
	const errorMessage = $derived(error?.message?.trim() || m.error_generic_copy());
	const seo = $derived.by<SeoMetadata>(() => {
		$currentLocale;
		return {
			title: isNotFound ? m.error_not_found_title() : m.error_generic_title(),
			description: isNotFound ? m.error_not_found_copy() : errorMessage,
			robots: NOINDEX_FOLLOW
		};
	});
</script>

<SeoHead {seo} />

<LandingNavbar links={landingNavLinks} />

<main class="relative overflow-hidden pb-20" data-locale={$currentLocale}>
	<div class="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(139,26,74,0.24),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(201,149,106,0.18),transparent_35%),linear-gradient(180deg,var(--color-text-brand)_0%,rgba(245,230,208,0)_100%)]"></div>

	<section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
		<div class="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center">
			<div>
				<p class="inline-flex rounded-full border border-brand/10 bg-white/85 px-4 py-1 text-xs font-semibold tracking-[0.24em] text-brand uppercase backdrop-blur">
					{status}
				</p>
				<p class="mt-8 text-7xl font-black tracking-[-0.08em] text-slate-950 sm:text-8xl md:text-[7rem] lg:text-[8.5rem]">
					{status}
				</p>
				<h1 class="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl lg:text-[3.4rem]">
					{isNotFound ? m.error_not_found_title() : m.error_generic_title()}
				</h1>
				<p class="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
					{isNotFound ? m.error_not_found_copy() : errorMessage}
				</p>
				<p class="mt-4 text-sm font-medium tracking-[0.16em] text-brand uppercase">
					{isNotFound ? m.error_not_found_tease() : errorMessage}
				</p>

				<div class="mt-10 flex flex-col gap-3 sm:flex-row">
					<a
						class="inline-flex items-center justify-center rounded-custom bg-brand px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-brand-dark"
						href={resolve('/')}
					>
						{m.public_page_cta_home()}
					</a>
					<a
						class="inline-flex items-center justify-center rounded-custom border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:border-brand/20 hover:text-brand"
						href={resolve('/vendedoras')}
					>
						{m.landing_hero_primary_cta()}
					</a>
				</div>
			</div>

			<div class="relative rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.42)] backdrop-blur sm:p-10">
				<div class="absolute -top-5 right-6 rounded-full bg-brand px-4 py-2 text-xs font-semibold tracking-[0.2em] text-white uppercase">
					ZonaPantys
				</div>
				<div class="flex items-center justify-between gap-4">
					<div>
						<p class="text-sm font-semibold tracking-[0.2em] text-brand uppercase">
							{isNotFound ? m.error_not_found_card_title() : m.error_generic_title()}
						</p>
						<p class="mt-4 max-w-sm text-sm leading-7 text-slate-600 sm:text-base">
							{isNotFound ? m.error_not_found_card_copy() : errorMessage}
						</p>
					</div>
					<div class="text-6xl sm:text-7xl" aria-hidden="true">👀</div>
				</div>

				<div class="mt-8 grid gap-4 sm:grid-cols-2">
					<div class="rounded-[1.4rem] bg-brand-soft p-5">
						<p class="text-xs font-semibold tracking-[0.2em] text-brand uppercase">
							404 mood
						</p>
						<p class="mt-3 text-lg font-bold text-slate-950">{m.error_not_found_tease()}</p>
					</div>
					<div class="rounded-[1.4rem] bg-slate-950 p-5 text-white">
						<p class="text-xs font-semibold tracking-[0.2em] text-brand-light uppercase">
							{m.common_help_center()}
						</p>
						<p class="mt-3 text-sm leading-7 text-slate-200">{m.help_page_description()}</p>
					</div>
				</div>
			</div>
		</div>
	</section>
</main>

<LandingFooter groups={footerGroups} {socialLinks} />
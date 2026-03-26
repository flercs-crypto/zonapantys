<script lang="ts">
	import { resolve } from '$app/paths';
	import { currentLocale } from '$lib/i18n';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import LandingNavbar from '$lib/components/landing/LandingNavbar.svelte';
	import {
		getFooterGroups,
		getLandingNavLinks,
		getSocialLinks
	} from '$lib/components/landing/data';
	import type { PublicPageContent } from '$lib/components/landing/public-pages';

	type Props = {
		page: PublicPageContent;
	};

	let { page }: Props = $props();

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

	const getSectionCardClass = (tone: PublicPageContent['sections'][number]['tone']) =>
		tone === 'highlight'
			? 'rounded-[1.75rem] border border-white/10 bg-slate-950 p-7 text-white sm:p-8'
			: 'rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-card sm:p-8';

	const getSectionEyebrowClass = (tone: PublicPageContent['sections'][number]['tone']) =>
		tone === 'highlight'
			? 'text-xs font-semibold tracking-[0.24em] text-brand-light uppercase'
			: 'text-xs font-semibold tracking-[0.24em] text-brand uppercase';

	const getSectionTitleClass = (tone: PublicPageContent['sections'][number]['tone']) =>
		tone === 'highlight'
			? 'mt-4 text-2xl font-bold tracking-tight text-white'
			: 'mt-4 text-2xl font-bold tracking-tight text-slate-950';

	const getSectionParagraphClass = (tone: PublicPageContent['sections'][number]['tone']) =>
		tone === 'highlight'
			? 'text-sm leading-7 text-slate-200 sm:text-base'
			: 'text-sm leading-7 text-slate-600 sm:text-base';

	const getSectionBulletDotClass = (tone: PublicPageContent['sections'][number]['tone']) =>
		tone === 'highlight'
			? 'mt-2 h-2 w-2 flex-none rounded-full bg-brand-light'
			: 'mt-2 h-2 w-2 flex-none rounded-full bg-brand';

	const getSectionBulletTextClass = (tone: PublicPageContent['sections'][number]['tone']) =>
		tone === 'highlight' ? 'text-slate-200' : 'text-slate-700';

	const getCtaClass = (variant?: 'primary' | 'secondary') =>
		variant === 'secondary'
			? 'inline-flex items-center justify-center rounded-custom border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:border-white hover:bg-slate-100'
			: 'inline-flex items-center justify-center rounded-custom border border-transparent bg-brand px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-brand-dark';
</script>

<svelte:head>
	<title>{page.metaTitle}</title>
	<meta name="description" content={page.metaDescription} />
</svelte:head>

<LandingNavbar links={landingNavLinks} />

<main class="relative overflow-hidden pb-20" data-locale={$currentLocale}>
	<div class="absolute inset-x-0 top-0 -z-10 h-128 bg-[radial-gradient(circle_at_top_left,rgba(139,26,74,0.26),transparent_46%),radial-gradient(circle_at_top_right,rgba(201,149,106,0.14),transparent_38%),linear-gradient(180deg,var(--color-text-brand)_0%,rgba(245,230,208,0)_100%)]"></div>

	<section class="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8 lg:pt-20">
		<div class="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:items-start">
			<div class="max-w-3xl">
				<p class="inline-flex rounded-full border border-brand/10 bg-white/85 px-4 py-1 text-xs font-semibold tracking-[0.24em] text-brand uppercase backdrop-blur">
					{page.badge}
				</p>
				<h1 class="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl lg:text-[3.4rem]">
					{page.title}
				</h1>
				<p class="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
					{page.intro}
				</p>
			</div>

			<aside class="rounded-[1.9rem] border border-slate-900/10 bg-slate-950 p-7 text-white shadow-[0_28px_90px_-42px_rgba(15,23,42,0.7)] sm:p-8">
				<p class="text-xs font-semibold tracking-[0.24em] text-brand-light uppercase">
					{page.highlightTitle}
				</p>
				<p class="mt-4 text-base leading-7 text-slate-200">{page.highlightCopy}</p>
				<ul class="mt-6 space-y-3 text-sm leading-6 text-slate-200">
					{#each page.highlightPoints as point (point)}
						<li class="flex gap-3">
							<span class="mt-2 h-2.5 w-2.5 flex-none rounded-full bg-brand"></span>
							<span>{point}</span>
						</li>
					{/each}
				</ul>
			</aside>
		</div>
	</section>

	<section class="mx-auto mt-14 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
		{#each page.sections as section, index (section.title)}
			<article class={getSectionCardClass(section.tone)}>
				<p class={getSectionEyebrowClass(section.tone)}>
					0{index + 1}
				</p>
				<h2 class={getSectionTitleClass(section.tone)}>
					{section.title}
				</h2>

				<div class="mt-5 space-y-4">
					{#each section.paragraphs as paragraph (paragraph)}
						<p class={getSectionParagraphClass(section.tone)}>
							{paragraph}
						</p>
					{/each}
				</div>

				{#if section.bullets?.length}
					<ul class="mt-6 space-y-3 text-sm leading-6">
						{#each section.bullets as bullet (bullet)}
							<li class="flex gap-3">
								<span class={getSectionBulletDotClass(section.tone)}></span>
								<span class={getSectionBulletTextClass(section.tone)}>{bullet}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</article>
		{/each}
	</section>

	{#if page.faqCategories?.length}
		<section class="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="max-w-3xl">
				<h2 class="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
					{page.faqTitle}
				</h2>
				<p class="mt-4 text-base leading-8 text-slate-600">{page.faqIntro}</p>
			</div>

			<div class="mt-10 grid gap-6 xl:grid-cols-2">
				{#each page.faqCategories as category (category.title)}
					<section class="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-card sm:p-8">
						<h3 class="text-xl font-bold text-slate-950">{category.title}</h3>
						<div class="mt-6 space-y-5">
							{#each category.items as item (item.question)}
								<article class="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
									<h4 class="text-sm font-semibold text-slate-950 sm:text-base">{item.question}</h4>
									<p class="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
								</article>
							{/each}
						</div>
					</section>
				{/each}
			</div>
		</section>
	{/if}

	<section class="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="rounded-[2rem] bg-[linear-gradient(135deg,var(--color-bg-hero)_0%,var(--color-bg-surface)_48%,var(--color-brand)_150%)] px-7 py-10 text-white shadow-[0_28px_90px_-42px_rgba(13,13,26,0.76)] sm:px-10 sm:py-12">
			<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
				<div class="max-w-2xl">
					<p class="text-xs font-semibold tracking-[0.24em] text-brand-light uppercase">
						ZonaPantys
					</p>
					<h2 class="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">{page.ctaTitle}</h2>
					<p class="mt-4 text-base leading-8 text-slate-200">{page.ctaIntro}</p>
				</div>

				<div class="flex flex-col gap-3 sm:flex-row lg:flex-col">
					{#each page.ctas as cta (cta.label)}
						<a class={getCtaClass(cta.variant)} href={resolve(cta.href)}>
							{cta.label}
						</a>
					{/each}
				</div>
			</div>
		</div>
	</section>
</main>

<LandingFooter groups={footerGroups} {socialLinks} />
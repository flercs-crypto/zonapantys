<script lang="ts">
	import { page } from '$app/state';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import {
		buildAbsoluteUrl,
		buildLocalizedPath,
		normalizeSeoText,
		resolveSeoImage,
		type SeoMetadata
	} from '$lib/seo';

	type Props = {
		seo: SeoMetadata;
	};

	let { seo }: Props = $props();

	const canonicalUrl = $derived.by(() => {
		$currentLocale;
		return buildAbsoluteUrl(buildLocalizedPath(page.url.pathname, getLocale()));
	});

	const title = $derived(normalizeSeoText(seo.title));
	const description = $derived(normalizeSeoText(seo.description));
	const keywords = $derived(seo.keywords ? normalizeSeoText(seo.keywords) : null);
	const robots = $derived(seo.robots ?? 'index, follow');
	const image = $derived(resolveSeoImage(seo.image));
	const imageAlt = $derived.by(() => {
		$currentLocale;
		return seo.imageAlt ? normalizeSeoText(seo.imageAlt) : normalizeSeoText(m.seo_og_default_alt());
	});
	const serializedSchema = $derived(seo.schema ? JSON.stringify(seo.schema) : null);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if keywords}
		<meta name="keywords" content={keywords} />
	{/if}
	<meta name="robots" content={robots} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={imageAlt} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={imageAlt} />
	{#if serializedSchema}
		<script type="application/ld+json">{serializedSchema}</script>
	{/if}
</svelte:head>
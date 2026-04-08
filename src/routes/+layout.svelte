<script lang="ts">
	import './layout.css';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import LanguageSwitcher from '$lib/components/i18n/LanguageSwitcher.svelte';
	import { currentLocale, initI18n } from '$lib/i18n';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { authStore } from '$lib/stores/auth.store';
	import {
		buildAbsoluteUrl,
		buildLocalizedPath,
		getAlternateOpenGraphLocale,
		getOpenGraphLocale,
		THEME_COLOR,
		TWITTER_HANDLE
	} from '$lib/seo';
	import { initializeAnalytics, trackPageView } from '$lib/utils/analytics';

	let { children } = $props();
	const gaMeasurementId = env.PUBLIC_GA_MEASUREMENT_ID?.trim() ?? '';
	const gscVerification = env.PUBLIC_GSC_VERIFICATION?.trim() ?? '';

	const activeLocale = $derived.by(() => {
		$currentLocale;
		return getLocale();
	});

	const canonicalUrl = $derived.by(() =>
		buildAbsoluteUrl(buildLocalizedPath(page.url.pathname, activeLocale))
	);
	const esUrl = $derived(buildAbsoluteUrl(buildLocalizedPath(page.url.pathname, 'es')));
	const enUrl = $derived(buildAbsoluteUrl(buildLocalizedPath(page.url.pathname, 'en')));
	const defaultUrl = $derived(esUrl);
	const ogLocale = $derived(getOpenGraphLocale(activeLocale));
	const alternateOgLocale = $derived(getAlternateOpenGraphLocale(activeLocale));
	const shouldLoadAnalytics = $derived(gaMeasurementId.length > 0);

	let lastTrackedPath = '';

	const trackCurrentPageView = () => {
		if (!browser || !shouldLoadAnalytics) {
			return;
		}

		const localizedPath = buildLocalizedPath(`${page.url.pathname}${page.url.search}`, getLocale());

		if (localizedPath === lastTrackedPath) {
			return;
		}

		lastTrackedPath = localizedPath;
		initializeAnalytics();
		trackPageView(localizedPath, document.title);
	};

	if (browser) {
		authStore.init();
		initI18n();
		afterNavigate(() => {
			trackCurrentPageView();
		});
	}

	onMount(() => {
		trackCurrentPageView();
	});
</script>

<svelte:head>
	<meta name="theme-color" content={THEME_COLOR} />
	<link rel="canonical" href={canonicalUrl} />
	<link rel="alternate" hreflang="es" href={esUrl} />
	<link rel="alternate" hreflang="en" href={enUrl} />
	<link rel="alternate" hreflang="x-default" href={defaultUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="ZonaPantys" />
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:locale:alternate" content={alternateOgLocale} />
	<meta property="og:url" content={canonicalUrl} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content={TWITTER_HANDLE} />
	{#if gscVerification.length > 0}
		<meta name="google-site-verification" content={gscVerification} />
	{/if}
	<link rel="icon" type="image/png" href="/images/logo_zonapantys.png" />
	<link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
	<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin="anonymous" />
	<link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
	<link rel="preconnect" href="https://js.stripe.com" />
</svelte:head>
<LanguageSwitcher />
{@render children()}

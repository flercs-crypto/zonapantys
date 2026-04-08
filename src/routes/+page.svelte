<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import FeaturedProductsSection from '$lib/components/landing/FeaturedProductsSection.svelte';
	import HeroSection from '$lib/components/landing/HeroSection.svelte';
	import HowItWorksSection from '$lib/components/landing/HowItWorksSection.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import LandingNavbar from '$lib/components/landing/LandingNavbar.svelte';
	import SustainabilitySection from '$lib/components/landing/SustainabilitySection.svelte';
	import TestimonialsSection from '$lib/components/landing/TestimonialsSection.svelte';
	import TopSellersSection from '$lib/components/landing/TopSellersSection.svelte';
	import type { PageData } from './$types';
	import {
		getFooterGroups,
		getLandingNavLinks,
		getLandingSteps,
		getSocialLinks,
		getTestimonialCards,
		getTestimonialLead
	} from '$lib/components/landing/data';
	import { buildAbsoluteUrl, type SeoMetadata } from '$lib/seo';

	let { data }: { data: PageData } = $props();

	const landingNavLinks = $derived.by(() => {
		$currentLocale;
		return getLandingNavLinks();
	});

	const landingSteps = $derived.by(() => {
		$currentLocale;
		return getLandingSteps();
	});

	const featuredProducts = $derived(data.featuredProducts ?? []);

	const sellerCards = $derived(data.topSellers ?? []);

	const testimonialCards = $derived.by(() => {
		$currentLocale;
		return getTestimonialCards();
	});

	const testimonialLead = $derived.by(() => {
		$currentLocale;
		return getTestimonialLead();
	});

	const footerGroups = $derived.by(() => {
		$currentLocale;
		return getFooterGroups();
	});

	const socialLinks = $derived.by(() => {
		$currentLocale;
		return getSocialLinks();
	});

	const seo = $derived.by<SeoMetadata>(() => {
		$currentLocale;

		return {
			title: m.landing_home_title(),
			description: m.landing_home_description(),
			keywords: m.landing_home_keywords(),
			schema: {
				'@context': 'https://schema.org',
				'@type': 'Organization',
				name: 'ZonaPantys',
				url: buildAbsoluteUrl('/'),
				logo: buildAbsoluteUrl('/images/logo_zonapantys.png'),
				description: m.seo_organization_description(),
				sameAs: []
			}
		};
	});
</script>

<SeoHead {seo} />

<LandingNavbar links={landingNavLinks} />

<main data-locale={$currentLocale}>
	<HeroSection />
	<HowItWorksSection steps={landingSteps} />
	<FeaturedProductsSection products={featuredProducts} />
	<SustainabilitySection />
	<TopSellersSection sellers={sellerCards} />
	<TestimonialsSection cards={testimonialCards} lead={testimonialLead} />
</main>

<LandingFooter groups={footerGroups} {socialLinks} />

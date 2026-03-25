<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import FeaturedProductsSection from '$lib/components/landing/FeaturedProductsSection.svelte';
	import HeroSection from '$lib/components/landing/HeroSection.svelte';
	import HowItWorksSection from '$lib/components/landing/HowItWorksSection.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';
	import LandingNavbar from '$lib/components/landing/LandingNavbar.svelte';
	import SustainabilitySection from '$lib/components/landing/SustainabilitySection.svelte';
	import TestimonialsSection from '$lib/components/landing/TestimonialsSection.svelte';
	import TopSellersSection from '$lib/components/landing/TopSellersSection.svelte';
	import {
		getFeaturedProducts,
		getFooterGroups,
		getLandingNavLinks,
		getLandingSteps,
		getSellerCards,
		getSocialLinks,
		getTestimonialCards,
		getTestimonialLead
	} from '$lib/components/landing/data';

	const landingNavLinks = $derived.by(() => {
		$currentLocale;
		return getLandingNavLinks();
	});

	const landingSteps = $derived.by(() => {
		$currentLocale;
		return getLandingSteps();
	});

	const featuredProducts = $derived.by(() => {
		$currentLocale;
		return getFeaturedProducts();
	});

	const sellerCards = $derived.by(() => {
		$currentLocale;
		return getSellerCards();
	});

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
</script>

<svelte:head>
	<title>{m.landing_home_title()}</title>
	<meta name="description" content={m.landing_home_description()} />
</svelte:head>

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

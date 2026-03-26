import * as m from '$lib/paraglide/messages.js';

export type LandingNavLink = {
	label: string;
	href: string;
};

export type FooterHref =
	| '/compradores'
	| '/vendedoras'
	| '/autenticidad'
	| '/privacidad'
	| '/envios-discretos'
	| '/envios-internacionales'
	| '/ayuda'
	| '/pagos-seguros'
	| '/terminos';

export type FooterLink = {
	label: string;
	href: FooterHref;
};

export type LandingStep = {
	step: string;
	title: string;
	description: string;
};

export type FeaturedProduct = {
	id: string;
	name: string;
	price: number;
	image: string;
	alt: string;
	sellerName: string;
	href: string;
};

export type SellerCard = {
	id: string;
	name: string;
	reviewCount: number;
	rating: number;
	description: string | null;
	image: string | null;
};

export type TestimonialCard = {
	quote: string;
	author?: string;
	highlight?: boolean;
};

export type FooterGroup = {
	title: string;
	links: FooterLink[];
};

export const getLandingNavLinks = (): LandingNavLink[] => [
	{ label: m.landing_nav_browse(), href: '#featured' },
	{ label: m.landing_nav_community(), href: '#sellers' },
	{ label: m.landing_nav_sustainability(), href: '#impact' }
];

export const getLandingSteps = (): LandingStep[] => [
	{
		step: '1',
		title: m.landing_step_1_title(),
		description: m.landing_step_1_description()
	},
	{
		step: '2',
		title: m.landing_step_2_title(),
		description: m.landing_step_2_description()
	},
	{
		step: '3',
		title: m.landing_step_3_title(),
		description: m.landing_step_3_description()
	}
];

export const getTestimonialLead = () => ({
	quote: m.landing_testimonial_lead_quote(),
	author: m.landing_testimonial_lead_author()
});

export const getTestimonialCards = (): TestimonialCard[] => [
	{
		quote: m.landing_testimonial_1_quote(),
		author: m.landing_testimonial_1_author()
	},
	{
		quote: m.landing_testimonial_2_quote(),
		author: m.landing_testimonial_2_author()
	},
	{
		quote: m.landing_testimonial_3_quote(),
		author: m.landing_testimonial_3_author()
	},
	{
		quote: m.landing_testimonial_4_quote(),
		highlight: true
	}
];

export const getFooterGroups = (): FooterGroup[] => [
	{
		title: m.landing_footer_marketplace(),
		links: [
			{ label: m.landing_footer_women(), href: '/compradores' },
			{ label: m.landing_footer_men(), href: '/vendedoras' }
		]
	},
	{
		title: m.landing_footer_company(),
		links: [
			{ label: m.landing_footer_about_us(), href: '/autenticidad' },
			{ label: m.landing_footer_sustainability(), href: '/privacidad' },
			{ label: m.landing_footer_careers(), href: '/envios-discretos' },
			{ label: m.landing_footer_press(), href: '/envios-internacionales' }
		]
	},
	{
		title: m.landing_footer_support(),
		links: [
			{ label: m.common_help_center(), href: '/ayuda' },
			{ label: m.landing_footer_safety(), href: '/pagos-seguros' },
			{ label: m.common_terms_of_service(), href: '/terminos' }
		]
	}
];

export const getSocialLinks = (): LandingNavLink[] => [
	{ label: 'Instagram', href: '#' },
	{ label: 'TikTok', href: '#' },
	{ label: 'Pinterest', href: '#' }
];

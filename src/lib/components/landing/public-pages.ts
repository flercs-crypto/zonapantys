import * as m from '$lib/paraglide/messages.js';

export type PublicPageHref =
	| '/'
	| '/vendedoras'
	| '/ayuda'
	| '/pagos-seguros'
	| '/terminos'
	| '/privacidad'
	| '/envios-discretos'
	| '/envios-internacionales'
	| '/autenticidad';

export type PublicPageCta = {
	label: string;
	href: PublicPageHref;
	variant?: 'primary' | 'secondary';
};

export type PublicPageSection = {
	title: string;
	paragraphs: string[];
	bullets?: string[];
	tone?: 'default' | 'highlight';
};

export type PublicPageFaqItem = {
	question: string;
	answer: string;
};

export type PublicPageFaqCategory = {
	title: string;
	items: PublicPageFaqItem[];
};

export type PublicPageContent = {
	metaTitle: string;
	metaDescription: string;
	badge: string;
	title: string;
	intro: string;
	highlightTitle: string;
	highlightCopy: string;
	highlightPoints: string[];
	sections: PublicPageSection[];
	faqTitle?: string;
	faqIntro?: string;
	faqCategories?: PublicPageFaqCategory[];
	ctaTitle: string;
	ctaIntro: string;
	ctas: PublicPageCta[];
};

const splitParagraphs = (value: string) =>
	value
		.split('\n\n')
		.map((entry) => entry.trim())
		.filter(Boolean);

const splitLines = (value: string) =>
	value
		.split('\n')
		.map((entry) => entry.trim())
		.filter(Boolean);

export const getBuyersPageContent = (): PublicPageContent => ({
	metaTitle: m.buyers_page_title(),
	metaDescription: m.buyers_page_description(),
	badge: m.buyers_page_badge(),
	title: m.buyers_page_heading(),
	intro: m.buyers_page_intro(),
	highlightTitle: m.buyers_page_highlight_title(),
	highlightCopy: m.buyers_page_highlight_copy(),
	highlightPoints: splitLines(m.buyers_page_highlight_points()),
	sections: [
		{
			title: m.buyers_page_section_discover_title(),
			paragraphs: splitParagraphs(m.buyers_page_section_discover_body()),
			bullets: splitLines(m.buyers_page_section_discover_points())
		},
		{
			title: m.buyers_page_section_custom_title(),
			paragraphs: splitParagraphs(m.buyers_page_section_custom_body()),
			bullets: splitLines(m.buyers_page_section_custom_points()),
			tone: 'highlight'
		},
		{
			title: m.buyers_page_section_secure_title(),
			paragraphs: splitParagraphs(m.buyers_page_section_secure_body()),
			bullets: splitLines(m.buyers_page_section_secure_points())
		}
	],
	ctaTitle: m.buyers_page_cta_title(),
	ctaIntro: m.buyers_page_cta_intro(),
	ctas: [
		{ label: m.landing_hero_primary_cta(), href: '/vendedoras' },
		{ label: m.common_help_center(), href: '/ayuda', variant: 'secondary' }
	]
});

export const getAuthenticityPageContent = (): PublicPageContent => ({
	metaTitle: m.authenticity_page_title(),
	metaDescription: m.authenticity_page_description(),
	badge: m.authenticity_page_badge(),
	title: m.authenticity_page_heading(),
	intro: m.authenticity_page_intro(),
	highlightTitle: m.authenticity_page_highlight_title(),
	highlightCopy: m.authenticity_page_highlight_copy(),
	highlightPoints: splitLines(m.authenticity_page_highlight_points()),
	sections: [
		{
			title: m.authenticity_page_section_verification_title(),
			paragraphs: splitParagraphs(m.authenticity_page_section_verification_body()),
			bullets: splitLines(m.authenticity_page_section_verification_points())
		},
		{
			title: m.authenticity_page_section_listing_title(),
			paragraphs: splitParagraphs(m.authenticity_page_section_listing_body()),
			bullets: splitLines(m.authenticity_page_section_listing_points()),
			tone: 'highlight'
		},
		{
			title: m.authenticity_page_section_incidents_title(),
			paragraphs: splitParagraphs(m.authenticity_page_section_incidents_body()),
			bullets: splitLines(m.authenticity_page_section_incidents_points())
		}
	],
	ctaTitle: m.authenticity_page_cta_title(),
	ctaIntro: m.authenticity_page_cta_intro(),
	ctas: [
		{ label: m.landing_hero_primary_cta(), href: '/vendedoras' },
		{ label: m.secure_payments_page_badge(), href: '/pagos-seguros', variant: 'secondary' }
	]
});

export const getPrivacyPageContent = (): PublicPageContent => ({
	metaTitle: m.privacy_page_title(),
	metaDescription: m.privacy_page_description(),
	badge: m.privacy_page_badge(),
	title: m.privacy_page_heading(),
	intro: m.privacy_page_intro(),
	highlightTitle: m.privacy_page_highlight_title(),
	highlightCopy: m.privacy_page_highlight_copy(),
	highlightPoints: splitLines(m.privacy_page_highlight_points()),
	sections: [
		{
			title: m.privacy_page_section_data_title(),
			paragraphs: splitParagraphs(m.privacy_page_section_data_body()),
			bullets: splitLines(m.privacy_page_section_data_points())
		},
		{
			title: m.privacy_page_section_use_title(),
			paragraphs: splitParagraphs(m.privacy_page_section_use_body()),
			bullets: splitLines(m.privacy_page_section_use_points()),
			tone: 'highlight'
		},
		{
			title: m.privacy_page_section_rights_title(),
			paragraphs: splitParagraphs(m.privacy_page_section_rights_body()),
			bullets: splitLines(m.privacy_page_section_rights_points())
		}
	],
	ctaTitle: m.privacy_page_cta_title(),
	ctaIntro: m.privacy_page_cta_intro(),
	ctas: [
		{ label: m.common_help_center(), href: '/ayuda' },
		{ label: m.common_terms_of_service(), href: '/terminos', variant: 'secondary' }
	]
});

export const getDiscreetShippingPageContent = (): PublicPageContent => ({
	metaTitle: m.discreet_shipping_page_title(),
	metaDescription: m.discreet_shipping_page_description(),
	badge: m.discreet_shipping_page_badge(),
	title: m.discreet_shipping_page_heading(),
	intro: m.discreet_shipping_page_intro(),
	highlightTitle: m.discreet_shipping_page_highlight_title(),
	highlightCopy: m.discreet_shipping_page_highlight_copy(),
	highlightPoints: splitLines(m.discreet_shipping_page_highlight_points()),
	sections: [
		{
			title: m.discreet_shipping_page_section_packaging_title(),
			paragraphs: splitParagraphs(m.discreet_shipping_page_section_packaging_body()),
			bullets: splitLines(m.discreet_shipping_page_section_packaging_points())
		},
		{
			title: m.discreet_shipping_page_section_billing_title(),
			paragraphs: splitParagraphs(m.discreet_shipping_page_section_billing_body()),
			bullets: splitLines(m.discreet_shipping_page_section_billing_points()),
			tone: 'highlight'
		},
		{
			title: m.discreet_shipping_page_section_delivery_title(),
			paragraphs: splitParagraphs(m.discreet_shipping_page_section_delivery_body()),
			bullets: splitLines(m.discreet_shipping_page_section_delivery_points())
		}
	],
	ctaTitle: m.discreet_shipping_page_cta_title(),
	ctaIntro: m.discreet_shipping_page_cta_intro(),
	ctas: [
		{ label: m.international_shipping_page_badge(), href: '/envios-internacionales' },
		{ label: m.common_help_center(), href: '/ayuda', variant: 'secondary' }
	]
});

export const getInternationalShippingPageContent = (): PublicPageContent => ({
	metaTitle: m.international_shipping_page_title(),
	metaDescription: m.international_shipping_page_description(),
	badge: m.international_shipping_page_badge(),
	title: m.international_shipping_page_heading(),
	intro: m.international_shipping_page_intro(),
	highlightTitle: m.international_shipping_page_highlight_title(),
	highlightCopy: m.international_shipping_page_highlight_copy(),
	highlightPoints: splitLines(m.international_shipping_page_highlight_points()),
	sections: [
		{
			title: m.international_shipping_page_section_availability_title(),
			paragraphs: splitParagraphs(m.international_shipping_page_section_availability_body()),
			bullets: splitLines(m.international_shipping_page_section_availability_points())
		},
		{
			title: m.international_shipping_page_section_timing_title(),
			paragraphs: splitParagraphs(m.international_shipping_page_section_timing_body()),
			bullets: splitLines(m.international_shipping_page_section_timing_points()),
			tone: 'highlight'
		},
		{
			title: m.international_shipping_page_section_customs_title(),
			paragraphs: splitParagraphs(m.international_shipping_page_section_customs_body()),
			bullets: splitLines(m.international_shipping_page_section_customs_points())
		}
	],
	ctaTitle: m.international_shipping_page_cta_title(),
	ctaIntro: m.international_shipping_page_cta_intro(),
	ctas: [
		{ label: m.landing_hero_primary_cta(), href: '/vendedoras' },
		{ label: m.discreet_shipping_page_badge(), href: '/envios-discretos', variant: 'secondary' }
	]
});

export const getHelpPageContent = (): PublicPageContent => ({
	metaTitle: m.help_page_title(),
	metaDescription: m.help_page_description(),
	badge: m.help_page_badge(),
	title: m.help_page_heading(),
	intro: m.help_page_intro(),
	highlightTitle: m.help_page_highlight_title(),
	highlightCopy: m.help_page_highlight_copy(),
	highlightPoints: splitLines(m.help_page_highlight_points()),
	sections: [
		{
			title: m.help_page_section_support_title(),
			paragraphs: splitParagraphs(m.help_page_section_support_body()),
			bullets: splitLines(m.help_page_section_support_points())
		},
		{
			title: m.help_page_section_safety_title(),
			paragraphs: splitParagraphs(m.help_page_section_safety_body()),
			bullets: splitLines(m.help_page_section_safety_points()),
			tone: 'highlight'
		}
	],
	faqTitle: m.help_page_faq_title(),
	faqIntro: m.help_page_faq_intro(),
	faqCategories: [
		{
			title: m.help_page_faq_buyers_title(),
			items: [
				{ question: m.help_page_faq_buyers_q1(), answer: m.help_page_faq_buyers_a1() },
				{ question: m.help_page_faq_buyers_q2(), answer: m.help_page_faq_buyers_a2() },
				{ question: m.help_page_faq_buyers_q3(), answer: m.help_page_faq_buyers_a3() }
			]
		},
		{
			title: m.help_page_faq_sellers_title(),
			items: [
				{ question: m.help_page_faq_sellers_q1(), answer: m.help_page_faq_sellers_a1() },
				{ question: m.help_page_faq_sellers_q2(), answer: m.help_page_faq_sellers_a2() },
				{ question: m.help_page_faq_sellers_q3(), answer: m.help_page_faq_sellers_a3() }
			]
		},
		{
			title: m.help_page_faq_payments_title(),
			items: [
				{ question: m.help_page_faq_payments_q1(), answer: m.help_page_faq_payments_a1() },
				{ question: m.help_page_faq_payments_q2(), answer: m.help_page_faq_payments_a2() },
				{ question: m.help_page_faq_payments_q3(), answer: m.help_page_faq_payments_a3() }
			]
		},
		{
			title: m.help_page_faq_shipping_title(),
			items: [
				{ question: m.help_page_faq_shipping_q1(), answer: m.help_page_faq_shipping_a1() },
				{ question: m.help_page_faq_shipping_q2(), answer: m.help_page_faq_shipping_a2() },
				{ question: m.help_page_faq_shipping_q3(), answer: m.help_page_faq_shipping_a3() }
			]
		},
		{
			title: m.help_page_faq_privacy_title(),
			items: [
				{ question: m.help_page_faq_privacy_q1(), answer: m.help_page_faq_privacy_a1() },
				{ question: m.help_page_faq_privacy_q2(), answer: m.help_page_faq_privacy_a2() },
				{ question: m.help_page_faq_privacy_q3(), answer: m.help_page_faq_privacy_a3() }
			]
		}
	],
	ctaTitle: m.help_page_cta_title(),
	ctaIntro: m.help_page_cta_intro(),
	ctas: [
		{ label: m.secure_payments_page_badge(), href: '/pagos-seguros' },
		{ label: m.common_terms_of_service(), href: '/terminos', variant: 'secondary' }
	]
});

export const getSecurePaymentsPageContent = (): PublicPageContent => ({
	metaTitle: m.secure_payments_page_title(),
	metaDescription: m.secure_payments_page_description(),
	badge: m.secure_payments_page_badge(),
	title: m.secure_payments_page_heading(),
	intro: m.secure_payments_page_intro(),
	highlightTitle: m.secure_payments_page_highlight_title(),
	highlightCopy: m.secure_payments_page_highlight_copy(),
	highlightPoints: splitLines(m.secure_payments_page_highlight_points()),
	sections: [
		{
			title: m.secure_payments_page_section_stripe_title(),
			paragraphs: splitParagraphs(m.secure_payments_page_section_stripe_body()),
			bullets: splitLines(m.secure_payments_page_section_stripe_points())
		},
		{
			title: m.secure_payments_page_section_data_title(),
			paragraphs: splitParagraphs(m.secure_payments_page_section_data_body()),
			bullets: splitLines(m.secure_payments_page_section_data_points()),
			tone: 'highlight'
		},
		{
			title: m.secure_payments_page_section_refunds_title(),
			paragraphs: splitParagraphs(m.secure_payments_page_section_refunds_body()),
			bullets: splitLines(m.secure_payments_page_section_refunds_points())
		}
	],
	ctaTitle: m.secure_payments_page_cta_title(),
	ctaIntro: m.secure_payments_page_cta_intro(),
	ctas: [
		{ label: m.common_help_center(), href: '/ayuda' },
		{ label: m.authenticity_page_badge(), href: '/autenticidad', variant: 'secondary' }
	]
});

export const getTermsPageContent = (): PublicPageContent => ({
	metaTitle: m.terms_page_title(),
	metaDescription: m.terms_page_description(),
	badge: m.terms_page_badge(),
	title: m.terms_page_heading(),
	intro: m.terms_page_intro(),
	highlightTitle: m.terms_page_highlight_title(),
	highlightCopy: m.terms_page_highlight_copy(),
	highlightPoints: splitLines(m.terms_page_highlight_points()),
	sections: [
		{
			title: m.terms_page_section_eligibility_title(),
			paragraphs: splitParagraphs(m.terms_page_section_eligibility_body()),
			bullets: splitLines(m.terms_page_section_eligibility_points())
		},
		{
			title: m.terms_page_section_marketplace_title(),
			paragraphs: splitParagraphs(m.terms_page_section_marketplace_body()),
			bullets: splitLines(m.terms_page_section_marketplace_points()),
			tone: 'highlight'
		},
		{
			title: m.terms_page_section_content_title(),
			paragraphs: splitParagraphs(m.terms_page_section_content_body()),
			bullets: splitLines(m.terms_page_section_content_points())
		},
		{
			title: m.terms_page_section_enforcement_title(),
			paragraphs: splitParagraphs(m.terms_page_section_enforcement_body()),
			bullets: splitLines(m.terms_page_section_enforcement_points())
		},
		{
			title: m.terms_page_section_law_title(),
			paragraphs: splitParagraphs(m.terms_page_section_law_body()),
			bullets: splitLines(m.terms_page_section_law_points())
		}
	],
	ctaTitle: m.terms_page_cta_title(),
	ctaIntro: m.terms_page_cta_intro(),
	ctas: [
		{ label: m.common_privacy_policy(), href: '/privacidad' },
		{ label: m.common_help_center(), href: '/ayuda', variant: 'secondary' }
	]
});
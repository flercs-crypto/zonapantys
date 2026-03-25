import * as m from '$lib/paraglide/messages.js';

export type LandingNavLink = {
	label: string;
	href: string;
};

export type LandingStep = {
	step: string;
	title: string;
	description: string;
};

export type FeaturedProduct = {
	name: string;
	price: string;
	condition: string;
	image: string;
	alt: string;
};

export type SellerCard = {
	name: string;
	reviews: string;
	rating: string;
	description: string;
	image: string;
};

export type TestimonialCard = {
	quote: string;
	author?: string;
	highlight?: boolean;
};

export type FooterGroup = {
	title: string;
	links: LandingNavLink[];
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

export const getFeaturedProducts = (): FeaturedProduct[] => [
	{
		name: m.landing_product_1_name(),
		price: '$45.00',
		condition: m.common_condition_excellent(),
		alt: m.landing_product_1_alt(),
		image:
			'https://lh3.googleusercontent.com/aida-public/AB6AXuCpW16QP41VwtzXAA1bPIY-SAH-RnxxhNZUl8ZCRnB_3SNu6GzGHobwwlewGS92DvXB_Zmg1-DXT7IG8cztPhxNekuybtCT8IuP1fMi1JRjeRGFQhV4CL0uTGwE182vaVfOfCIPqPzL3MUfoNi3uPidB8oYSZFoKJqtEY4uJsiCPW_L5fqfB9vXh1vaHmvTT4mAm63CbCL-FgKRh_hieR0jrtmphVES94j34GhDHXgOzgH63gGGKNoQa6_XGHgQZQ8keYkdp5XmQzw'
	},
	{
		name: m.landing_product_2_name(),
		price: '$12.00',
		condition: m.common_condition_new_with_tags(),
		alt: m.landing_product_2_alt(),
		image:
			'https://lh3.googleusercontent.com/aida-public/AB6AXuBDlo1qU_VXb5k_EfkLfiB234om0ZmCqSrmbbgULfEb-6GYeW6PoqLqHlW35T5cfdzRPxffWSbDfoy_Bulxtb_72n_FH8kbx2brHBwoWj9ObOp8_CWlitOHf0eKQ7C8QMRuAGbYIoaEMJVGkgfOTdLhqXSfBBCvygDq8TCSx-cSZgDkd5ubWSBYmEB0QmWiftq5WG9DgI7usvXbhMcXsDNZvzw40bQo5-k8vZYNQWb3FQ0IfM_WO8RZXm13GP-jEQgmkA2uoyqtjco'
	},
	{
		name: m.landing_product_3_name(),
		price: '$65.00',
		condition: m.common_condition_good(),
		alt: m.landing_product_3_alt(),
		image:
			'https://lh3.googleusercontent.com/aida-public/AB6AXuDPMtzSipu44VcLoGG-c5E4uEgExDSb18MXpIQnYFxoJf0wcCxUpjDEfJrinMbNyUmZLB_jcayEvf0gFwk6YO703-l1t4xpWECf41-GOVVTDTBOKJugCmMBM-_YKdjy6UD7DNHv-5X4-Pbdpg_wIPYdk27LBVuEVdQN7sCmQAXKFbel-xZrCEAgvCMwXZEijpxgt6mRHKm9lvmzsmRyiQQhp2jjhSa9MM99wuugbmvMxOLu3SAqRfVHbDhThn0jn-U6-qB4VBnUlE0'
	},
	{
		name: m.landing_product_4_name(),
		price: '$89.00',
		condition: m.common_condition_like_new(),
		alt: m.landing_product_4_alt(),
		image:
			'https://lh3.googleusercontent.com/aida-public/AB6AXuAYpludCA0yivApQIryQgmpgSnjMQR-mvytgK_HZop5ppEKy__7x5U6OtojtOYLgsY9YRILAzBjzpV3UxD2qn3407zTbM9FN3W2hkXrRp5rCiaxIrzPHG71YGlm_tsyIE8ZApu5aq0IONegAbE2utpZs-ynsxHJZXOVIWe1y9gHm-tQCpA58MIJAFxAB0qIQPzpiiUDSYbla-wfLLlKfB-BZYSubLSv3CCOCvVI1MhlOumdgy7Sl3JWgfb23mqV7Wdngn6netnelNQ'
	}
];

export const getSellerCards = (): SellerCard[] => [
	{
		name: 'Camila Sol',
		rating: '★★★★★',
		reviews: '(142)',
		description: m.landing_seller_1_description(),
		image:
			'https://lh3.googleusercontent.com/aida-public/AB6AXuCi6jv6XjKMPh77qRx0_fFFBHlpMHkamSpwXxnaCUnRHpC_NJoI0jlHtAJYPkTKkdpf1IjLkC2xfM-hGKu9scdNV4_IFmpl6XV5drt4mO0zzIl_Zh5i2Q1bMh4TKbcxklNgKyXTw3nod0W3FXHSYJAYhvoI79ICFAYfhna4l8fdPBuRmxtF6a-5Ioy1b3a2pRPW3ru07VhsPnjAtFRLhjLEr-bGBM5UQwv_O4dOgmGVGREWwt5sIYTPMFAgzKIWf94erKdOSr4pmtw'
	},
	{
		name: 'Valentina Cruz',
		rating: '★★★★★',
		reviews: '(89)',
		description: m.landing_seller_2_description(),
		image:
			'https://lh3.googleusercontent.com/aida-public/AB6AXuCJn1g3ePR0V9w_OGGpkovyaguuSwA_HyllYakhb9kcbiH7d8QkmlZeqaNF1H6LaHSg7mUjhHkBhNCjkvLhbCPo3OTvABaHvw5q95en2bu2N9-fLXoCjHmQPPbSrZLGCsGs9ZOBEMsrQvfG6UE9mpClUWdl1SxLLGvnhkzemFXY8Xqadh1jSMBqf2BbXymMYmyJF7O7yQ_FUqFWiQNy3xUi1zNN8lB6iDz101bMd_jbiEdmlSXhvyJPcwo5s5oQPr-YK_11uPSemDc'
	},
	{
		name: 'Daniela Mar',
		rating: '★★★★☆',
		reviews: '(215)',
		description: m.landing_seller_3_description(),
		image:
			'https://lh3.googleusercontent.com/aida-public/AB6AXuBC3IR7BtIAao-90nIwIWeolgb5bzMUU04Yih2O8VgcLkkFHXovtKm_EHTxUR2P_DyQ_wj_3SI0fjr10OyUQVIyTCu4-QkY6DIR2zjV4rw5Z6amtxs95tgvTVEmtUk5LTmNfKm6p5TBZilf5nLkuxO31ggBV5sBrkSiN_G2YycaSfbA2scSDzQFDQ7RapKmFuQ-fDDNVya1KFK9hUzot9j6CqRRfqkRTBe7Vn-J67ir7HEn39D97xfcfoMyeeUK6VoRX2fIdO7pBzE'
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
			{ label: m.landing_footer_women(), href: '#' },
			{ label: m.landing_footer_men(), href: '#' },
		]
	},
	{
		title: m.landing_footer_company(),
		links: [
			{ label: m.landing_footer_about_us(), href: '#' },
			{ label: m.landing_footer_sustainability(), href: '#' },
			{ label: m.landing_footer_careers(), href: '#' },
			{ label: m.landing_footer_press(), href: '#' }
		]
	},
	{
		title: m.landing_footer_support(),
		links: [
			{ label: m.common_help_center(), href: '#' },
			{ label: m.landing_footer_safety(), href: '#' },
			{ label: m.landing_footer_contact(), href: '#' },
			{ label: m.common_terms_of_service(), href: '#' }
		]
	}
];

export const getSocialLinks = (): LandingNavLink[] => [
	{ label: 'Instagram', href: '#' },
	{ label: 'TikTok', href: '#' },
	{ label: 'Pinterest', href: '#' }
];

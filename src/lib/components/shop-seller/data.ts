import * as m from '$lib/paraglide/messages.js';
import type { Product, Seller } from '$lib/types/database.types';

export type SellerFooterSection = {
	title: string;
	copy: string;
};

export type SellerProfile = {
	id: string;
	slug: string;
	name: string;
	bio: string;
	averageRating: number;
	itemsSoldCount: number;
	reviewCount: number;
	positivePercentage: number;
	avatar: string;
	profileHref: string;
	shopHref: string;
	footerSections: SellerFooterSection[];
};

export type SellerDirectoryEntry = {
	id: string;
	slug: string;
	name: string;
	bio: string;
	avatar: string;
};

export type SellerStoreProduct = {
	id: string;
	sellerId: string;
	sellerSlug: string;
	sellerName: string;
	name: string;
	description: string;
	price: number;
	priceLabel: string;
	image: string;
	images: string[];
	alt: string;
	createdAt: string;
};

export type SellerSortOption = 'recent' | 'price-low' | 'price-high';

export type SellerSortItem = {
	value: SellerSortOption;
	label: string;
};

const PRODUCT_PLACEHOLDER_IMAGE =
	'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';

const FALLBACK_SELLERS: Record<
	string,
	Omit<SellerProfile, 'id' | 'slug' | 'profileHref' | 'shopHref' | 'footerSections'>
> = {
	zonapantys: {
		name: 'Zonapantys',
		bio: m.seller_zonapantys_bio(),
		averageRating: 4.8,
		itemsSoldCount: 1240,
		reviewCount: 482,
		positivePercentage: 99,
		avatar:
			'https://lh3.googleusercontent.com/aida-public/AB6AXuDbaU9nGXBCGAoGsDw_9FtyeJD4wSOgOwEpocTlQU7MXWI9vyEL868cRdjkAwt_zxvTceinAxpkONrM9kADUYqE843M9-H2OqqsEhh9m0KIzd62zvWJOyeLS8k17yKjAmcF40XnZuBVKGDKEL0IIdDFIYUyzTbmPQK_TfJUBtIcAT6j-GZtpjeskdmqeAh02caZoGmCyzQH2Edk62GlfF4nbItlxwpD0x-p6Byrvt_U9bwOWBDeiFQ1ByN0bug5qup_1XB_2ZH3c-g'
	},
	'velvet-vault': {
		name: 'Velvet Vault',
		bio: m.seller_velvet_vault_bio(),
		averageRating: 4.9,
		itemsSoldCount: 830,
		reviewCount: 211,
		positivePercentage: 98,
		avatar:
			'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80'
	}
};

const getBaseFooterSections = (): SellerFooterSection[] => [
	{
		title: m.seller_footer_about_title(),
		copy: m.seller_footer_about_copy()
	},
	{
		title: m.seller_footer_shipping_title(),
		copy: m.seller_footer_shipping_copy()
	},
	{
		title: m.seller_footer_connect_title(),
		copy: m.seller_footer_connect_copy()
	}
];

const toTitleCase = (value: string) =>
	value
		.split('-')
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(' ');

export const formatPrice = (amount: number) => `$${amount.toFixed(2)}`;

export const buildSellerProfileHref = (sellerSlug: string) => `/vendedoras/${sellerSlug}`;

export const buildSellerStoreHref = (sellerSlug: string) =>
	`${buildSellerProfileHref(sellerSlug)}/tienda`;

export const getFallbackSellerProfile = (sellerSlug: string): SellerProfile => {
	const baseSeller = FALLBACK_SELLERS[sellerSlug] ?? {
		name: toTitleCase(sellerSlug),
		bio: m.seller_default_bio(),
		averageRating: 4.7,
		itemsSoldCount: 320,
		reviewCount: 86,
		positivePercentage: 97,
		avatar:
			'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80'
	};

	return {
		id: sellerSlug,
		slug: sellerSlug,
		profileHref: buildSellerProfileHref(sellerSlug),
		shopHref: buildSellerStoreHref(sellerSlug),
		footerSections: getBaseFooterSections(),
		...baseSeller
	};
};

export const buildSellerProfile = (
	seller: Seller | null,
	profileAvatarUrl: string | null,
	identifier: string,
	metrics?: Partial<
		Pick<SellerProfile, 'averageRating' | 'itemsSoldCount' | 'reviewCount' | 'positivePercentage'>
	>
): SellerProfile => {
	if (!seller) {
		return getFallbackSellerProfile(identifier);
	}

	const sellerSlug = seller.store_slug || identifier;
	const fallback = getFallbackSellerProfile(sellerSlug);

	return {
		...fallback,
		id: seller.id,
		slug: sellerSlug,
		name: seller.store_name,
		bio: seller.description ?? fallback.bio,
		averageRating: metrics?.averageRating ?? fallback.averageRating,
		itemsSoldCount: metrics?.itemsSoldCount ?? fallback.itemsSoldCount,
		reviewCount: metrics?.reviewCount ?? fallback.reviewCount,
		positivePercentage: metrics?.positivePercentage ?? fallback.positivePercentage,
		avatar: profileAvatarUrl ?? seller.logo_url ?? fallback.avatar
	};
};

export const mapProductToSellerStoreProduct = (
	product: Product,
	sellerProfile: SellerProfile
): SellerStoreProduct => {
	const images = product.images.filter(Boolean);
	const resolvedImages = images.length > 0 ? images : [PRODUCT_PLACEHOLDER_IMAGE];

	return {
		id: product.id,
		sellerId: product.seller_id,
		sellerSlug: sellerProfile.slug,
		sellerName: sellerProfile.name,
		name: product.name,
		description: product.description?.trim() || m.seller_product_description_fallback(),
		price: product.price,
		priceLabel: formatPrice(product.price),
		image: resolvedImages[0],
		images: resolvedImages,
		alt: product.name,
		createdAt: product.created_at
	};
};

export const getSellerSortOptions = (): SellerSortItem[] => [
	{ value: 'recent', label: m.seller_sort_recent() },
	{ value: 'price-low', label: m.seller_sort_low_high() },
	{ value: 'price-high', label: m.seller_sort_high_low() }
];

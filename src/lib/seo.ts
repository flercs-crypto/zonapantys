import { env } from '$env/dynamic/public';
import { localizeHref, type Locale } from '$lib/paraglide/runtime.js';

export type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

export type SeoMetadata = {
	title: string;
	description: string;
	keywords?: string;
	robots?: string;
	image?: string | null;
	imageAlt?: string;
	schema?: JsonLd;
};

const DEFAULT_SITE_URL = 'https://zonapantys.vercel.app';

export const SITE_NAME = 'ZonaPantys';
export const THEME_COLOR = '#8B1A4A';
export const TWITTER_HANDLE = '@zonapantys';
// TODO: Replace the generated OG placeholder with final brand artwork.
export const DEFAULT_OG_IMAGE_PATH = '/images/og-default.jpg';
export const INDEX_FOLLOW = 'index, follow';
export const NOINDEX_FOLLOW = 'noindex, follow';

export const normalizeSiteUrl = (value?: string | null) =>
	(value?.trim() || DEFAULT_SITE_URL).replace(/\/+$/, '');

export const SITE_URL = normalizeSiteUrl(env.PUBLIC_SITE_URL);

export const buildAbsoluteUrl = (pathOrUrl: string) => {
	if (/^https?:\/\//i.test(pathOrUrl)) {
		return pathOrUrl;
	}

	const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
	return `${SITE_URL}${normalizedPath}`;
};

export const buildLocalizedPath = (path: string, locale: Locale) => {
	const normalizedPath = path.length > 0 ? path : '/';
	return localizeHref(normalizedPath, { locale });
};

export const getOpenGraphLocale = (locale: Locale) => (locale === 'en' ? 'en_US' : 'es_ES');

export const getAlternateOpenGraphLocale = (locale: Locale) =>
	locale === 'en' ? 'es_ES' : 'en_US';

export const normalizeSeoText = (value: string) => value.replace(/\s+/g, ' ').trim();

export const truncateSeoText = (value: string, maxLength = 160) => {
	const normalized = normalizeSeoText(value);

	if (normalized.length <= maxLength) {
		return normalized;
	}

	const truncated = normalized.slice(0, maxLength + 1);
	const lastWhitespace = truncated.lastIndexOf(' ');
	const safeSlice = lastWhitespace > 0 ? truncated.slice(0, lastWhitespace) : truncated.slice(0, maxLength);

	return `${safeSlice.trimEnd()}...`;
};

export const resolveSeoImage = (image?: string | null) =>
	buildAbsoluteUrl(image || DEFAULT_OG_IMAGE_PATH);
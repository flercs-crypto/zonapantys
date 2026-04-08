import { buildAbsoluteUrl, buildLocalizedPath } from '$lib/seo';
import { supabaseAdmin } from '$lib/supabase/server';
import type { RequestHandler } from './$types';

type SitemapRoute = {
	path: string;
	changefreq: 'daily' | 'weekly' | 'monthly';
	priority: number;
	lastmod?: string;
};

const staticRoutes: SitemapRoute[] = [
	{ path: '/', changefreq: 'daily', priority: 1.0 },
	{ path: '/vendedoras', changefreq: 'daily', priority: 0.9 },
	{ path: '/compradores', changefreq: 'monthly', priority: 0.5 },
	{ path: '/autenticidad', changefreq: 'monthly', priority: 0.5 },
	{ path: '/privacidad', changefreq: 'monthly', priority: 0.5 },
	{ path: '/terminos', changefreq: 'monthly', priority: 0.5 },
	{ path: '/ayuda', changefreq: 'monthly', priority: 0.5 },
	{ path: '/pagos-seguros', changefreq: 'monthly', priority: 0.5 },
	{ path: '/envios-discretos', changefreq: 'monthly', priority: 0.5 },
	{ path: '/envios-internacionales', changefreq: 'monthly', priority: 0.5 }
];

const escapeXml = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');

const toIsoDate = (value?: string | null) => {
	if (!value) {
		return new Date().toISOString();
	}

	const parsedDate = new Date(value);
	return Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
};

const renderEntry = ({ path, changefreq, priority, lastmod }: SitemapRoute) => {
	const esHref = buildAbsoluteUrl(buildLocalizedPath(path, 'es'));
	const enHref = buildAbsoluteUrl(buildLocalizedPath(path, 'en'));
	const resolvedLastmod = toIsoDate(lastmod);

	return `
		<url>
			<loc>${escapeXml(esHref)}</loc>
			<xhtml:link rel="alternate" hreflang="es" href="${escapeXml(esHref)}" />
			<xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enHref)}" />
			<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(esHref)}" />
			<lastmod>${escapeXml(resolvedLastmod)}</lastmod>
			<changefreq>${changefreq}</changefreq>
			<priority>${priority.toFixed(1)}</priority>
		</url>`;
};

export const GET: RequestHandler = async () => {
	const { data: sellers } = await supabaseAdmin
		.from('sellers')
		.select('store_slug, updated_at')
		.eq('is_active', true)
		.order('updated_at', { ascending: false });

	const dynamicRoutes: SitemapRoute[] = (sellers ?? []).flatMap((seller) => {
		const slug = seller.store_slug?.trim();

		if (!slug) {
			return [];
		}

		return [
			{
				path: `/vendedoras/${slug}`,
				changefreq: 'weekly',
				priority: 0.8,
				lastmod: seller.updated_at
			},
			{
				path: `/vendedoras/${slug}/tienda`,
				changefreq: 'weekly',
				priority: 0.8,
				lastmod: seller.updated_at
			}
		];
	});

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
	xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
	xmlns:xhtml="http://www.w3.org/1999/xhtml"
>${[...staticRoutes, ...dynamicRoutes].map((route) => renderEntry(route)).join('')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'max-age=0, s-maxage=3600'
		}
	});
};
import { env } from '$env/dynamic/public';

const DEFAULT_APP_URL = 'https://zonapantys.com';

export type EmailOrderItemSummary = {
	name: string;
	quantity: number;
	unitPrice: number;
	total: number;
};

type EmailLayoutOptions = {
	preheader: string;
	title: string;
	intro: string;
	body: string;
	ctaLabel?: string;
	ctaHref?: string;
	footnote?: string;
	secondaryNote?: string;
};

export const APP_URL = (env.PUBLIC_SITE_URL || DEFAULT_APP_URL).replace(/\/+$/, '');
export const BRAND_LOGO_URL = `${APP_URL}/images/logo_zonapantys.png`;

const EMAIL_COLORS = {
	background: '#f5e6d0',
	surface: '#fff8f1',
	card: '#fffdf9',
	text: '#231722',
	muted: '#6d4d56',
	subtle: '#8d6b69',
	border: '#ead8bc',
	brand: '#8b1a4a',
	brandDark: '#6d1239',
	accent: '#c9956a',
	accentSoft: '#f4ece3',
	footer: '#b49083'
} as const;

export const buildAbsoluteUrl = (path: string) => {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${APP_URL}${normalizedPath}`;
};

export const buildOrderNumber = (orderId: string) => `#${orderId.slice(0, 8).toUpperCase()}`;

export const escapeHtml = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');

export const formatCurrency = (amount: number) =>
	new Intl.NumberFormat('es-CL', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 2
	}).format(amount);

export const renderOrderItemsTable = (items: EmailOrderItemSummary[]) => {
	const rows = items
		.map(
			(item) => `
				<tr>
					<td style="padding: 14px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.text}; font-size: 14px; font-weight: 600;">${escapeHtml(item.name)}</td>
					<td style="padding: 14px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.muted}; font-size: 14px; text-align: center;">${item.quantity}</td>
					<td style="padding: 14px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.muted}; font-size: 14px; text-align: right;">${formatCurrency(item.unitPrice)}</td>
					<td style="padding: 14px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.text}; font-size: 14px; font-weight: 700; text-align: right;">${formatCurrency(item.total)}</td>
				</tr>`
		)
		.join('');

	return `
		<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; width: 100%; margin-top: 20px;">
			<thead>
				<tr>
					<th align="left" style="padding-bottom: 12px; color: ${EMAIL_COLORS.subtle}; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">Producto</th>
					<th align="center" style="padding-bottom: 12px; color: ${EMAIL_COLORS.subtle}; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">Cant.</th>
					<th align="right" style="padding-bottom: 12px; color: ${EMAIL_COLORS.subtle}; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">Precio</th>
					<th align="right" style="padding-bottom: 12px; color: ${EMAIL_COLORS.subtle}; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">Subtotal</th>
				</tr>
			</thead>
			<tbody>${rows}</tbody>
		</table>`;
};

export const renderInfoCard = (title: string, content: string) => `
	<div style="margin-top: 20px; border: 1px solid ${EMAIL_COLORS.border}; background: ${EMAIL_COLORS.accentSoft}; border-radius: 18px; padding: 18px 20px;">
		<p style="margin: 0 0 8px; color: ${EMAIL_COLORS.accent}; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(title)}</p>
		<div style="color: ${EMAIL_COLORS.muted}; font-size: 14px; line-height: 1.7;">${content}</div>
	</div>`;

export const renderEmailLayout = ({
	preheader,
	title,
	intro,
	body,
	ctaLabel,
	ctaHref,
	footnote,
	secondaryNote
}: EmailLayoutOptions) => `
	<!doctype html>
	<html lang="es">
		<head>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<title>${escapeHtml(title)}</title>
		</head>
		<body style="margin: 0; padding: 0; background: ${EMAIL_COLORS.background}; color: ${EMAIL_COLORS.text}; font-family: Inter, Arial, sans-serif;">
			<div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(preheader)}</div>
			<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; background: linear-gradient(180deg, ${EMAIL_COLORS.background} 0%, ${EMAIL_COLORS.surface} 38%);">
				<tr>
					<td align="center" style="padding: 32px 16px;">
						<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; width: 100%; border-collapse: collapse; background: ${EMAIL_COLORS.card}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 28px; overflow: hidden; box-shadow: 0 24px 60px rgba(13, 13, 26, 0.12);">
							<tr>
								<td style="padding: 32px 32px 24px; background: linear-gradient(135deg, ${EMAIL_COLORS.brand} 0%, ${EMAIL_COLORS.brandDark} 100%); text-align: center;">
									<img src="${BRAND_LOGO_URL}" alt="ZonaPantys" style="max-width: 200px; width: 100%; height: auto;" />
								</td>
							</tr>
							<tr>
								<td style="padding: 32px;">
									<h1 style="margin: 0 0 14px; color: ${EMAIL_COLORS.text}; font-size: 28px; line-height: 1.2;">${escapeHtml(title)}</h1>
									<p style="margin: 0; color: ${EMAIL_COLORS.muted}; font-size: 16px; line-height: 1.8;">${intro}</p>
									${body}
									${ctaLabel && ctaHref ? `<div style="margin-top: 28px;"><a href="${ctaHref}" style="display: inline-block; border-radius: 14px; background: ${EMAIL_COLORS.brand}; color: ${EMAIL_COLORS.background}; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 22px;">${escapeHtml(ctaLabel)}</a></div>` : ''}
									${secondaryNote ? `<p style="margin: 24px 0 0; color: ${EMAIL_COLORS.subtle}; font-size: 13px; line-height: 1.7;">${secondaryNote}</p>` : ''}
								</td>
							</tr>
							<tr>
								<td style="padding: 0 32px 32px; color: ${EMAIL_COLORS.footer}; font-size: 12px; line-height: 1.7;">
									${footnote ?? 'ZonaPantys protege tu privacidad en cada compra y comunicación transaccional.'}
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</body>
	</html>`;
import {
	buildAbsoluteUrl,
	escapeHtml,
	renderEmailLayout,
	renderInfoCard
} from './shared';

type SellerWelcomeEmailData = {
	sellerName: string;
	storeSlug: string;
	dashboardHref: string;
};

export const buildSellerWelcomeEmail = ({
	sellerName,
	storeSlug,
	dashboardHref
}: SellerWelcomeEmailData) => {
	const storeHref = buildAbsoluteUrl(`/vendedoras/${storeSlug}/tienda`);
	const body = `
		<p style="margin: 24px 0 0; color: #0f172a; font-size: 16px; line-height: 1.8;">Hola ${escapeHtml(sellerName)}, ya eres parte de ZonaPantys como vendedora.</p>
		<div style="margin-top: 22px; border: 1px solid #e2e8f0; background: #ffffff; border-radius: 18px; padding: 22px 24px;">
			<p style="margin: 0 0 14px; color: #0f172a; font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Pasos para comenzar</p>
			<ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 15px; line-height: 1.9;">
				<li>Completa tu perfil y agrega la foto principal de tu tienda.</li>
				<li>Sube tus primeros productos con fotos claras y una buena descripción.</li>
				<li>Comparte tu tienda: <a href="${storeHref}" style="color: #b54913; font-weight: 700; text-decoration: none;">${storeHref}</a>.</li>
				<li>Cuando llegue una venta, prepara el pedido y mantente atenta a las notificaciones del admin.</li>
			</ol>
		</div>
		${renderInfoCard('Consejo', 'Mientras más completo sea tu perfil y mejor presentados estén tus productos, más confianza generas en compradores nuevos.')}`;

	return {
		subject: `🎉 Bienvenida a ZonaPantys, ${sellerName}`,
		html: renderEmailLayout({
			preheader: 'Tu tienda ya está lista para empezar a publicar y vender.',
			title: `Bienvenida a ZonaPantys, ${escapeHtml(sellerName)}`,
			intro: 'Tu cuenta de vendedora quedó activada correctamente. Aquí tienes una guía rápida para arrancar con buen pie.',
			body,
			ctaLabel: 'Ir a mi dashboard seller',
			ctaHref: dashboardHref
		})
	};
};
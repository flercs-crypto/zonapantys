import {
	buildAbsoluteUrl,
	escapeHtml,
	renderEmailLayout,
	renderInfoCard
} from './shared';

type SellerApprovedEmailData = {
	sellerName: string;
	storeSlug: string;
	dashboardHref: string;
};

export const buildSellerApprovedEmail = ({
	sellerName,
	storeSlug,
	dashboardHref
}: SellerApprovedEmailData) => {
	const storeHref = buildAbsoluteUrl(`/vendedoras/${storeSlug}/tienda`);
	const body = `
		<p style="margin: 24px 0 0; color: #231722; font-size: 16px; line-height: 1.8;">Hola ${escapeHtml(sellerName)}, tu perfil fue aprobado y tu tienda ya puede aparecer públicamente en ZonaPantys.</p>
		<div style="margin-top: 22px; border: 1px solid #ead8bc; background: #fffdf9; border-radius: 18px; padding: 22px 24px;">
			<p style="margin: 0 0 14px; color: #231722; font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Pasos para comenzar</p>
			<ol style="margin: 0; padding-left: 20px; color: #6d4d56; font-size: 15px; line-height: 1.9;">
				<li>Completa tu perfil y agrega la foto principal de tu tienda.</li>
				<li>Sube tus primeros productos con fotos claras y una buena descripción.</li>
				<li>Comparte tu tienda: <a href="${storeHref}" style="color: #c9956a; font-weight: 700; text-decoration: none;">${storeHref}</a>.</li>
				<li>Cuando llegue una venta, prepara el pedido y mantente atenta a las notificaciones del admin.</li>
			</ol>
		</div>
		${renderInfoCard('Consejo', 'Mientras más completo sea tu perfil y mejor presentados estén tus productos, más confianza generarás en compradores nuevos.')}`;

	return {
		subject: '🎉 ¡Tu perfil en ZonaPantys fue aprobado!',
		html: renderEmailLayout({
			preheader: 'Tu tienda ya puede empezar a vender y mostrarse públicamente.',
			title: `Tu perfil fue aprobado, ${escapeHtml(sellerName)}`,
			intro: 'Ya puedes vender en ZonaPantys. Aquí tienes una guía rápida para empezar con buen pie.',
			body,
			ctaLabel: 'Ir a mi dashboard seller',
			ctaHref: dashboardHref
		})
	};
};
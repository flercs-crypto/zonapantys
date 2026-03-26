import {
	buildOrderNumber,
	escapeHtml,
	renderEmailLayout,
	renderInfoCard
} from './shared';

type ShippingNotificationEmailData = {
	buyerName: string;
	orderId: string;
	trackingNumber: string;
	shippingProvider: string;
	dashboardHref: string;
};

export const buildShippingNotificationEmail = ({
	buyerName,
	orderId,
	trackingNumber,
	shippingProvider,
	dashboardHref
}: ShippingNotificationEmailData) => {
	const orderNumber = buildOrderNumber(orderId);
	const body = `
		<p style="margin: 24px 0 0; color: #231722; font-size: 16px; line-height: 1.8;">Hola ${escapeHtml(buyerName)}, tu pedido ${escapeHtml(orderNumber)} ya fue despachado y está en camino.</p>
		${renderInfoCard(
			'Tracking',
			`<p style="margin: 0 0 6px;"><strong>Proveedor:</strong> ${escapeHtml(shippingProvider)}</p><p style="margin: 0;"><strong>Número de tracking:</strong> ${escapeHtml(trackingNumber)}</p>`
		)}
		${renderInfoCard('Cómo rastrearlo', 'Usa el número de tracking en el sitio del proveedor de envío para consultar el progreso del paquete.')}
		${renderInfoCard('Privacidad', 'Tu pedido continúa protegido con empaque discreto y sin marcas visibles.')}`;

	return {
		subject: `📦 Tu pedido ${orderNumber} está en camino`,
		html: renderEmailLayout({
			preheader: `Tu pedido ${orderNumber} ya tiene tracking activo.`,
			title: `Tu pedido ${orderNumber} está en camino`,
			intro: 'El despacho fue registrado correctamente y ya puedes seguir el trayecto del paquete.',
			body,
			ctaLabel: 'Ver pedido en mi panel',
			ctaHref: dashboardHref
		})
	};
};
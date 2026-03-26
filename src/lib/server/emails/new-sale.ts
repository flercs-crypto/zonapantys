import {
	buildOrderNumber,
	escapeHtml,
	formatCurrency,
	renderEmailLayout,
	renderInfoCard,
	renderOrderItemsTable,
	type EmailOrderItemSummary
} from './shared';

type NewSaleEmailData = {
	storeName: string;
	orderId: string;
	items: EmailOrderItemSummary[];
	total: number;
	dashboardHref: string;
};

export const buildNewSaleEmail = ({
	storeName,
	orderId,
	items,
	total,
	dashboardHref
}: NewSaleEmailData) => {
	const orderNumber = buildOrderNumber(orderId);
	const body = `
		<p style="margin: 24px 0 0; color: #231722; font-size: 16px; line-height: 1.8;">Hola ${escapeHtml(storeName)}, acabas de recibir una nueva venta en tu tienda.</p>
		${renderOrderItemsTable(items)}
		<div style="margin-top: 18px; text-align: right; color: #231722; font-size: 18px; font-weight: 800;">Monto recibido: ${formatCurrency(total)}</div>
		${renderInfoCard('Siguiente paso', 'Prepara el pedido cuanto antes para mantener una buena experiencia de compra. Cuando el admin registre el envío, el comprador recibirá el tracking automáticamente.')}`;

	return {
		subject: '🛍️ Nueva venta en tu tienda',
		html: renderEmailLayout({
			preheader: `Nueva venta registrada para ${storeName}.`,
			title: `Nueva venta en tu tienda ${escapeHtml(orderNumber)}`,
			intro: 'Te compartimos el detalle de la orden para que puedas preparar el pedido sin demora.',
			body,
			ctaLabel: 'Ver orden en dashboard seller',
			ctaHref: dashboardHref
		})
	};
};
import {
	buildOrderNumber,
	escapeHtml,
	formatCurrency,
	renderEmailLayout,
	renderInfoCard,
	renderOrderItemsTable,
	type EmailOrderItemSummary
} from './shared';

type PurchaseConfirmationEmailData = {
	buyerName: string;
	orderId: string;
	items: EmailOrderItemSummary[];
	total: number;
	dashboardHref: string;
};

export const buildPurchaseConfirmationEmail = ({
	buyerName,
	orderId,
	items,
	total,
	dashboardHref
}: PurchaseConfirmationEmailData) => {
	const orderNumber = buildOrderNumber(orderId);
	const body = `
		<p style="margin: 24px 0 0; color: #0f172a; font-size: 16px; line-height: 1.8;">Hola ${escapeHtml(buyerName)}, recibimos tu compra y ya registramos tu pedido ${escapeHtml(orderNumber)} en ZonaPantys.</p>
		${renderOrderItemsTable(items)}
		<div style="margin-top: 18px; text-align: right; color: #0f172a; font-size: 18px; font-weight: 800;">Total: ${formatCurrency(total)}</div>
		${renderInfoCard('Empaque discreto', 'Tu pedido llegará en empaque sin marcas para proteger tu privacidad en todo momento.')}
		${renderInfoCard('Procesamiento estimado', 'La preparación del pedido suele iniciar dentro de las próximas 24 a 72 horas. Podrás seguir el avance desde tu panel.')}`;

	return {
		subject: `✅ Confirmación de tu pedido ${orderNumber}`,
		html: renderEmailLayout({
			preheader: `Recibimos tu pedido ${orderNumber} y ya está en preparación.`,
			title: `Confirmación de tu pedido ${orderNumber}`,
			intro: 'Gracias por comprar en ZonaPantys. Aquí tienes el resumen de tu orden y los próximos pasos.',
			body,
			ctaLabel: 'Ver estado en mi panel',
			ctaHref: dashboardHref,
			secondaryNote:
				'Si necesitas revisar el estado o los datos de envío, entra a tu dashboard y consulta la sección de compras.'
		})
	};
};
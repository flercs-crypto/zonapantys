import { escapeHtml, renderEmailLayout, renderInfoCard } from './shared';

type SellerRejectedEmailData = {
	sellerName: string;
	rejectionReason: string;
	helpHref: string;
};

export const buildSellerRejectedEmail = ({
	sellerName,
	rejectionReason,
	helpHref
}: SellerRejectedEmailData) => {
	const safeReason = escapeHtml(rejectionReason);
	const body = `
		<p style="margin: 24px 0 0; color: #0f172a; font-size: 16px; line-height: 1.8;">Hola ${escapeHtml(sellerName)}, por ahora no pudimos aprobar tu perfil de vendedora.</p>
		<div style="margin-top: 22px; border: 1px solid #fecaca; background: #fff7f7; border-radius: 18px; padding: 22px 24px;">
			<p style="margin: 0 0 12px; color: #991b1b; font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Motivo informado</p>
			<p style="margin: 0; color: #7f1d1d; font-size: 15px; line-height: 1.8;">${safeReason}</p>
		</div>
		${renderInfoCard('Cómo continuar', `Si quieres aclarar el caso o enviar información adicional, visita nuestro centro de ayuda: <a href="${helpHref}" style="color: #b54913; font-weight: 700; text-decoration: none;">${helpHref}</a>.`)}`;

	return {
		subject: 'Tu perfil en ZonaPantys necesita ajustes',
		html: renderEmailLayout({
			preheader: 'Tu perfil necesita algunos ajustes antes de ser aprobado.',
			title: `Tu perfil necesita ajustes, ${escapeHtml(sellerName)}`,
			intro: 'Queremos mantener la plataforma segura y consistente. Por eso te compartimos el motivo de la revisión para que puedas tomar acción.',
			body,
			ctaLabel: 'Ir a ayuda',
			ctaHref: helpHref
		})
	};
};
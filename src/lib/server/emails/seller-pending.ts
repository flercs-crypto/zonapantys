import { escapeHtml, renderEmailLayout, renderInfoCard } from './shared';

type SellerPendingEmailData = {
	sellerName: string;
	dashboardHref: string;
	helpHref: string;
};

export const buildSellerPendingEmail = ({
	sellerName,
	dashboardHref,
	helpHref
}: SellerPendingEmailData) => {
	const body = `
		<p style="margin: 24px 0 0; color: #231722; font-size: 16px; line-height: 1.8;">Hola ${escapeHtml(sellerName)}, recibimos tu registro de vendedora y tu perfil ya entró en revisión manual.</p>
		<div style="margin-top: 22px; border: 1px solid #ead8bc; background: #fffdf9; border-radius: 18px; padding: 22px 24px;">
			<p style="margin: 0 0 14px; color: #231722; font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Qué sigue ahora</p>
			<ul style="margin: 0; padding-left: 20px; color: #6d4d56; font-size: 15px; line-height: 1.9;">
				<li>Nuestro equipo revisará tu perfil y selfie de verificación.</li>
				<li>El tiempo estimado de respuesta es de 24 a 48 horas.</li>
				<li>Te avisaremos por correo cuando tu perfil sea aprobado o si necesitamos ajustes.</li>
			</ul>
		</div>
		${renderInfoCard(
			'Mientras esperas',
			'Puedes entrar a tu dashboard para preparar la descripción de tu tienda, organizar tu catálogo y dejar listos tus primeros productos.'
		)}
		<p style="margin: 20px 0 0; color: #6d4d56; font-size: 14px; line-height: 1.8;">Si necesitas ayuda, visita nuestro centro de soporte: <a href="${helpHref}" style="color: #c9956a; font-weight: 700; text-decoration: none;">${helpHref}</a>.</p>`;

	return {
		subject: '⏳ Tu perfil en ZonaPantys está siendo revisado',
		html: renderEmailLayout({
			preheader: 'Recibimos tu perfil y nuestro equipo ya está revisándolo.',
			title: `Tu perfil está en revisión, ${escapeHtml(sellerName)}`,
			intro: 'Gracias por registrarte como vendedora en ZonaPantys. Ya puedes avanzar con la preparación de tu tienda mientras validamos tu perfil.',
			body,
			ctaLabel: 'Ir a mi dashboard seller',
			ctaHref: dashboardHref
		})
	};
};
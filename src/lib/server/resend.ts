import { env } from '$env/dynamic/private';
import { Resend } from 'resend';

const DEFAULT_FROM_EMAIL = 'ZonaPantys <onboarding@resend.dev>';

const RESEND_API_KEY = env.RESEND_API_KEY;

export const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

type SendEmailOptions = {
	to: string | string[];
	subject: string;
	html: string;
	from?: string;
};

export const sendEmail = async ({ to, subject, html, from }: SendEmailOptions) => {
	if (!RESEND_API_KEY) {
		console.error('resend-missing-api-key', { subject, to });
		return false;
	}

	try {
		if (!resend) {
			console.error('resend-client-unavailable', { subject, to });
			return false;
		}

		const result = await resend.emails.send({
			from: from ?? DEFAULT_FROM_EMAIL,
			to,
			subject,
			html
		});

		if (result.error) {
			console.error('resend-send-failed', {
				subject,
				to,
				error: result.error
			});
			return false;
		}

		return true;
	} catch (error) {
		console.error('resend-send-exception', {
			subject,
			to,
			error
		});
		return false;
	}
};
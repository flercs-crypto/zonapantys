import * as m from '$lib/paraglide/messages.js';

export type AuthLink = {
	label: string;
	href: string;
};

export const getAuthSupportLinks = (): AuthLink[] => [
	{ label: m.common_privacy_policy(), href: '#' },
	{ label: m.common_terms_of_service(), href: '#' },
	{ label: m.common_help_center(), href: '#' }
];

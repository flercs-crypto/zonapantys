export type SellerCountryOption = {
	code: string;
	name: string;
	dialCode: string;
};

export const SELLER_COUNTRIES: SellerCountryOption[] = [
	{ code: 'AR', name: 'Argentina', dialCode: '+54' },
	{ code: 'AU', name: 'Australia', dialCode: '+61' },
	{ code: 'BO', name: 'Bolivia', dialCode: '+591' },
	{ code: 'BR', name: 'Brasil', dialCode: '+55' },
	{ code: 'CA', name: 'Canada', dialCode: '+1' },
	{ code: 'CL', name: 'Chile', dialCode: '+56' },
	{ code: 'CO', name: 'Colombia', dialCode: '+57' },
	{ code: 'CR', name: 'Costa Rica', dialCode: '+506' },
	{ code: 'DE', name: 'Alemania', dialCode: '+49' },
	{ code: 'DO', name: 'Republica Dominicana', dialCode: '+1' },
	{ code: 'EC', name: 'Ecuador', dialCode: '+593' },
	{ code: 'ES', name: 'Espana', dialCode: '+34' },
	{ code: 'FR', name: 'Francia', dialCode: '+33' },
	{ code: 'GB', name: 'Reino Unido', dialCode: '+44' },
	{ code: 'GT', name: 'Guatemala', dialCode: '+502' },
	{ code: 'HN', name: 'Honduras', dialCode: '+504' },
	{ code: 'IT', name: 'Italia', dialCode: '+39' },
	{ code: 'MX', name: 'Mexico', dialCode: '+52' },
	{ code: 'NI', name: 'Nicaragua', dialCode: '+505' },
	{ code: 'PA', name: 'Panama', dialCode: '+507' },
	{ code: 'PE', name: 'Peru', dialCode: '+51' },
	{ code: 'PY', name: 'Paraguay', dialCode: '+595' },
	{ code: 'SV', name: 'El Salvador', dialCode: '+503' },
	{ code: 'US', name: 'Estados Unidos', dialCode: '+1' },
	{ code: 'UY', name: 'Uruguay', dialCode: '+598' },
	{ code: 'VE', name: 'Venezuela', dialCode: '+58' }
];
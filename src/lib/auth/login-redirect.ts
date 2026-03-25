export const LOGIN_PATH = '/login';
export const CART_REDIRECT_PATH = '/carrito';

export const buildLoginHref = (redirectPath?: string | null) => {
	const safeRedirectPath = getSafeInternalRedirectPath(redirectPath);

	if (!safeRedirectPath) {
		return LOGIN_PATH;
	}

	const searchParams = new URLSearchParams({ redirect: safeRedirectPath });
	return `${LOGIN_PATH}?${searchParams.toString()}`;
};

export const getSafeInternalRedirectPath = (value: string | null | undefined) => {
	if (!value || !value.startsWith('/') || value.startsWith('//')) {
		return null;
	}

	try {
		const url = new URL(value, 'http://zonapantys.local');

		if (url.origin !== 'http://zonapantys.local') {
			return null;
		}

		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return null;
	}
};
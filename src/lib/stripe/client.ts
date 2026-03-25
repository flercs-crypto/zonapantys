import { env } from '$env/dynamic/public';
import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> => {
	if (!env.PUBLIC_STRIPE_PUBLISHABLE_KEY) {
		throw new Error('Missing PUBLIC_STRIPE_PUBLISHABLE_KEY');
	}

	stripePromise ??= loadStripe(env.PUBLIC_STRIPE_PUBLISHABLE_KEY);
	return stripePromise;
};

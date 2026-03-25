import { env } from '$env/dynamic/private';
import Stripe from 'stripe';

export const STRIPE_API_VERSION = '2026-02-25.clover';
export const STRIPE_CURRENCY = 'usd';

if (!env.STRIPE_SECRET_KEY) {
	throw new Error('Missing STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
	apiVersion: STRIPE_API_VERSION,
	typescript: true
});

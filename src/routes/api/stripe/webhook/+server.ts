import { env } from '$env/dynamic/private';
import { stripe } from '$lib/stripe/server';
import { processStripeWebhookEvent } from '$lib/services/stripe-checkout.server';
import { json, type RequestHandler } from '@sveltejs/kit';
import type Stripe from 'stripe';

export const POST: RequestHandler = async ({ request }) => {
	const signature = request.headers.get('stripe-signature');

	if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
		return new Response('Missing webhook configuration', { status: 400 });
	}

	const payload = await request.text();
	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
	} catch {
		return new Response('Invalid webhook signature', { status: 400 });
	}

	try {
		await processStripeWebhookEvent(event);
		return json({ received: true });
	} catch {
		return new Response('Webhook handler failed', { status: 500 });
	}
};

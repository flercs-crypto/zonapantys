<script lang="ts">
	import { get } from 'svelte/store';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import CheckoutActionButton from '$lib/components/checkout/CheckoutActionButton.svelte';
	import CheckoutFooter from '$lib/components/checkout/CheckoutFooter.svelte';
	import CheckoutHeader from '$lib/components/checkout/CheckoutHeader.svelte';
	import OrderSummary from '$lib/components/checkout/OrderSummary.svelte';
	import PaymentForm from '$lib/components/checkout/PaymentForm.svelte';
	import ShippingForm from '$lib/components/checkout/ShippingForm.svelte';
	import {
		getCheckoutFooterLinks,
		getCheckoutItems,
		getCheckoutSummary,
		getTrustSignals
	} from '$lib/components/checkout/data';
	import { authStore } from '$lib/stores/auth.store';
	import { cartStore } from '$lib/stores/cart.store';
	import type { CheckoutCreateRequest, CheckoutCreateResponse, CheckoutShippingDetails } from '$lib/types/checkout';

	let shipping = $state<CheckoutShippingDetails>({
		email: '',
		firstName: '',
		lastName: '',
		address: '',
		city: '',
		state: '',
		zip: ''
	});
	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	const checkoutFooterLinks = $derived.by(() => {
		$currentLocale;
		return getCheckoutFooterLinks();
	});

	const checkoutItems = $derived.by(() => {
		$currentLocale;
		return getCheckoutItems(cartStore.items);
	});

	const checkoutSummary = $derived.by(() => {
		$currentLocale;
		return getCheckoutSummary(cartStore.subtotal);
	});

	const trustSignals = $derived.by(() => {
		$currentLocale;
		return getTrustSignals();
	});

	const canCheckout = $derived(!cartStore.isEmpty && !isSubmitting);

	const updateShipping = (nextShipping: CheckoutShippingDetails) => {
		shipping = nextShipping;
	};

	const readErrorMessage = async (response: Response) => {
		try {
			const payload = (await response.json()) as { message?: string };
			return typeof payload.message === 'string' && payload.message.length > 0
				? payload.message
				: m.checkout_redirect_error();
		} catch {
			return m.checkout_redirect_error();
		}
	};

	const isShippingComplete = () =>
		Object.values(shipping).every((field) => typeof field === 'string' && field.trim().length > 0);

	$effect(() => {
		const email = authStore.currentUser?.email ?? '';

		if (!shipping.email && email) {
			shipping.email = email;
		}
	});

	const handleCheckout = async () => {
		if (!canCheckout) {
			return;
		}

		if (!isShippingComplete()) {
			errorMessage = m.checkout_shipping_required_fields();
			return;
		}

		isSubmitting = true;
		errorMessage = null;

		try {
			const payload: CheckoutCreateRequest = {
				cart: cartStore.items,
				shipping,
				locale: get(currentLocale)
			};

			const response = await fetch('/api/stripe/checkout-session', {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error(await readErrorMessage(response));
			}

			const data = (await response.json()) as CheckoutCreateResponse;
			window.location.assign(data.url);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : m.checkout_redirect_error();
			isSubmitting = false;
		}
	};
</script>

<svelte:head>
	<title>{m.checkout_page_title()}</title>
</svelte:head>

<CheckoutHeader />

<main class="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8" data-locale={$currentLocale}>
	{#if cartStore.isEmpty}
		<section class="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-card">
			<h1 class="text-2xl font-bold text-slate-900">{m.checkout_empty_title()}</h1>
			<p class="mt-3 text-sm text-slate-500">{m.checkout_empty_copy()}</p>
			<a
				class="mt-6 inline-flex rounded-custom bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
				href="/carrito"
			>
				{m.checkout_back_to_cart()}
			</a>
		</section>
	{:else}
		<div class="grid grid-cols-1 gap-12 lg:grid-cols-12">
			<section class="space-y-10 lg:col-span-7">
				<ShippingForm {shipping} disabled={isSubmitting} onChange={updateShipping} />
				<PaymentForm />
				<CheckoutActionButton
					disabled={!canCheckout}
					error={errorMessage}
					loading={isSubmitting}
					onClick={handleCheckout}
					total={checkoutSummary.total}
				/>
			</section>

			<OrderSummary items={checkoutItems} summary={checkoutSummary} {trustSignals} />
		</div>
	{/if}
</main>

<CheckoutFooter links={checkoutFooterLinks} />

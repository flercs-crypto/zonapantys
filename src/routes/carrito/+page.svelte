<script lang="ts">
	import { goto } from '$app/navigation';
	import { buildLoginHref, CART_REDIRECT_PATH } from '$lib/auth/login-redirect';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import CheckoutFooter from '$lib/components/checkout/CheckoutFooter.svelte';
	import CheckoutHeader from '$lib/components/checkout/CheckoutHeader.svelte';
	import { getCheckoutFooterLinks } from '$lib/components/checkout/data';
	import { formatPrice } from '$lib/components/shop-seller/data';
	import { authStore } from '$lib/stores/auth.store';
	import { cartStore } from '$lib/stores/cart.store';

	const checkoutFooterLinks = $derived.by(() => {
		$currentLocale;
		return getCheckoutFooterLinks();
	});

	const groupedItems = $derived(cartStore.groupedItems);
	const subtotalLabel = $derived.by(() => formatPrice(cartStore.subtotal));
	const canCheckout = $derived(!cartStore.isEmpty && !authStore.isLoading);

	const handleCheckout = async () => {
		if (!canCheckout) {
			return;
		}

		if (!authStore.isAuthenticated) {
			await goto(buildLoginHref(CART_REDIRECT_PATH));
			return;
		}

		await goto('/checkout');
	};
</script>

<svelte:head>
	<title>{m.cart_page_title()}</title>
</svelte:head>

<CheckoutHeader />

<main class="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8" data-locale={$currentLocale}>
	<section class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
		<div>
			<p class="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">{m.cart_label()}</p>
			<h1 class="mt-2 text-3xl font-bold text-slate-950">{m.cart_title()}</h1>
			<p class="mt-3 max-w-2xl text-sm text-slate-500">{m.cart_copy()}</p>
		</div>
		{#if !cartStore.isEmpty}
			<button
				class="rounded-custom border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
				onclick={() => cartStore.clear()}
				type="button"
			>
				{m.cart_clear()}
			</button>
		{/if}
	</section>

	{#if cartStore.isEmpty}
		<section class="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-card">
			<h2 class="text-2xl font-bold text-slate-900">{m.cart_empty_title()}</h2>
			<p class="mt-3 text-sm text-slate-500">{m.cart_empty_copy()}</p>
			<a
				class="mt-6 inline-flex rounded-custom bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
				href="/"
			>
				{m.cart_continue_shopping()}
			</a>
		</section>
	{:else}
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
			<section class="space-y-6">
				{#each groupedItems as group (group.sellerId)}
					<div class="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-card">
						<div class="mb-5 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
							<div>
								<p class="text-xs font-semibold tracking-[0.22em] text-slate-400 uppercase">
									{m.cart_seller_label()}
								</p>
								<h2 class="mt-2 text-xl font-semibold text-slate-900">{group.sellerName}</h2>
							</div>
							<a class="text-sm font-semibold text-brand hover:text-brand-dark" href={`/vendedoras/${group.sellerSlug}/tienda`}>
								{m.cart_back_to_store()}
							</a>
						</div>

						<div class="space-y-5">
							{#each group.items as item (item.id)}
								<article class="grid gap-4 rounded-[1.25rem] border border-slate-100 p-4 md:grid-cols-[120px_minmax(0,1fr)]">
									<img alt={item.product.alt} class="h-32 w-full rounded-custom object-cover" src={item.product.image} />
									<div class="space-y-4">
										<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
											<div>
												<h3 class="text-lg font-semibold text-slate-900">{item.product.name}</h3>
												<p class="mt-2 text-sm leading-6 text-slate-500">{item.product.description}</p>
											</div>
											<p class="text-lg font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</p>
										</div>

										<div class="flex flex-wrap items-center gap-3">
											<button class="h-10 w-10 rounded-full border border-slate-200 text-lg text-slate-700 hover:bg-slate-50" onclick={() => cartStore.updateQuantity(item.id, item.quantity - 1)} type="button">-</button>
											<span class="min-w-12 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
											<button class="h-10 w-10 rounded-full border border-slate-200 text-lg text-slate-700 hover:bg-slate-50" onclick={() => cartStore.updateQuantity(item.id, item.quantity + 1)} type="button">+</button>
											<button class="ml-auto text-sm font-semibold text-rose-600 hover:text-rose-700" onclick={() => cartStore.removeItem(item.id)} type="button">
												{m.cart_remove_item()}
											</button>
										</div>

										<div class="space-y-2">
											<label class="block text-sm font-medium text-slate-700" for={`cart-note-${item.id}`}>
												{m.cart_special_note_label()}
											</label>
											<textarea
												class="block min-h-24 w-full rounded-custom border-slate-300 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:ring-brand"
												id={`cart-note-${item.id}`}
												placeholder={m.cart_special_note_placeholder()}
												onchange={(event) => cartStore.updateNote(item.id, (event.currentTarget as HTMLTextAreaElement).value)}
											>{item.note}</textarea>
										</div>
									</div>
								</article>
							{/each}
						</div>
					</div>
				{/each}
			</section>

			<aside class="sticky top-8 h-fit rounded-[1.5rem] border border-slate-100 bg-white p-6 shadow-card">
				<h2 class="text-lg font-semibold text-slate-900">{m.cart_summary_title()}</h2>
				<div class="mt-6 space-y-3 text-sm text-slate-600">
					<div class="flex justify-between">
						<span>{m.cart_items_count({ count: cartStore.totalItems })}</span>
						<span>{subtotalLabel}</span>
					</div>
					<div class="flex justify-between">
						<span>{m.checkout_shipping()}</span>
						<span class="font-medium text-emerald-600">{m.checkout_shipping_free()}</span>
					</div>
					<div class="flex justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
						<span>{m.checkout_subtotal()}</span>
						<span>{subtotalLabel}</span>
					</div>
				</div>

				<button
					class="mt-6 flex w-full items-center justify-center rounded-custom bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
					disabled={!canCheckout}
					onclick={handleCheckout}
					type="button"
				>
					{authStore.isLoading ? m.cart_verifying_session() : m.cart_checkout()}
				</button>
				<p class="mt-3 text-xs leading-6 text-slate-500">
					{m.cart_checkout_hint()}
				</p>
			</aside>
		</div>
	{/if}
</main>

<CheckoutFooter links={checkoutFooterLinks} />

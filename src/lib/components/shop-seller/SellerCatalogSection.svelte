<script lang="ts">
	import { buildLoginHref, CART_REDIRECT_PATH } from '$lib/auth/login-redirect';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { ClientDashboardFeedback } from '$lib/components/dashboard-client/data';
	import { cartStore, type CartProductSnapshot } from '$lib/stores/cart.store';
	import type { SellerProfile, SellerSortOption, SellerStoreProduct } from './data';
	import { getSellerSortOptions } from './data';

	type Props = {
		seller: SellerProfile;
		products: SellerStoreProduct[];
		favoriteProductIds?: string[];
		favoriteFeedback?: ClientDashboardFeedback | null;
		canManageFavorites?: boolean;
		isAuthenticated?: boolean;
	};

	let {
		seller,
		products,
		favoriteProductIds = [],
		favoriteFeedback = null,
		canManageFavorites = false,
		isAuthenticated = false
	}: Props = $props();
	let selectedSort = $state<SellerSortOption>('recent');
	let productNotes = $state<Record<string, string>>({});
	let justAddedProductId = $state<string | null>(null);

	const sellerSortOptions = $derived.by(() => {
		$currentLocale;
		return getSellerSortOptions();
	});

	const sortedProducts = $derived.by(() => {
		const items = [...products];

		if (selectedSort === 'price-low') {
			return items.sort((left, right) => left.price - right.price);
		}

		if (selectedSort === 'price-high') {
			return items.sort((left, right) => right.price - left.price);
		}

		return items.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
	});

	const getCartSnapshot = (product: SellerStoreProduct): CartProductSnapshot => ({
		id: product.id,
		sellerId: product.sellerId,
		sellerSlug: product.sellerSlug,
		sellerName: product.sellerName,
		name: product.name,
		description: product.description,
		image: product.image,
		alt: product.alt,
		price: product.price
	});

	const handleAddToCart = (product: SellerStoreProduct) => {
		cartStore.addItem(getCartSnapshot(product), productNotes[product.id] ?? '');
		productNotes[product.id] = '';
		justAddedProductId = product.id;

		window.setTimeout(() => {
			if (justAddedProductId === product.id) {
				justAddedProductId = null;
			}
		}, 1600);
	};

	const favoriteIdSet = $derived(new Set(favoriteProductIds));
	const loginHref = $derived(
		buildLoginHref(cartStore.totalItems > 0 ? CART_REDIRECT_PATH : null)
	);

	const favoriteLabel = (productId: string) =>
		favoriteIdSet.has(productId)
			? m.dashboard_client_saved_remove()
			: m.dashboard_client_storefront_save();
</script>

<section id="catalog" data-locale={$currentLocale}>
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-xl font-bold text-slate-900">
				{m.seller_catalog_title()} <span class="font-normal text-slate-400">({products.length})</span>
			</h2>
			<p class="mt-2 text-sm text-slate-500">{m.seller_storefront({ sellerId: seller.slug })}</p>
		</div>
		<div class="flex items-center gap-2">
			<label class="text-sm text-slate-500" for="seller-sort">{m.seller_sort_by()}</label>
			<select
				bind:value={selectedSort}
				class="rounded-custom border-slate-300 text-sm focus:border-brand focus:ring-brand"
				id="seller-sort"
			>
				{#each sellerSortOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>
	</div>

	{#if sortedProducts.length === 0}
		<div class="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
			<h3 class="text-lg font-semibold text-slate-900">{m.seller_store_empty_title()}</h3>
			<p class="mt-3 text-sm text-slate-500">{m.seller_store_empty_copy()}</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
			{#each sortedProducts as product (product.id)}
				<article class="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card transition hover:shadow-lg">
					<div class="aspect-4/5 overflow-hidden bg-slate-100">
						<img alt={product.alt} class="h-full w-full object-cover" src={product.image} />
					</div>
					<div class="space-y-4 p-5">
						<div class="space-y-2">
							<div class="flex items-start justify-between gap-4">
								<h3 class="text-lg font-semibold text-slate-900">{product.name}</h3>
								<p class="text-lg font-bold text-slate-900">{product.priceLabel}</p>
							</div>
							<p class="text-sm leading-6 text-slate-500">{product.description}</p>
							{#if favoriteFeedback?.scope === 'storefront' && favoriteFeedback.productId === product.id && favoriteFeedback.message}
								<p class={`text-sm ${favoriteFeedback.success ? 'text-emerald-600' : 'text-red-600'}`}>
									{favoriteFeedback.message}
								</p>
							{/if}
						</div>

						<div class="space-y-2">
							<label class="block text-sm font-medium text-slate-700" for={`notes-${product.id}`}>
								{m.seller_special_requirements_label()}
							</label>
							<textarea
								bind:value={productNotes[product.id]}
								class="block min-h-24 w-full rounded-custom border-slate-300 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:ring-brand"
								id={`notes-${product.id}`}
								placeholder={m.seller_special_requirements_placeholder()}
							></textarea>
						</div>

						<div class="grid gap-3 sm:grid-cols-2">
							<button
								class="flex w-full items-center justify-center rounded-custom bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
								onclick={() => handleAddToCart(product)}
								type="button"
							>
								{justAddedProductId === product.id ? m.seller_added_to_cart() : m.seller_add_to_cart()}
							</button>

							{#if canManageFavorites}
								<form method="POST">
									<input name="intent" type="hidden" value="toggle-favorite" />
									<input name="productId" type="hidden" value={product.id} />
									<button
										class={`flex w-full items-center justify-center rounded-custom px-4 py-3 text-sm font-semibold transition ${favoriteIdSet.has(product.id) ? 'bg-slate-900 text-white hover:bg-slate-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
										type="submit"
									>
										{favoriteLabel(product.id)}
									</button>
								</form>
							{:else if !isAuthenticated}
								<a
									class="flex w-full items-center justify-center rounded-custom border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
									href={loginHref}
								>
									{m.dashboard_client_storefront_save()}
								</a>
							{/if}
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { onDestroy } from 'svelte';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { formatPrice } from '$lib/components/shop-seller/data';
	import type { Product, Seller } from '$lib/types/database.types';

	type Props = {
		seller: Seller;
		initialProducts: Product[];
	};

	type ProductFormState = {
		name: string;
		description: string;
		price: string;
		stock: string;
		imageFile: File | null;
		imagePreview: string;
		existingImage: string;
	};

	type ApiErrorResponse = {
		message?: string;
	};

	const cloneProducts = (items: Product[]) => items.map((item) => item);

	const getApiErrorMessage = async (response: Response, fallback: string) => {
		try {
			const payload = (await response.json()) as ApiErrorResponse;
			return payload.message || fallback;
		} catch {
			return fallback;
		}
	};

	let { seller, initialProducts }: Props = $props();
	let products = $state<Product[]>([]);
	let editingProductId = $state<string | null>(null);
	let isSubmitting = $state(false);
	let deletingProductId = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let imageObjectUrl = $state<string | null>(null);
	let form = $state<ProductFormState>({
		name: '',
		description: '',
		price: '',
		stock: '1',
		imageFile: null,
		imagePreview: '',
		existingImage: ''
	});

	$effect(() => {
		products = cloneProducts(initialProducts);
	});

	const isEditing = $derived(editingProductId !== null);
	const sortedProducts = $derived.by(() =>
		[...products].sort((left, right) => right.created_at.localeCompare(left.created_at))
	);
	const activeProducts = $derived(products.filter((product) => product.is_active && product.stock > 0).length);
	const soldOutProducts = $derived(products.filter((product) => product.stock === 0).length);

	const revokeImageObjectUrl = () => {
		if (imageObjectUrl) {
			URL.revokeObjectURL(imageObjectUrl);
			imageObjectUrl = null;
		}
	};

	onDestroy(() => {
		revokeImageObjectUrl();
	});

	const resetForm = () => {
		revokeImageObjectUrl();
		editingProductId = null;
		form = {
			name: '',
			description: '',
			price: '',
			stock: '1',
			imageFile: null,
			imagePreview: '',
			existingImage: ''
		};
	};

	const startEdit = (product: Product) => {
		editingProductId = product.id;
		errorMessage = null;
		successMessage = null;
		form = {
			name: product.name,
			description: product.description ?? '',
			price: String(product.price),
			stock: String(product.stock),
			imageFile: null,
			imagePreview: product.images[0] ?? '',
			existingImage: product.images[0] ?? ''
		};
	};

	const handleImageChange = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;

		revokeImageObjectUrl();
		form.imageFile = file;
		if (file) {
			imageObjectUrl = URL.createObjectURL(file);
			form.imagePreview = imageObjectUrl;
			return;
		}

		form.imagePreview = form.existingImage;
	};

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		errorMessage = null;
		successMessage = null;

		const name = form.name.trim();
		const description = form.description.trim();
		const price = Number(form.price);
		const stock = Number(form.stock);

		if (!name || Number.isNaN(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
			errorMessage = m.dashboard_seller_form_invalid();
			return;
		}

		if (!form.imageFile && !form.existingImage) {
			errorMessage = m.dashboard_seller_form_image_required();
			return;
		}

		isSubmitting = true;

		try {
			const payload = new FormData();
			payload.set('sellerId', seller.id);
			payload.set('name', name);
			payload.set('description', description);
			payload.set('price', String(price));
			payload.set('stock', String(stock));
			payload.set('existingImageUrl', form.existingImage);

			if (editingProductId) {
				payload.set('productId', editingProductId);
			}

			if (form.imageFile) {
				payload.set('image', form.imageFile);
			}

			const response = await fetch('/api/dashboard/seller/products', {
				method: 'POST',
				body: payload
			});

			if (!response.ok) {
				throw new Error(
					await getApiErrorMessage(response, m.dashboard_seller_product_save_failed())
				);
			}

			const { product } = (await response.json()) as { product: Product };

			if (editingProductId) {
				products = products.map((currentProduct) =>
					currentProduct.id === product.id ? product : currentProduct
				);
				successMessage = m.dashboard_seller_product_updated();
			} else {
				products = [product, ...products];
				successMessage = m.dashboard_seller_product_created();
			}

			resetForm();
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : m.dashboard_seller_product_save_failed();
		} finally {
			isSubmitting = false;
		}
	};

	const handleDelete = async (productId: string) => {
		deletingProductId = productId;
		errorMessage = null;
		successMessage = null;

		try {
			const response = await fetch(`/api/dashboard/seller/products/${productId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error(
					await getApiErrorMessage(response, m.dashboard_seller_product_delete_failed())
				);
			}

			products = products.filter((product) => product.id !== productId);

			if (editingProductId === productId) {
				resetForm();
			}

			successMessage = m.dashboard_seller_product_deleted();
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : m.dashboard_seller_product_delete_failed();
		} finally {
			deletingProductId = null;
		}
	};
</script>

<section class="space-y-8" data-locale={$currentLocale}>
	<div class="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-card lg:p-8">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<p class="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
					{m.dashboard_seller_products_label()}
				</p>
				<h1 class="mt-2 text-3xl font-bold text-slate-950">{seller.store_name}</h1>
				<p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
					{m.dashboard_seller_products_copy()}
				</p>
			</div>
			<a
				class="inline-flex rounded-custom border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
				href={resolve('/vendedoras/[slug]/tienda', { slug: seller.store_slug })}
			>
				{m.dashboard_seller_open_store()}
			</a>
		</div>

		<div class="mt-6 grid gap-4 sm:grid-cols-3">
			<div class="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
				<p class="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
					{m.dashboard_seller_inventory_metric_total()}
				</p>
				<p class="mt-2 text-2xl font-bold text-slate-950">{products.length}</p>
			</div>
			<div class="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
				<p class="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase">
					{m.dashboard_seller_inventory_metric_active()}
				</p>
				<p class="mt-2 text-2xl font-bold text-emerald-900">{activeProducts}</p>
			</div>
			<div class="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
				<p class="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">
					{m.dashboard_seller_inventory_metric_sold_out()}
				</p>
				<p class="mt-2 text-2xl font-bold text-amber-900">{soldOutProducts}</p>
			</div>
		</div>
	</div>

	<div class="grid gap-8 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
		<section class="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
			<div class="mb-6 flex items-center justify-between gap-3">
				<div>
					<h2 class="text-xl font-semibold text-slate-900">
						{isEditing ? m.dashboard_seller_edit_product() : m.dashboard_seller_new_product()}
					</h2>
					<p class="mt-2 text-sm text-slate-500">{m.dashboard_seller_form_copy()}</p>
				</div>
				{#if isEditing}
					<button
						class="text-sm font-semibold text-slate-500 hover:text-slate-700"
						onclick={resetForm}
						type="button"
					>
						{m.dashboard_seller_cancel_edit()}
					</button>
				{/if}
			</div>

			<form class="space-y-4" onsubmit={handleSubmit}>
				<div class="space-y-2">
					<label class="block text-sm font-medium text-slate-700" for="seller-product-image">
						{m.dashboard_seller_product_image()}
					</label>
					<input
						accept="image/*"
						class="block w-full rounded-custom border-slate-300 text-sm focus:border-brand focus:ring-brand"
						id="seller-product-image"
						onchange={handleImageChange}
						type="file"
					/>
					{#if form.imagePreview}
						<img alt={form.name || seller.store_name} class="h-48 w-full rounded-custom object-cover" src={form.imagePreview} />
					{/if}
				</div>

				<div class="space-y-2">
					<label class="block text-sm font-medium text-slate-700" for="seller-product-name">
						{m.dashboard_seller_product_name()}
					</label>
					<input
						bind:value={form.name}
						class="block w-full rounded-custom border-slate-300 px-4 py-3 text-sm focus:border-brand focus:ring-brand"
						id="seller-product-name"
						placeholder={m.dashboard_seller_product_name_placeholder()}
						required
						type="text"
					/>
				</div>

				<div class="space-y-2">
					<label class="block text-sm font-medium text-slate-700" for="seller-product-description">
						{m.dashboard_seller_product_description()}
					</label>
					<textarea
						bind:value={form.description}
						class="block min-h-28 w-full rounded-custom border-slate-300 px-4 py-3 text-sm focus:border-brand focus:ring-brand"
						id="seller-product-description"
						placeholder={m.dashboard_seller_product_description_placeholder()}
					></textarea>
				</div>

				<div class="space-y-2">
					<label class="block text-sm font-medium text-slate-700" for="seller-product-price">
						{m.dashboard_seller_product_price()}
					</label>
					<input
						bind:value={form.price}
						class="block w-full rounded-custom border-slate-300 px-4 py-3 text-sm focus:border-brand focus:ring-brand"
						id="seller-product-price"
						min="0.01"
						placeholder="24.99"
						required
						step="0.01"
						type="number"
					/>
				</div>

				<div class="space-y-2">
					<label class="block text-sm font-medium text-slate-700" for="seller-product-stock">
						{m.dashboard_seller_product_stock()}
					</label>
					<input
						bind:value={form.stock}
						class="block w-full rounded-custom border-slate-300 px-4 py-3 text-sm focus:border-brand focus:ring-brand"
						id="seller-product-stock"
						min="0"
						placeholder="0"
						required
						step="1"
						type="number"
					/>
					<p class="text-xs text-slate-500">{m.dashboard_seller_product_stock_hint()}</p>
				</div>

				{#if errorMessage}
					<p class="rounded-custom border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{errorMessage}
					</p>
				{/if}

				{#if successMessage}
					<p class="rounded-custom border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
						{successMessage}
					</p>
				{/if}

				<button
					class="flex w-full items-center justify-center rounded-custom bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
					disabled={isSubmitting}
					type="submit"
				>
					{#if isSubmitting}
						{m.dashboard_seller_saving_product()}
					{:else if isEditing}
						{m.dashboard_seller_update_product()}
					{:else}
						{m.dashboard_seller_create_product()}
					{/if}
				</button>
			</form>
		</section>

		<section class="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
			<div class="mb-6 flex items-center justify-between gap-3">
				<div>
					<h2 class="text-xl font-semibold text-slate-900">{m.dashboard_seller_inventory_title()}</h2>
					<p class="mt-2 text-sm text-slate-500">
						{m.dashboard_seller_inventory_count({ count: products.length })}
					</p>
				</div>
			</div>

			{#if sortedProducts.length === 0}
				<div class="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
					<h3 class="text-lg font-semibold text-slate-900">{m.dashboard_seller_inventory_empty_title()}</h3>
					<p class="mt-3 text-sm text-slate-500">{m.dashboard_seller_inventory_empty_copy()}</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each sortedProducts as product (product.id)}
						<article class="grid gap-4 rounded-[1.25rem] border border-slate-100 p-4 lg:grid-cols-[120px_minmax(0,1fr)]">
							<img alt={product.name} class="h-32 w-full rounded-custom object-cover" src={product.images[0] ?? ''} />
							<div class="space-y-3">
								<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
									<div>
										<h3 class="text-lg font-semibold text-slate-900">{product.name}</h3>
										<p class="mt-2 text-sm leading-6 text-slate-500">{product.description}</p>
									</div>
									<p class="text-lg font-bold text-slate-900">{formatPrice(product.price)}</p>
								</div>
								<div class="flex flex-wrap items-center gap-3">
									{#if product.stock === 0}
										<span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-amber-800 uppercase">
											{m.dashboard_seller_status_sold_out()}
										</span>
									{:else if product.is_active}
										<span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-emerald-800 uppercase">
											{m.dashboard_seller_status_active()}
										</span>
									{:else}
										<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
											{m.dashboard_seller_status_hidden()}
										</span>
									{/if}
									<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
										{m.dashboard_seller_product_stock_badge({ stock: product.stock })}
									</span>
									<button class="rounded-custom border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onclick={() => startEdit(product)} type="button">
										{m.dashboard_seller_edit_product()}
									</button>
									<button class="rounded-custom border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60" disabled={deletingProductId === product.id} onclick={() => handleDelete(product.id)} type="button">
										{deletingProductId === product.id ? m.dashboard_seller_deleting_product() : m.dashboard_seller_delete_product()}
									</button>
								</div>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</section>

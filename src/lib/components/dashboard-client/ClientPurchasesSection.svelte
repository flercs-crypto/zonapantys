<script lang="ts">
	import { resolve } from '$app/paths';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages/_index.js';
	import {
		buildClientDashboardHref,
		type ClientDashboardFeedback,
		type ClientPurchasesPage
	} from './data';

	type Props = {
		ordersPage: ClientPurchasesPage;
		feedback?: ClientDashboardFeedback | null;
	};

	type ReviewDialogItem = {
		orderId: string;
		productId: string;
		productName: string;
		image: string;
	};

	let { ordersPage, feedback = null }: Props = $props();
	let reviewDialog = $state<HTMLDialogElement | null>(null);
	let selectedReviewItem = $state<ReviewDialogItem | null>(null);
	let selectedRating = $state(5);
	let reviewComment = $state('');
	const reviewMessages = m as typeof m & {
		dashboard_client_purchase_review_cta: () => string;
		dashboard_client_purchase_reviewed: () => string;
		dashboard_client_purchase_review_modal_title: () => string;
		dashboard_client_purchase_review_modal_copy: () => string;
		dashboard_client_purchase_review_rating_label: () => string;
		dashboard_client_purchase_review_comment_label: () => string;
		dashboard_client_purchase_review_comment_placeholder: () => string;
		dashboard_client_purchase_review_submit: () => string;
	};

	const currencyFormatter = $derived.by(
		() =>
			new Intl.NumberFormat($currentLocale, {
				style: 'currency',
				currency: 'USD'
			})
	);

	const dateFormatter = $derived.by(
		() =>
			new Intl.DateTimeFormat($currentLocale, {
				dateStyle: 'medium'
			})
	);

	const statusClass = (status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled') => {
		switch (status) {
			case 'processing':
				return 'bg-blue-50 text-blue-700';
			case 'shipped':
				return 'bg-violet-50 text-violet-700';
			case 'completed':
				return 'bg-emerald-50 text-emerald-700';
			case 'cancelled':
				return 'bg-red-50 text-red-700';
			default:
				return 'bg-amber-50 text-amber-700';
		}
	};

	const statusLabel = (status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled') => {
		switch (status) {
			case 'processing':
				return m.dashboard_client_purchase_status_processing();
			case 'shipped':
				return m.dashboard_client_purchase_status_shipped();
			case 'completed':
				return m.dashboard_client_purchase_status_completed();
			case 'cancelled':
				return m.dashboard_client_purchase_status_cancelled();
			default:
				return m.dashboard_client_purchase_status_pending();
		}
	};

	const openReviewDialog = (
		orderId: string,
		product: ClientPurchasesPage['items'][number]['products'][number]
	) => {
		if (!product.productId) {
			return;
		}

		selectedReviewItem = {
			orderId,
			productId: product.productId,
			productName: product.productName,
			image: product.image
		};
		selectedRating = 5;
		reviewComment = '';
		reviewDialog?.showModal();
	};

	const closeReviewDialog = () => {
		reviewDialog?.close();
	};

	const handleReviewDialogClose = () => {
		selectedReviewItem = null;
		selectedRating = 5;
		reviewComment = '';
	};

	const getReviewFeedback = (productId: string | null) => {
		if (!productId) {
			return null;
		}

		if (feedback?.intent !== 'create-review' || feedback.productId !== productId || !feedback.message) {
			return null;
		}

		return feedback;
	};
</script>

<section class="space-y-6" data-locale={$currentLocale}>
	<div class="rounded-3xl bg-white p-6 shadow-card">
		<p class="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
			{m.dashboard_client_purchases_section_kicker()}
		</p>
		<h1 class="mt-2 text-3xl font-bold text-slate-900">{m.dashboard_client_purchases_title()}</h1>
		<p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
			{m.dashboard_client_purchases_copy()}
		</p>
	</div>

	{#if ordersPage.items.length === 0}
		<div class="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center shadow-card">
			<h2 class="text-xl font-semibold text-slate-900">{m.dashboard_client_purchases_empty_title()}</h2>
			<p class="mt-3 text-sm text-slate-500">{m.dashboard_client_purchases_empty_copy()}</p>
			<a
				class="mt-6 inline-flex rounded-custom bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
				href={resolve('/vendedoras')}
			>
				{m.dashboard_client_purchases_empty_cta()}
			</a>
		</div>
	{:else}
		<div class="space-y-4">
			{#each ordersPage.items as order (order.id)}
				<article class="rounded-3xl bg-white p-6 shadow-card">
					<div class="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
						<div>
							<p class="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
								{m.dashboard_client_purchases_order_label()}
							</p>
							<h2 class="mt-2 text-xl font-semibold text-slate-900">{order.orderNumber}</h2>
							<p class="mt-2 text-sm text-slate-500">
								{dateFormatter.format(new Date(order.createdAt))}
							</p>
						</div>

						<div class="flex flex-col items-start gap-3 md:items-end">
							<span class={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.status)}`}>
								{statusLabel(order.status)}
							</span>
							<p class="text-lg font-bold text-slate-900">{currencyFormatter.format(order.total)}</p>
						</div>
					</div>

					<ul class="mt-5 space-y-4">
						{#each order.products as product, index (`${order.id}-${product.productId ?? index}`)}
							<li class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div class="flex min-w-0 items-center gap-4">
									<img
										alt={product.productName}
										class="h-16 w-16 rounded-2xl object-cover"
										src={product.image}
									/>
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-semibold text-slate-900">{product.productName}</p>
										<p class="mt-1 text-xs text-slate-500">
											{m.dashboard_client_purchase_item_meta({
												quantity: product.quantity,
												price: currencyFormatter.format(product.unitPrice)
											})}
										</p>
										{#if getReviewFeedback(product.productId)}
											<p class={`mt-2 text-xs ${getReviewFeedback(product.productId)?.success ? 'text-emerald-600' : 'text-rose-600'}`}>
												{getReviewFeedback(product.productId)?.message}
											</p>
										{/if}
									</div>
								</div>

								<div class="flex flex-col items-start gap-2 sm:items-end">
									<p class="text-sm font-semibold text-slate-700">
										{currencyFormatter.format(product.total)}
									</p>
									{#if product.reviewStatus === 'pending'}
										<button
											class="rounded-custom border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
											onclick={() => openReviewDialog(order.id, product)}
											type="button"
										>
											{reviewMessages.dashboard_client_purchase_review_cta()}
										</button>
									{:else if product.reviewStatus === 'reviewed'}
										<span class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
											<svg aria-hidden="true" class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
											</svg>
											{reviewMessages.dashboard_client_purchase_reviewed()}
										</span>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>

		{#if ordersPage.totalPages > 1}
			<nav class="flex items-center justify-between rounded-[1.25rem] bg-white px-5 py-4 shadow-card">
				<a
					aria-disabled={ordersPage.page <= 1}
					class={`rounded-custom px-4 py-2 text-sm font-semibold ${ordersPage.page <= 1 ? 'pointer-events-none text-slate-300' : 'text-brand hover:bg-brand/5'}`}
					href={buildClientDashboardHref('purchases', ordersPage.page - 1)}
				>
					{m.dashboard_client_pagination_previous()}
				</a>
				<p class="text-sm text-slate-500">
					{m.dashboard_client_pagination_summary({
						page: ordersPage.page,
						totalPages: ordersPage.totalPages
					})}
				</p>
				<a
					aria-disabled={ordersPage.page >= ordersPage.totalPages}
					class={`rounded-custom px-4 py-2 text-sm font-semibold ${ordersPage.page >= ordersPage.totalPages ? 'pointer-events-none text-slate-300' : 'text-brand hover:bg-brand/5'}`}
					href={buildClientDashboardHref('purchases', ordersPage.page + 1)}
				>
					{m.dashboard_client_pagination_next()}
				</a>
			</nav>
		{/if}
	{/if}

	<dialog
		bind:this={reviewDialog}
		class="backdrop:bg-slate-950/45 mx-auto w-full max-w-lg rounded-3xl border border-slate-200 p-0 shadow-2xl"
		onclose={handleReviewDialogClose}
	>
		{#if selectedReviewItem}
			<form class="p-6" method="POST">
				<input name="intent" type="hidden" value="create-review" />
				<input name="scope" type="hidden" value="purchases" />
				<input name="orderId" type="hidden" value={selectedReviewItem.orderId} />
				<input name="productId" type="hidden" value={selectedReviewItem.productId} />
				<input name="rating" type="hidden" value={selectedRating} />
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
							{reviewMessages.dashboard_client_purchase_review_modal_title()}
						</p>
						<h3 class="mt-2 text-xl font-semibold text-slate-900">{selectedReviewItem.productName}</h3>
						<p class="mt-2 text-sm text-slate-500">
							{reviewMessages.dashboard_client_purchase_review_modal_copy()}
						</p>
					</div>
					<button
						class="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600"
						onclick={closeReviewDialog}
						type="button"
					>
						{m.common_close()}
					</button>
				</div>

				<div class="mt-6 flex items-center gap-4 rounded-[1.25rem] bg-slate-50 p-4">
					<img
						alt={selectedReviewItem.productName}
						class="h-20 w-20 rounded-2xl object-cover"
						src={selectedReviewItem.image}
					/>
					<div>
						<p class="text-sm font-semibold text-slate-900">{selectedReviewItem.productName}</p>
						<p class="mt-1 text-sm text-slate-500">{reviewMessages.dashboard_client_purchase_review_rating_label()}</p>
					</div>
				</div>

				<div class="mt-6 space-y-5">
					<div>
						<p class="mb-3 text-sm font-medium text-slate-700">{reviewMessages.dashboard_client_purchase_review_rating_label()}</p>
						<div class="flex items-center gap-2">
							{#each [1, 2, 3, 4, 5] as star (star)}
								<button
									aria-label={`Rate ${star} stars`}
									class="rounded-full p-1 transition hover:scale-105"
									onclick={() => (selectedRating = star)}
									type="button"
								>
									<svg
										class={star <= selectedRating ? 'h-8 w-8 fill-amber-400 text-amber-400' : 'h-8 w-8 fill-slate-200 text-slate-200'}
										viewBox="0 0 20 20"
									>
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z"></path>
									</svg>
								</button>
							{/each}
						</div>
					</div>

					<label class="grid gap-2 text-sm font-medium text-slate-700">
						<span>{reviewMessages.dashboard_client_purchase_review_comment_label()}</span>
						<textarea
							bind:value={reviewComment}
							class="min-h-32 rounded-custom border border-slate-200 px-4 py-3 text-sm text-slate-800"
							maxlength="1200"
							name="comment"
							placeholder={reviewMessages.dashboard_client_purchase_review_comment_placeholder()}
						></textarea>
					</label>
				</div>

				<div class="mt-6 flex items-center justify-end gap-3">
					<button
						class="rounded-custom bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
						onclick={closeReviewDialog}
						type="button"
					>
						{m.common_cancel()}
					</button>
					<button class="rounded-custom bg-brand px-4 py-3 text-sm font-semibold text-white" type="submit">
						{reviewMessages.dashboard_client_purchase_review_submit()}
					</button>
				</div>
			</form>
		{/if}
	</dialog>
</section>
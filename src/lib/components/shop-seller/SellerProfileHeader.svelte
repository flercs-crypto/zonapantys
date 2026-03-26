<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { SellerProfile } from './data';

	type Props = {
		sellerSlug: string;
		seller: SellerProfile;
		buttonHref?: string;
		buttonLabel?: string;
	};

	let { sellerSlug, seller, buttonHref, buttonLabel }: Props = $props();

	const countFormatter = $derived.by(
		() =>
			new Intl.NumberFormat($currentLocale, {
				maximumFractionDigits: 0
			})
	);

	const ratingFormatter = $derived.by(
		() =>
			new Intl.NumberFormat($currentLocale, {
				minimumFractionDigits: 1,
				maximumFractionDigits: 1
			})
	);

	const percentFormatter = $derived.by(
		() =>
			new Intl.NumberFormat($currentLocale, {
				style: 'percent',
				maximumFractionDigits: 0
			})
	);

	const filledStars = $derived(Math.max(0, Math.min(5, Math.round(seller.averageRating))));
	const resolvedButtonHref = $derived(buttonHref ?? seller.shopHref);
	const resolvedButtonLabel = $derived(buttonLabel ?? m.seller_view_store());
</script>

<header
	class="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-card md:p-8"
	id="seller-details"
	data-locale={$currentLocale}
>
	<div class="flex flex-col items-center gap-8 md:flex-row md:items-start">
		<div class="relative">
			<img
				alt={seller.name}
				class="h-32 w-32 rounded-full border-4 border-white object-cover shadow-md"
				src={seller.avatar}
			/>
			<div
				class="absolute right-1 bottom-1 h-5 w-5 rounded-full border-2 border-white bg-green-500"
				title={m.seller_online_now()}
			></div>
		</div>

		<div class="flex-1 text-center md:text-left">
			<div class="mb-2 flex flex-col gap-2 md:flex-row md:items-center">
				<h1 class="text-2xl font-bold text-slate-900">{seller.name}</h1>
				<div class="flex items-center justify-center gap-1 text-orange-400 md:justify-start">
					{#each [0, 1, 2, 3, 4] as index (index)}
						<svg
							class={index < filledStars ? 'h-5 w-5 fill-current' : 'h-5 w-5 fill-current opacity-30'}
							viewBox="0 0 20 20"
						>
							<path
								d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z"
							></path>
						</svg>
					{/each}
					<span class="ml-1 text-sm font-semibold text-slate-600">
						({ratingFormatter.format(seller.averageRating)})
					</span>
				</div>
			</div>
			<p class="mb-6 max-w-2xl leading-7 text-slate-600">{seller.bio}</p>
			<p class="mb-6 text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
				{m.seller_id_label({ sellerId: sellerSlug })}
			</p>

			<div class="flex flex-wrap justify-center gap-8 md:justify-start">
				<div>
					<span class="block text-2xl font-bold text-slate-900">{countFormatter.format(seller.itemsSoldCount)}</span><span
						class="text-sm tracking-wider text-slate-500 uppercase">{m.seller_items_sold()}</span
					>
				</div>
				<div>
					<span class="block text-2xl font-bold text-slate-900">{countFormatter.format(seller.reviewCount)}</span><span
						class="text-sm tracking-wider text-slate-500 uppercase">{m.seller_reviews()}</span
					>
				</div>
				<div>
					<span class="block text-2xl font-bold text-slate-900">{percentFormatter.format(seller.positivePercentage / 100)}</span><span
						class="text-sm tracking-wider text-slate-500 uppercase">{m.seller_positive()}</span
					>
				</div>
			</div>
		</div>

		<div class="flex w-full flex-col gap-3 md:w-auto">
			<a
				class="rounded-custom border border-slate-300 px-8 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
				href={resolvedButtonHref}
			>
				{resolvedButtonLabel}
			</a>
		</div>
	</div>
</header>

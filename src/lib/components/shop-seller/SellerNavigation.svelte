<script lang="ts">
	import BrandLogoLink from '$lib/components/brand/BrandLogoLink.svelte';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import CartButton from '$lib/components/cart/CartButton.svelte';
</script>

<nav
	class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"
	data-locale={$currentLocale}
>
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<BrandLogoLink rootClass="inline-flex items-center" imageClass="h-20 w-auto" title="" />

		<div class="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
			<a class="hover:text-brand" href="#catalog">{m.seller_nav_categories()}</a>
			<a class="hover:text-brand" href="#seller-details">{m.seller_nav_about()}</a>
		</div>

		<div class="flex items-center gap-4">
			<button
				aria-label={m.seller_search_products()}
				class="p-2 text-slate-400 hover:text-slate-500"
				type="button"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
					></path>
				</svg>
			</button>
			<CartButton />
		</div>
	</div>
</nav>

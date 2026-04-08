<script lang="ts">
	import BrandLogoLink from '$lib/components/brand/BrandLogoLink.svelte';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import CartButton from '$lib/components/cart/CartButton.svelte';
</script>

<header class="mb-8 border-b border-slate-200 bg-white py-4" data-locale={$currentLocale}>
	<div class="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<BrandLogoLink rootClass="inline-flex items-center" imageClass="h-20 w-auto" title="" />
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-2 text-sm text-slate-500">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
					></path>
				</svg>
				{m.checkout_secure()}
			</div>
			<CartButton />
		</div>
	</div>
</header>

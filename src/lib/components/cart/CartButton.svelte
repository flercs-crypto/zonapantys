<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { cartStore } from '$lib/stores/cart.store';

	type Props = {
		class?: string;
	};

	let { class: className = '' }: Props = $props();
</script>

<a
	aria-label={m.cart_open_with_count({ count: cartStore.totalItems })}
	class={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-brand hover:text-brand ${className}`}
	data-locale={$currentLocale}
	href="/carrito"
>
	<svg aria-hidden="true" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9Z"
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
		></path>
	</svg>

	{#if cartStore.totalItems > 0}
		<span
			class="absolute -top-1 -right-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white"
		>
			{cartStore.totalItems}
		</span>
	{/if}
</a>

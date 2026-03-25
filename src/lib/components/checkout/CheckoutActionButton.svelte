<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';

	type Props = {
		total: string;
		disabled?: boolean;
		loading?: boolean;
		error?: string | null;
		onClick?: () => void;
	};

	let { total, disabled = false, loading = false, error = null, onClick }: Props = $props();
</script>

<div class="pt-4" data-locale={$currentLocale}>
	<button
		class="flex w-full items-center justify-center gap-2 rounded-custom bg-brand py-4 text-base font-bold text-white shadow-card transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
		disabled={disabled}
		onclick={() => onClick?.()}
		type="button"
	>
		{loading ? m.checkout_redirecting() : m.checkout_pay_with_stripe()}
		<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
			<path
				clip-rule="evenodd"
				d="M12.293 5.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414-1.414L14.586 11H3a1 1 0 1 1 0-2h11.586l-2.293-2.293a1 1 0 0 1 0-1.414Z"
				fill-rule="evenodd"
			></path>
		</svg>
	</button>
	{#if error}
		<p class="mt-4 rounded-custom border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
			{error}
		</p>
	{/if}
	<p class="mt-4 text-center text-sm text-slate-500">{m.checkout_disclaimer({ total })}</p>
</div>

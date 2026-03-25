<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
</script>

<section
	class="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-card"
	data-locale={$currentLocale}
>
	<h2 class="mb-6 flex items-center gap-3 text-lg font-semibold text-slate-900">
		<span class="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm text-white"
			>2</span
		>
		{m.checkout_payment_title()}
	</h2>

	<div class="space-y-4 rounded-custom border border-brand/20 bg-brand-light/40 p-4">
		<div class="flex items-center justify-between gap-4">
			<div>
				<p class="text-sm font-semibold text-slate-900">{m.checkout_pay_with_stripe()}</p>
				<p class="mt-1 text-sm text-slate-600">{m.checkout_payment_redirect_copy()}</p>
			</div>
			<span class="rounded-full bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-brand uppercase">
				Stripe
			</span>
		</div>

		<div class="rounded-custom border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
			{m.checkout_payment_secure()}
		</div>
	</div>
</section>

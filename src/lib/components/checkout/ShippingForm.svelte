<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { CheckoutShippingDetails } from '$lib/types/checkout';

	type Props = {
		shipping: CheckoutShippingDetails;
		disabled?: boolean;
		onChange?: (shipping: CheckoutShippingDetails) => void;
	};

	let { shipping, disabled = false, onChange }: Props = $props();

	const updateField = (field: keyof CheckoutShippingDetails, value: string) => {
		onChange?.({
			...shipping,
			[field]: value
		});
	};
</script>

<section
	class="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-card"
	data-locale={$currentLocale}
>
	<h2 class="mb-6 flex items-center gap-3 text-lg font-semibold text-slate-900">
		<span class="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm text-white"
			>1</span
		>
		{m.checkout_shipping_title()}
	</h2>

	<form class="grid grid-cols-1 gap-4 md:grid-cols-2" onsubmit={(event) => event.preventDefault()}>
		<div class="md:col-span-2">
			<label class="mb-1 block text-sm font-medium text-slate-700" for="checkout-email"
				>{m.common_email_address()}</label
			>
			<input
				class="w-full rounded-custom border-slate-300 focus:border-brand focus:ring-brand"
				disabled={disabled}
				id="checkout-email"
				oninput={(event) => updateField('email', (event.currentTarget as HTMLInputElement).value)}
				placeholder={m.auth_placeholder_email()}
				type="email"
				value={shipping.email}
			/>
		</div>

		<div>
			<label class="mb-1 block text-sm font-medium text-slate-700" for="checkout-first-name"
				>{m.checkout_first_name()}</label
			>
			<input
				class="w-full rounded-custom border-slate-300 focus:border-brand focus:ring-brand"
				disabled={disabled}
				id="checkout-first-name"
				oninput={(event) => updateField('firstName', (event.currentTarget as HTMLInputElement).value)}
				type="text"
				value={shipping.firstName}
			/>
		</div>

		<div>
			<label class="mb-1 block text-sm font-medium text-slate-700" for="checkout-last-name"
				>{m.checkout_last_name()}</label
			>
			<input
				class="w-full rounded-custom border-slate-300 focus:border-brand focus:ring-brand"
				disabled={disabled}
				id="checkout-last-name"
				oninput={(event) => updateField('lastName', (event.currentTarget as HTMLInputElement).value)}
				type="text"
				value={shipping.lastName}
			/>
		</div>

		<div class="md:col-span-2">
			<label class="mb-1 block text-sm font-medium text-slate-700" for="checkout-address"
				>{m.checkout_street_address()}</label
			>
			<input
				class="w-full rounded-custom border-slate-300 focus:border-brand focus:ring-brand"
				disabled={disabled}
				id="checkout-address"
				oninput={(event) => updateField('address', (event.currentTarget as HTMLInputElement).value)}
				type="text"
				value={shipping.address}
			/>
		</div>

		<div>
			<label class="mb-1 block text-sm font-medium text-slate-700" for="checkout-city"
				>{m.checkout_city()}</label
			>
			<input
				class="w-full rounded-custom border-slate-300 focus:border-brand focus:ring-brand"
				disabled={disabled}
				id="checkout-city"
				oninput={(event) => updateField('city', (event.currentTarget as HTMLInputElement).value)}
				type="text"
				value={shipping.city}
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="mb-1 block text-sm font-medium text-slate-700" for="checkout-state"
					>{m.checkout_state()}</label
				>
				<input
					class="w-full rounded-custom border-slate-300 focus:border-brand focus:ring-brand"
					disabled={disabled}
					id="checkout-state"
					oninput={(event) => updateField('state', (event.currentTarget as HTMLInputElement).value)}
					type="text"
					value={shipping.state}
				/>
			</div>

			<div>
				<label class="mb-1 block text-sm font-medium text-slate-700" for="checkout-zip"
					>{m.checkout_zip_code()}</label
				>
				<input
					class="w-full rounded-custom border-slate-300 focus:border-brand focus:ring-brand"
					disabled={disabled}
					id="checkout-zip"
					oninput={(event) => updateField('zip', (event.currentTarget as HTMLInputElement).value)}
					type="text"
					value={shipping.zip}
				/>
			</div>
		</div>
	</form>
</section>

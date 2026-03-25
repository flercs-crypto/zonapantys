<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';

	let form = $state({
		fullName: '',
		email: '',
		password: '',
		confirmPassword: '',
		wantsToSell: false,
		acceptsTerms: false
	});

	const handleSubmit = (event: SubmitEvent) => {
		event.preventDefault();
	};
</script>

<section
	class="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-card"
	data-locale={$currentLocale}
>
	<form class="space-y-5" onsubmit={handleSubmit}>
		<div>
			<label class="block text-sm font-medium text-slate-700" for="full-name"
				>{m.auth_full_name()}</label
			>
			<input
				bind:value={form.fullName}
				class="mt-1 block w-full rounded-custom border-slate-300 bg-white px-4 py-2.5 focus:border-brand focus:ring-brand"
				id="full-name"
				placeholder={m.auth_placeholder_full_name()}
				required
				type="text"
			/>
		</div>

		<div>
			<label class="block text-sm font-medium text-slate-700" for="register-email"
				>{m.common_email_address()}</label
			>
			<input
				bind:value={form.email}
				class="mt-1 block w-full rounded-custom border-slate-300 bg-white px-4 py-2.5 focus:border-brand focus:ring-brand"
				id="register-email"
				placeholder={m.auth_placeholder_email()}
				required
				type="email"
			/>
		</div>

		<div>
			<label class="block text-sm font-medium text-slate-700" for="register-password"
				>{m.common_password()}</label
			>
			<input
				bind:value={form.password}
				class="mt-1 block w-full rounded-custom border-slate-300 bg-white px-4 py-2.5 focus:border-brand focus:ring-brand"
				id="register-password"
				placeholder="••••••••"
				required
				type="password"
			/>
		</div>

		<div>
			<label class="block text-sm font-medium text-slate-700" for="confirm-password"
				>{m.common_confirm_password()}</label
			>
			<input
				bind:value={form.confirmPassword}
				class="mt-1 block w-full rounded-custom border-slate-300 bg-white px-4 py-2.5 focus:border-brand focus:ring-brand"
				id="confirm-password"
				placeholder="••••••••"
				required
				type="password"
			/>
		</div>

		<div class="space-y-3 pt-2">
			<label class="flex items-start gap-3 text-sm text-slate-600">
				<input
					bind:checked={form.wantsToSell}
					class="mt-1 rounded border-slate-300 text-brand focus:ring-brand"
					type="checkbox"
				/>
				<span>
					<span class="block font-medium text-slate-700">{m.auth_wants_to_sell_title()}</span>
					<span>{m.auth_wants_to_sell_copy()}</span>
				</span>
			</label>

			<label class="flex items-start gap-3 text-sm text-slate-600">
				<input
					bind:checked={form.acceptsTerms}
					class="mt-1 rounded border-slate-300 text-brand focus:ring-brand"
					required
					type="checkbox"
				/>
				<span>
					<span class="font-medium text-slate-700">
						{m.auth_agree_terms({ terms: m.auth_terms_and_conditions() })}
					</span>
				</span>
			</label>
		</div>

		<button
			class="flex w-full justify-center rounded-custom bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
			type="submit"
		>
			{m.auth_create_account()}
		</button>
	</form>

	<footer class="mt-6 text-center text-sm text-slate-600">
		{m.auth_already_have_account()}
		<a class="font-semibold text-brand hover:text-brand-dark" href="/login">{m.common_login()}</a>
	</footer>
</section>

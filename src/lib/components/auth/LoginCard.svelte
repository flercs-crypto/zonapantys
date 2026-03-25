<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';

	let form = $state({
		email: '',
		password: ''
	});

	const handleSubmit = (event: SubmitEvent) => {
		event.preventDefault();
	};
</script>

<section
	class="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-card"
	data-locale={$currentLocale}
>
	<form class="space-y-6" onsubmit={handleSubmit}>
		<div class="space-y-1">
			<label class="block text-sm font-medium text-slate-700" for="login-email"
				>{m.common_email_address()}</label
			>
			<input
				bind:value={form.email}
				class="block w-full rounded-custom border-slate-300 px-4 py-3 focus:border-brand focus:ring-brand"
				id="login-email"
				placeholder={m.auth_placeholder_login_email()}
				required
				type="email"
			/>
		</div>

		<div class="space-y-1">
			<div class="flex items-center justify-between">
				<label class="block text-sm font-medium text-slate-700" for="login-password"
					>{m.common_password()}</label
				>
				<a class="text-xs font-semibold text-brand hover:text-brand-dark" href="/login"
					>{m.auth_forgot_password()}</a
				>
			</div>
			<input
				bind:value={form.password}
				class="block w-full rounded-custom border-slate-300 px-4 py-3 focus:border-brand focus:ring-brand"
				id="login-password"
				placeholder="••••••••"
				required
				type="password"
			/>
		</div>

		<button
			class="flex w-full justify-center rounded-custom bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
			type="submit"
		>
			{m.auth_sign_in()}
		</button>
	</form>

	<footer class="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
		{m.auth_dont_have_account()}
		<a class="font-semibold text-brand hover:text-brand-dark" href="/register"
			>{m.common_register()}</a
		>
	</footer>
</section>

<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { AuthServiceError, resetPassword } from '$lib/services/auth.service';

	let isLoading = $state(false);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		errorMessage = null;
		successMessage = null;
		isLoading = true;

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const email = String(formData.get('email') ?? '').trim();

		try {
			await resetPassword(email);
			successMessage = m.auth_forgot_success();
		} catch (error) {
			errorMessage =
				error instanceof AuthServiceError ? error.friendlyMessage : m.auth_forgot_error_fallback();
		} finally {
			isLoading = false;
		}
	};
</script>

<section
	class="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-card"
	data-locale={$currentLocale}
>
	<form aria-busy={isLoading} class="space-y-5" onsubmit={handleSubmit}>
		<fieldset class="space-y-5" disabled={isLoading}>
			<div>
				<label class="block text-sm font-medium text-slate-700" for="reset-email">
					{m.common_email_address()}
				</label>
				<input
					class="mt-1 block w-full rounded-custom border-slate-300 bg-white px-4 py-2.5 focus:border-brand focus:ring-brand"
					id="reset-email"
					name="email"
					autocomplete="email"
					placeholder={m.auth_placeholder_email()}
					required
					type="email"
				/>
			</div>

			{#if errorMessage}
				<p
					aria-live="assertive"
					class="rounded-custom border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
					role="alert"
				>
					{errorMessage}
				</p>
			{/if}

			{#if successMessage}
				<p
					aria-live="polite"
					class="rounded-custom border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
					role="status"
				>
					{successMessage}
				</p>
			{/if}

			<button
				class="flex w-full justify-center rounded-custom bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
				type="submit"
			>
				{isLoading ? m.auth_sending_email() : m.auth_send_reset_email()}
			</button>
		</fieldset>
	</form>

	<footer class="mt-6 text-center text-sm text-slate-600">
		{m.auth_back_to_login()}
		<a class="font-semibold text-brand hover:text-brand-dark" href="/login">{m.common_login()}</a>
	</footer>
</section>

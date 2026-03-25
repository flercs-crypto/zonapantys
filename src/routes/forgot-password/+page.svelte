<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import AuthBrandHeader from '$lib/components/auth/AuthBrandHeader.svelte';
	import AuthSupportText from '$lib/components/auth/AuthSupportText.svelte';
	import ForgotPasswordForm from '$lib/components/auth/ForgotPasswordForm.svelte';
	import { getAuthSupportLinks } from '$lib/components/auth/data';

	const authSupportLinks = $derived.by(() => {
		$currentLocale;
		return getAuthSupportLinks();
	});
</script>

<svelte:head>
	<title>{m.auth_forgot_page_title()}</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-4 py-10" data-locale={$currentLocale}>
	<div class="w-full max-w-md space-y-8">
		<AuthBrandHeader title={m.auth_forgot_title()} subtitle={m.auth_forgot_subtitle()} />
		<ForgotPasswordForm />
		<AuthSupportText copy={m.auth_support_copy_forgot()} links={authSupportLinks} />
	</div>
</main>

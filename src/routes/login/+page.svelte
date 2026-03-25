<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import AuthBrandHeader from '$lib/components/auth/AuthBrandHeader.svelte';
	import AuthSupportText from '$lib/components/auth/AuthSupportText.svelte';
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import { getAuthSupportLinks } from '$lib/components/auth/data';

	const authSupportLinks = $derived.by(() => {
		$currentLocale;
		return getAuthSupportLinks();
	});
</script>

<svelte:head>
	<title>{m.auth_login_page_title()}</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-4 py-10" data-locale={$currentLocale}>
	<div class="w-full max-w-md space-y-8">
		<AuthBrandHeader title="Zonapantys" subtitle={m.auth_login_subtitle()} />
		<LoginForm />
		<AuthSupportText copy={m.auth_support_copy_login()} links={authSupportLinks} />
	</div>
</main>

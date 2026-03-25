<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import AuthBrandHeader from '$lib/components/auth/AuthBrandHeader.svelte';
	import AuthSupportText from '$lib/components/auth/AuthSupportText.svelte';
	import RegisterForm from '$lib/components/auth/RegisterForm.svelte';
	import { getAuthSupportLinks } from '$lib/components/auth/data';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const authSupportLinks = $derived.by(() => {
		$currentLocale;
		return getAuthSupportLinks();
	});

	const mode = $derived(data.session ? 'google' : 'email');
</script>

<svelte:head>
	<title>{m.auth_register_page_title()}</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-4 py-10" data-locale={$currentLocale}>
	<div class="w-full max-w-md space-y-8">
		<AuthBrandHeader title="Zonapantys" subtitle={m.auth_register_seller_copy()} />
		<RegisterForm
			role="seller"
			{mode}
			initialDisplayName={data.session?.displayName ?? ''}
			initialEmail={data.session?.email ?? ''}
		/>
		<AuthSupportText copy={m.auth_support_copy_register()} links={authSupportLinks} />
	</div>
</main>
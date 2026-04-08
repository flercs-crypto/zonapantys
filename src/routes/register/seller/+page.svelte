<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import AuthBrandHeader from '$lib/components/auth/AuthBrandHeader.svelte';
	import AuthSupportText from '$lib/components/auth/AuthSupportText.svelte';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import RegisterForm from '$lib/components/auth/RegisterForm.svelte';
	import { getAuthSupportLinks } from '$lib/components/auth/data';
	import type { PageData } from './$types';
	import { NOINDEX_FOLLOW, type SeoMetadata } from '$lib/seo';

	let { data }: { data: PageData } = $props();

	const authSupportLinks = $derived.by(() => {
		$currentLocale;
		return getAuthSupportLinks();
	});

	const mode = $derived(data.session ? 'google' : 'email');
	const seo = $derived.by<SeoMetadata>(() => {
		$currentLocale;
		return {
			title: m.auth_register_seller_page_title(),
			description: m.auth_register_seller_page_description(),
			robots: NOINDEX_FOLLOW
		};
	});
</script>

<SeoHead {seo} />

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
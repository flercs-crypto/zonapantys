<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import AuthBrandHeader from '$lib/components/auth/AuthBrandHeader.svelte';
	import AuthSupportText from '$lib/components/auth/AuthSupportText.svelte';
	import { getAuthSupportLinks } from '$lib/components/auth/data';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const authSupportLinks = $derived.by(() => {
		$currentLocale;
		return getAuthSupportLinks();
	});

	const selectionCopy = $derived(
		data.session ? m.auth_register_google_pending_title() : m.auth_register_role_selection_copy()
	);
</script>

<svelte:head>
	<title>{m.auth_register_page_title()}</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-4 py-10" data-locale={$currentLocale}>
	<div class="w-full max-w-md space-y-8">
		<AuthBrandHeader title="Zonapantys" subtitle={selectionCopy} />
		<section class="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-card">
			<div class="space-y-3">
				<h2 class="text-xl font-semibold text-slate-900">{m.auth_register_role_selection_title()}</h2>
				<p class="text-sm text-slate-600">{m.auth_register_role_selection_body()}</p>
			</div>

			<div class="mt-6 grid gap-4">
				<a
					class="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5 transition hover:border-brand hover:bg-white"
					href="/register/buyer"
				>
					<p class="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
						{m.auth_role_buyer()}
					</p>
					<h3 class="mt-2 text-lg font-semibold text-slate-900">
						{m.auth_register_buyer_heading()}
					</h3>
					<p class="mt-2 text-sm text-slate-600">{m.auth_role_buyer_copy()}</p>
				</a>

				<a
					class="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5 transition hover:border-brand hover:bg-white"
					href="/register/seller"
				>
					<p class="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
						{m.auth_role_seller()}
					</p>
					<h3 class="mt-2 text-lg font-semibold text-slate-900">
						{m.auth_register_seller_heading()}
					</h3>
					<p class="mt-2 text-sm text-slate-600">{m.auth_role_seller_copy()}</p>
				</a>
			</div>

			<footer class="mt-6 text-center text-sm text-slate-600">
				{m.auth_already_have_account()}
				<a class="font-semibold text-brand hover:text-brand-dark" href="/login"
					>{m.common_login()}</a
				>
			</footer>
		</section>
		<AuthSupportText copy={m.auth_support_copy_register()} links={authSupportLinks} />
	</div>
</main>

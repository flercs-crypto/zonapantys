<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import ClientFavoritesSection from '$lib/components/dashboard-client/ClientFavoritesSection.svelte';
	import ClientProfileSummary from '$lib/components/dashboard-client/ClientProfileSummary.svelte';
	import ClientPurchasesSection from '$lib/components/dashboard-client/ClientPurchasesSection.svelte';
	import ClientRecentActivity from '$lib/components/dashboard-client/ClientRecentActivity.svelte';
	import ClientSavedItemsGrid from '$lib/components/dashboard-client/ClientSavedItemsGrid.svelte';
	import ClientSettingsSection from '$lib/components/dashboard-client/ClientSettingsSection.svelte';
	import ClientSidebar from '$lib/components/dashboard-client/ClientSidebar.svelte';
	import { getClientNavItems, type ClientDashboardFeedback } from '$lib/components/dashboard-client/data';
	import { NOINDEX_FOLLOW, type SeoMetadata } from '$lib/seo';
	import type { ActionData, PageData } from './$types';

	type Props = {
		data: PageData;
		form?: ActionData;
	};

	let { data, form }: Props = $props();

	const clientNavItems = $derived.by(() => {
		$currentLocale;
		return getClientNavItems(data.activeSection);
	});

	const feedback = $derived((form ?? null) as ClientDashboardFeedback | null);
	const seo = $derived.by<SeoMetadata>(() => {
		$currentLocale;
		return {
			title: m.dashboard_client_page_title(),
			description: m.dashboard_client_page_description(),
			robots: NOINDEX_FOLLOW
		};
	});
</script>

<SeoHead {seo} />

<div class="flex min-h-screen flex-col md:flex-row" data-locale={$currentLocale}>
	<ClientSidebar items={clientNavItems} />

	<main class="flex-1 overflow-y-auto p-4 md:p-10">
		{#if !data.dashboard}
			<section class="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-8 py-12 text-center shadow-card">
				<h1 class="text-2xl font-bold text-slate-900">{m.dashboard_client_profile_unavailable()}</h1>
				<p class="mt-3 text-sm text-slate-500">{m.dashboard_client_profile_unavailable_copy()}</p>
			</section>
		{:else if data.activeSection === 'profile'}
			<ClientProfileSummary profile={data.dashboard.profile} {feedback} />
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<ClientRecentActivity items={data.dashboard.recentActivity} />
				<ClientSavedItemsGrid items={data.dashboard.savedPreview} />
			</div>
		{:else if data.activeSection === 'purchases'}
			<ClientPurchasesSection {feedback} ordersPage={data.dashboard.ordersPage} />
		{:else if data.activeSection === 'favorites'}
			<ClientFavoritesSection items={data.dashboard.favorites} {feedback} />
		{:else}
			<ClientSettingsSection profile={data.dashboard.profile} {feedback} />
		{/if}
	</main>
</div>

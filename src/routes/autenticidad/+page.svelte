<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import PublicInfoPage from '$lib/components/landing/PublicInfoPage.svelte';
	import { getAuthenticityPageContent } from '$lib/components/landing/public-pages';

	const page = $derived.by(() => {
		$currentLocale;
		return getAuthenticityPageContent();
	});
</script>

<PublicInfoPage {page} />
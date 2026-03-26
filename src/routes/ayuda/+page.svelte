<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import PublicInfoPage from '$lib/components/landing/PublicInfoPage.svelte';
	import { getHelpPageContent } from '$lib/components/landing/public-pages';

	const page = $derived.by(() => {
		$currentLocale;
		return getHelpPageContent();
	});
</script>

<PublicInfoPage {page} />
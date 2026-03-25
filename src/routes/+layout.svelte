<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { browser } from '$app/environment';
	import LanguageSwitcher from '$lib/components/i18n/LanguageSwitcher.svelte';
	import { initI18n } from '$lib/i18n';
	import { authStore } from '$lib/stores/auth.store';

	let { children } = $props();

	if (browser) {
		authStore.init();
		initI18n();
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<LanguageSwitcher />
{@render children()}

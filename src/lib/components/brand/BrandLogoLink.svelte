<script lang="ts">
	import { base } from '$app/paths';

	type Props = {
		href?: string;
		rootClass?: string;
		imageClass?: string;
		textWrapperClass?: string;
		titleClass?: string;
		title?: string;
		subtitle?: string | null;
		subtitleClass?: string;
		alt?: string;
	};

	let {
		href = '/',
		rootClass = '',
		imageClass = 'h-10 w-auto',
		textWrapperClass = '',
		titleClass = '',
		title = 'Zonapantys',
		subtitle = null,
		subtitleClass = '',
		alt = 'Zonapantys'
	}: Props = $props();

	let imageFailed = $state(false);
	const logoSrc = `${base}/images/logo_zonapantys_1.png`;
	const fallbackTitle = $derived(title || 'Zonapantys');
</script>

<a class={rootClass} href={href}>
	{#if !imageFailed}
		<img alt={alt} class={`block ${imageClass}`} onerror={() => (imageFailed = true)} src={logoSrc} />
	{/if}
	{#if imageFailed || title || subtitle}
		<span class={textWrapperClass}>
			{#if title || imageFailed}
				<span class={titleClass}>{fallbackTitle}</span>
			{/if}

			{#if subtitle}
				<span class={subtitleClass}>{subtitle}</span>
			{/if}
		</span>
	{/if}
</a>
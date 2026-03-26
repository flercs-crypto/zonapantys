<script lang="ts">
	type UploadIcon = 'camera' | 'upload';

	type Props = {
		id: string;
		label: string;
		buttonLabel: string;
		name?: string;
		accept?: string;
		hint?: string;
		fileName?: string;
		multiple?: boolean;
		selectedCountText?: string;
		previewUrl?: string;
		previewUrls?: string[];
		previewAlt?: string;
		previewClass?: string;
		removePreviewLabel?: string;
		required?: boolean;
		disabled?: boolean;
		busy?: boolean;
		statusText?: string;
		icon?: UploadIcon;
		onRemovePreview?: (index: number) => void;
		onchange?: (event: Event) => void;
	};

	let {
		id,
		label,
		buttonLabel,
		name,
		accept = 'image/jpeg,image/png,image/webp',
		hint = '',
		fileName = '',
		multiple = false,
		selectedCountText = '',
		previewUrl = '',
		previewUrls = [],
		previewAlt = '',
		previewClass = 'h-48 w-full rounded-custom object-cover',
		removePreviewLabel = 'Remove image',
		required = false,
		disabled = false,
		busy = false,
		statusText = '',
		icon = 'upload',
		onRemovePreview,
		onchange
	}: Props = $props();

	let inputElement: HTMLInputElement | null = null;

	const openFilePicker = () => {
		if (disabled || busy) {
			return;
		}

		if (inputElement) {
			inputElement.value = '';
		}

		inputElement?.click();
	};
</script>

<div aria-busy={busy} class="space-y-3">
	<label class="block text-sm font-medium text-slate-700" for={id}>{label}</label>
	<input
		{id}
		{name}
		{accept}
		{multiple}
		{required}
		bind:this={inputElement}
		class="hidden"
		disabled={disabled || busy}
		{onchange}
		type="file"
	/>

	<button
		aria-controls={id}
		class={`${disabled || busy ? 'cursor-not-allowed bg-slate-300 hover:bg-slate-300' : 'bg-brand hover:bg-brand-dark'} inline-flex w-full items-center justify-center gap-2 rounded-custom px-4 py-3 text-sm font-semibold text-white shadow-sm transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2`}
		disabled={disabled || busy}
		onclick={openFilePicker}
		type="button"
	>
		{#if icon === 'camera'}
			<svg aria-hidden="true" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					d="M3 8.25A2.25 2.25 0 0 1 5.25 6h2.379a2.25 2.25 0 0 0 1.59-.659l.622-.621A2.25 2.25 0 0 1 11.432 4h1.136a2.25 2.25 0 0 1 1.591.659l.622.621A2.25 2.25 0 0 0 16.371 6h2.379A2.25 2.25 0 0 1 21 8.25v8.25A2.25 2.25 0 0 1 18.75 18.75H5.25A2.25 2.25 0 0 1 3 16.5V8.25Z"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.8"
				></path>
				<path
					d="M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.8"
				></path>
			</svg>
		{:else}
			<svg aria-hidden="true" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					d="M12 16V4m0 0-4 4m4-4 4 4m4 7.25v2.25A2.25 2.25 0 0 1 17.75 20h-11.5A2.25 2.25 0 0 1 4 17.75V15.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.8"
				></path>
			</svg>
		{/if}
		<span>{buttonLabel}</span>
	</button>

	{#if hint}
		<p class="text-xs text-slate-500">{hint}</p>
	{/if}

	{#if busy && statusText}
		<p aria-live="polite" class="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
			<span class="h-4 w-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand"
			></span>
			{statusText}
		</p>
	{/if}

	{#if selectedCountText}
		<p
			class="rounded-custom border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
		>
			{selectedCountText}
		</p>
	{/if}

	{#if fileName}
		<p
			class="rounded-custom border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium break-all text-slate-700"
		>
			{fileName}
		</p>
	{/if}

	{#if previewUrls.length > 0}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each previewUrls as item, index (`${item}-${index}`)}
				<div
					class="relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50 p-2"
				>
					<img alt={`${previewAlt || label} ${index + 1}`} class={previewClass} src={item} />
					{#if onRemovePreview}
						<button
							aria-label={`${removePreviewLabel} ${index + 1}`}
							class="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/80 text-base font-semibold text-white transition hover:bg-slate-950"
							onclick={() => onRemovePreview(index)}
							type="button"
						>
							<span aria-hidden="true">&times;</span>
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{:else if previewUrl}
		<div class="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50 p-2">
			<img alt={previewAlt || label} class={previewClass} src={previewUrl} />
		</div>
	{/if}
</div>

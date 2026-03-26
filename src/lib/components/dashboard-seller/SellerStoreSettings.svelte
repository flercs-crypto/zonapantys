<script lang="ts">
	import { resolve } from '$app/paths';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import ImageUploadField from '$lib/components/forms/ImageUploadField.svelte';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { AVATAR_IMAGE_COMPRESSION, compressImageFile } from '$lib/utils/image-upload';
	import type { Profile, Seller } from '$lib/types/database.types';

	type Props = {
		seller: Seller;
		profile: Profile;
	};

	type ApiErrorResponse = {
		message?: string;
	};

	const dispatch = createEventDispatcher<{
		saved: { seller: Seller; profile: Profile };
	}>();

	let { seller, profile }: Props = $props();
	let description = $state('');
	let avatarFile = $state<File | null>(null);
	let avatarPreview = $state('');
	let avatarObjectUrl = $state<string | null>(null);
	let avatarFileName = $state('');
	let isActive = $state(true);
	let isSaving = $state(false);
	let isPreparingAvatar = $state(false);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	const avatarUploadStatus = $derived.by(() => {
		if (isPreparingAvatar) {
			return m.common_image_compressing();
		}

		if (isSaving && avatarFile) {
			return m.common_image_uploading();
		}

		return '';
	});

	const getApiErrorMessage = async (response: Response, fallback: string) => {
		try {
			const payload = (await response.json()) as ApiErrorResponse;
			return payload.message || fallback;
		} catch {
			return fallback;
		}
	};

	$effect(() => {
		description = seller.description ?? '';
		isActive = seller.is_active;

		if (!avatarFile) {
			avatarPreview = profile.avatar_url ?? seller.logo_url ?? '';
		}
	});

	const revokeAvatarObjectUrl = () => {
		if (avatarObjectUrl) {
			URL.revokeObjectURL(avatarObjectUrl);
			avatarObjectUrl = null;
		}
	};

	onDestroy(() => {
		revokeAvatarObjectUrl();
	});

	const handleAvatarChange = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;

		revokeAvatarObjectUrl();
		avatarFile = file;
		avatarFileName = file?.name ?? '';
		if (file) {
			avatarObjectUrl = URL.createObjectURL(file);
			avatarPreview = avatarObjectUrl;
			return;
		}

		avatarPreview = profile.avatar_url ?? seller.logo_url ?? '';
	};

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		errorMessage = null;
		successMessage = null;
		isSaving = true;

		try {
			const payload = new FormData();
			payload.set('description', description.trim());

			if (avatarFile) {
				isPreparingAvatar = true;
				const { file } = await compressImageFile(avatarFile, AVATAR_IMAGE_COMPRESSION);
				payload.set('avatar', file);
				isPreparingAvatar = false;
			}

			const response = await fetch('/api/dashboard/seller/store', {
				method: 'POST',
				body: payload
			});

			if (!response.ok) {
				throw new Error(await getApiErrorMessage(response, m.dashboard_seller_store_save_failed()));
			}

			const result = (await response.json()) as { profile: Profile; seller: Seller };
			avatarFile = null;
			avatarFileName = '';
			revokeAvatarObjectUrl();
			avatarPreview = result.profile.avatar_url ?? result.seller.logo_url ?? '';
			description = result.seller.description ?? '';
			isActive = result.seller.is_active;
			successMessage = m.dashboard_seller_store_saved();
			dispatch('saved', result);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : m.dashboard_seller_store_save_failed();
		} finally {
			isPreparingAvatar = false;
			isSaving = false;
		}
	};
</script>

<section class="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-card lg:p-8" data-locale={$currentLocale}>
	<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
		<div>
			<p class="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
				{m.dashboard_seller_store_label()}
			</p>
			<h1 class="mt-2 text-3xl font-bold text-slate-950">{seller.store_name}</h1>
			<p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
				{m.dashboard_seller_store_copy()}
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<span
				class:is-active={isActive}
				class:is-inactive={!isActive}
				class="inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase"
			>
				{isActive ? m.dashboard_seller_store_status_active() : m.dashboard_seller_store_status_inactive()}
			</span>
			<a
				class="inline-flex rounded-custom border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
				href={resolve('/vendedoras/[slug]/tienda', { slug: seller.store_slug })}
			>
				{m.dashboard_seller_open_store()}
			</a>
		</div>
	</div>

	<form class="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]" onsubmit={handleSubmit}>
		<div class="space-y-4">
			<div class="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
				{#if avatarPreview}
					<img
						alt={seller.store_name}
						class="aspect-square w-full object-cover"
						src={avatarPreview}
					/>
				{:else}
					<div class="flex aspect-square items-center justify-center bg-slate-100 text-sm font-semibold text-slate-400">
						{m.dashboard_seller_store_avatar_empty()}
					</div>
				{/if}
			</div>

			<div class="space-y-2">
				<ImageUploadField
					accept="image/jpeg,image/png,image/webp"
					busy={isPreparingAvatar || (isSaving && Boolean(avatarFile))}
					buttonLabel={m.common_select_image()}
					fileName={avatarFileName}
					hint={m.dashboard_seller_store_avatar_hint()}
					icon="camera"
					id="seller-store-avatar"
					label={m.dashboard_seller_store_avatar_label()}
					onchange={handleAvatarChange}
					previewAlt={seller.store_name}
					previewClass="aspect-square w-full rounded-custom object-cover"
					previewUrl={avatarFileName ? avatarPreview : ''}
					statusText={avatarUploadStatus}
				/>
				<p class="text-xs font-medium text-slate-500">{m.dashboard_seller_store_preview_hint()}</p>
			</div>
		</div>

		<div class="space-y-4">
			<div class="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
				<p class="text-sm font-semibold text-slate-900">
					{m.dashboard_seller_store_status_label()}
				</p>
				<p class="mt-1 text-sm text-slate-500">
					{isActive
						? m.dashboard_seller_store_status_active_copy()
						: m.dashboard_seller_store_status_inactive_copy()}
				</p>
			</div>

			<div class="space-y-2">
				<label class="block text-sm font-medium text-slate-700" for="seller-store-description">
					{m.dashboard_seller_store_description_label()}
				</label>
				<textarea
					bind:value={description}
					class="block min-h-40 w-full rounded-custom border-slate-300 px-4 py-3 text-sm focus:border-brand focus:ring-brand"
					id="seller-store-description"
					maxlength="1000"
					placeholder={m.dashboard_seller_store_description_placeholder()}
				></textarea>
			</div>

			{#if errorMessage}
				<p class="rounded-custom border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{errorMessage}
				</p>
			{/if}

			{#if successMessage}
				<p class="rounded-custom border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
					{successMessage}
				</p>
			{/if}

			<div class="flex justify-end">
				<button
					class="inline-flex min-w-48 items-center justify-center rounded-custom bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
					disabled={isSaving}
					type="submit"
				>
					{#if isSaving}
						{m.dashboard_seller_store_saving()}
					{:else}
						{m.dashboard_seller_store_save()}
					{/if}
				</button>
			</div>
		</div>
	</form>
</section>

<style>
	.is-active {
		background: color-mix(in srgb, var(--color-success) 18%, white);
		color: var(--color-success);
	}

	.is-inactive {
		background: color-mix(in srgb, var(--color-error) 14%, white);
		color: var(--color-error);
	}
</style>
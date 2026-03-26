<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { onDestroy } from 'svelte';
	import ImageUploadField from '$lib/components/forms/ImageUploadField.svelte';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { AVATAR_IMAGE_COMPRESSION, compressImageFile } from '$lib/utils/image-upload';
	import type { ClientDashboardFeedback, ClientProfile } from './data';

	type Props = {
		profile: ClientProfile;
		feedback: ClientDashboardFeedback | null;
	};

	let { profile, feedback }: Props = $props();
	let avatarFile = $state<File | null>(null);
	let avatarFileName = $state('');
	let avatarPreviewUrl = $state('');
	let avatarObjectUrl = $state<string | null>(null);
	let isCompressingAvatar = $state(false);
	let isSubmitting = $state(false);

	const memberSince = $derived.by(() =>
		new Intl.DateTimeFormat($currentLocale, {
			month: 'long',
			year: 'numeric'
		}).format(new Date(profile.memberSince))
	);

	const profileInitial = $derived(profile.displayName.trim().charAt(0).toUpperCase() || 'U');
	const profileAvatar = $derived(avatarPreviewUrl || profile.avatarUrl || '');
	const avatarUploadStatus = $derived.by(() => {
		if (isCompressingAvatar) {
			return m.common_image_compressing();
		}

		if (isSubmitting && avatarFile) {
			return m.common_image_uploading();
		}

		return '';
	});

	const revokeAvatarPreview = () => {
		if (avatarObjectUrl) {
			URL.revokeObjectURL(avatarObjectUrl);
			avatarObjectUrl = null;
		}
	};

	onDestroy(() => {
		revokeAvatarPreview();
	});

	const clearAvatarSelection = () => {
		revokeAvatarPreview();
		avatarFile = null;
		avatarFileName = '';
		avatarPreviewUrl = '';
	};

	const handleAvatarChange = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;

		revokeAvatarPreview();
		avatarFile = file;
		avatarFileName = file?.name ?? '';

		if (!file) {
			avatarPreviewUrl = '';
			return;
		}

		avatarObjectUrl = URL.createObjectURL(file);
		avatarPreviewUrl = avatarObjectUrl;
	};

	const enhanceProfileForm: SubmitFunction = async ({ formData }) => {
		if (avatarFile) {
			isCompressingAvatar = true;
			const { file } = await compressImageFile(avatarFile, AVATAR_IMAGE_COMPRESSION);
			formData.set('avatar', file);
			isCompressingAvatar = false;
		}

		isSubmitting = true;

		return async ({ result, update }) => {
			try {
				await update();

				if (result.type === 'success') {
					clearAvatarSelection();
				}
			} finally {
				isCompressingAvatar = false;
				isSubmitting = false;
			}
		};
	};
</script>

<section
	class="mb-10 rounded-[1.5rem] bg-white p-6 shadow-card"
	data-locale={$currentLocale}
>
	<div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
		<div class="flex flex-col items-center gap-4 text-center lg:flex-row lg:text-left">
			<div class="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-slate-50 bg-slate-100 text-3xl font-semibold text-slate-500">
				{#if profileAvatar}
					<img
						alt={m.dashboard_client_user_avatar_alt()}
						class="h-full w-full object-cover"
						src={profileAvatar}
					/>
				{:else}
					<span>{profileInitial}</span>
				{/if}
				<span class="absolute right-1 bottom-1 h-5 w-5 rounded-full border-2 border-white bg-green-500"></span>
			</div>

			<div>
				<p class="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
					{m.dashboard_client_profile_section_kicker()}
				</p>
				<h1 class="mt-2 text-3xl font-bold text-slate-900">{profile.displayName}</h1>
				<p class="mt-2 text-sm text-slate-500">
					{m.dashboard_client_member_since_label({ date: memberSince })}
				</p>
			</div>
		</div>

		<div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
			<p class="font-semibold text-slate-900">{profile.email}</p>
			<p class="mt-1">
				{profile.isGoogleAccount
					? m.dashboard_client_account_provider_google()
					: m.dashboard_client_account_provider_password()}
			</p>
		</div>
	</div>

	<form class="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]" enctype="multipart/form-data" method="POST" use:enhance={enhanceProfileForm}>
		<input name="intent" type="hidden" value="update-profile" />
		<input name="scope" type="hidden" value="profile" />

		<div class="grid gap-4 md:grid-cols-2">
			<label class="block text-sm font-medium text-slate-700">
				<span class="mb-2 block">{m.auth_display_name()}</span>
				<input
					class="block w-full rounded-custom border-slate-300 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:ring-brand"
					name="displayName"
					placeholder={m.auth_placeholder_full_name()}
					required
					type="text"
					value={profile.displayName}
				/>
			</label>

			<ImageUploadField
				accept="image/png,image/jpeg,image/webp"
				busy={isCompressingAvatar || (isSubmitting && Boolean(avatarFile))}
				buttonLabel={m.common_select_image()}
				fileName={avatarFileName}
				icon="camera"
				id="client-profile-avatar"
				label={m.dashboard_client_profile_avatar_label()}
				name="avatar"
				onchange={handleAvatarChange}
				previewAlt={m.dashboard_client_user_avatar_alt()}
				previewClass="h-48 w-full rounded-custom object-cover"
				previewUrl={avatarFileName ? avatarPreviewUrl : ''}
				statusText={avatarUploadStatus}
			/>
		</div>

		<button
			class="self-end rounded-custom bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
			disabled={isSubmitting}
			type="submit"
		>
			{m.dashboard_client_save_profile()}
		</button>
	</form>

	{#if feedback?.scope === 'profile' && feedback.message}
		<p class={`mt-4 text-sm ${feedback.success ? 'text-emerald-600' : 'text-red-600'}`}>
			{feedback.message}
		</p>
	{/if}
</section>

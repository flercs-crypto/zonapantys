<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onDestroy } from 'svelte';
	import { SELLER_COUNTRIES } from '$lib/components/auth/seller-registration';
	import ImageUploadField from '$lib/components/forms/ImageUploadField.svelte';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import { AuthServiceError, completeRegistration, register } from '$lib/services/auth.service';
	import { authStore } from '$lib/stores/auth.store';
	import { VERIFICATION_SELFIE_COMPRESSION, compressImageFile } from '$lib/utils/image-upload';
	import type { RegistrationRole } from '$lib/types/database.types';

	type RegisterMode = 'email' | 'google';

	let {
		role,
		mode = 'email',
		initialDisplayName = '',
		initialEmail = ''
	}: {
		role: RegistrationRole;
		mode?: RegisterMode;
		initialDisplayName?: string;
		initialEmail?: string;
	} = $props();

	let isLoading = $state(false);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let showLoginSuggestion = $state(false);
	let selectedCountryCode = $state('CL');
	let sellerPhoneLocal = $state('');
	let sellerDescription = $state('');
	let selfiePreviewUrl = $state('');
	let selfieObjectUrl = $state<string | null>(null);
	let selfieFileName = $state('');
	let isPreparingSelfie = $state(false);

	const passwordPattern = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
	const isGoogleMode = $derived(mode === 'google');
	const requiresStoreName = $derived(role === 'seller');
	const selectedCountry = $derived.by(
		() => SELLER_COUNTRIES.find((country) => country.code === selectedCountryCode) ?? SELLER_COUNTRIES[0]
	);
	const sellerDescriptionRemaining = $derived(300 - sellerDescription.length);
	const submitLabel = $derived.by(() => {
		if (isLoading) {
			return isGoogleMode ? m.auth_completing_account() : m.auth_creating_account();
		}

		return isGoogleMode ? m.auth_complete_account() : m.auth_create_account();
	});
	const title = $derived(
		role === 'seller' ? m.auth_register_seller_heading() : m.auth_register_buyer_heading()
	);
	const copy = $derived(
		role === 'seller' ? m.auth_register_seller_copy() : m.auth_register_buyer_copy()
	);
	const emailValue = $derived(initialEmail || authStore.currentUser?.email || '');
	const displayNameValue = $derived(initialDisplayName || authStore.currentUser?.displayName || '');
	const googleReady = $derived(!isGoogleMode || (!authStore.isLoading && authStore.currentUser !== null));
	const selfieUploadStatus = $derived.by(() => {
		if (isPreparingSelfie) {
			return m.common_image_compressing();
		}

		if (isLoading) {
			return m.common_image_uploading();
		}

		return '';
	});

	const revokeSelfiePreview = () => {
		if (selfieObjectUrl) {
			URL.revokeObjectURL(selfieObjectUrl);
			selfieObjectUrl = null;
		}
	};

	onDestroy(() => {
		revokeSelfiePreview();
	});

	const resetSellerFields = () => {
		revokeSelfiePreview();
		selectedCountryCode = 'CL';
		sellerPhoneLocal = '';
		sellerDescription = '';
		selfiePreviewUrl = '';
		selfieFileName = '';
		isPreparingSelfie = false;
	};

	const handleSelfieChange = (event: Event) => {
		errorMessage = null;
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;

		revokeSelfiePreview();
		selfiePreviewUrl = '';
		selfieFileName = '';

		if (!file) {
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			errorMessage = m.auth_register_selfie_file_too_large();
			input.value = '';
			return;
		}

		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
			errorMessage = m.auth_register_selfie_invalid_type();
			input.value = '';
			return;
		}

		selfieFileName = file.name;
		selfieObjectUrl = URL.createObjectURL(file);
		selfiePreviewUrl = selfieObjectUrl;
	};

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		errorMessage = null;
		successMessage = null;
		showLoginSuggestion = false;
		isLoading = true;

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		const displayName = String(formData.get('displayName') ?? '').trim();
		const storeName = String(formData.get('storeName') ?? '').trim();
		const countryCode = String(formData.get('country') ?? '').trim();
		const phoneLocal = String(formData.get('phoneLocal') ?? '').trim();
		const sellerBio = String(formData.get('sellerDescription') ?? '').trim();
		const selfieFile = formData.get('selfie');
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');
		const country = SELLER_COUNTRIES.find((entry) => entry.code === countryCode) ?? null;
		let processedSelfieFile = selfieFile instanceof File ? selfieFile : null;

		if (displayName.length < 2) {
			isLoading = false;
			errorMessage = m.auth_register_name_too_short();
			return;
		}

		if (requiresStoreName && storeName.length < 2) {
			isLoading = false;
			errorMessage = m.auth_register_store_name_short();
			return;
		}

		if (requiresStoreName && !country) {
			isLoading = false;
			errorMessage = m.auth_register_country_required();
			return;
		}

		if (requiresStoreName && phoneLocal.replace(/\D+/g, '').length < 6) {
			isLoading = false;
			errorMessage = m.auth_register_phone_required();
			return;
		}

		if (requiresStoreName && sellerBio.length > 300) {
			isLoading = false;
			errorMessage = m.auth_register_description_too_long();
			return;
		}

		if (requiresStoreName && !(selfieFile instanceof File)) {
			isLoading = false;
			errorMessage = m.auth_register_selfie_required();
			return;
		}

		if (!isGoogleMode && !passwordPattern.test(password)) {
			isLoading = false;
			errorMessage = m.auth_register_password_invalid();
			return;
		}

		if (!isGoogleMode && password !== confirmPassword) {
			isLoading = false;
			errorMessage = m.auth_register_password_mismatch();
			return;
		}

		if (processedSelfieFile) {
			isPreparingSelfie = true;
			const { file } = await compressImageFile(processedSelfieFile, VERIFICATION_SELFIE_COMPRESSION);
			processedSelfieFile = file;
			isPreparingSelfie = false;
		}

		const registrationDetails = requiresStoreName
			? {
				storeName,
				country: country?.name ?? '',
				phone: `${country?.dialCode ?? ''} ${phoneLocal}`.trim(),
				description: sellerBio,
				selfieFile: processedSelfieFile
			}
			: { storeName };

		try {
			if (isGoogleMode) {
				const result = await completeRegistration(role, displayName, registrationDetails);

				if (result.status === 'role-added-existing') {
					await goto(result.redirectTo);
					return;
				}

				await goto(result.redirectTo);
				return;
			}

			const result = await register(email, password, displayName, role, registrationDetails);

			if (result.status === 'role-added-existing') {
				await goto(result.redirectTo);
				return;
			}

			form.reset();
			resetSellerFields();
			successMessage = m.auth_register_success();
			await goto(result.redirectTo);
		} catch (error) {
			if (error instanceof AuthServiceError) {
				errorMessage = error.friendlyMessage;
				showLoginSuggestion = error.code === 'auth/account-exists-login';
			} else {
				errorMessage = m.auth_register_error_fallback();
			}
		} finally {
			isPreparingSelfie = false;
			isLoading = false;
		}
	};
</script>

<section class="rounded-3xl border border-slate-200 bg-white p-8 shadow-card" data-locale={$currentLocale}>
	<header class="mb-6 space-y-2">
		<h2 class="text-xl font-semibold text-slate-900">{title}</h2>
		<p class="text-sm text-slate-600">{copy}</p>
		{#if isGoogleMode}
			<p class="rounded-custom border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
				{m.auth_register_google_pending_copy()}
			</p>
		{/if}
	</header>

	<form aria-busy={isLoading} class="space-y-5" onsubmit={handleSubmit}>
		<fieldset class="space-y-5" disabled={isLoading || !googleReady}>
			<div>
				<label class="block text-sm font-medium text-slate-700" for="register-display-name">
					{m.auth_display_name()}
				</label>
				<input
					class="mt-1 block w-full rounded-custom border-slate-300 bg-white px-4 py-2.5 focus:border-brand focus:ring-brand"
					id="register-display-name"
					maxlength="80"
					minlength="2"
					name="displayName"
					autocomplete="name"
					value={displayNameValue}
					placeholder={m.auth_placeholder_full_name()}
					required
					type="text"
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-slate-700" for="register-email">
					{m.common_email_address()}
				</label>
				<input
					class="mt-1 block w-full rounded-custom border-slate-300 bg-white px-4 py-2.5 focus:border-brand focus:ring-brand"
					id="register-email"
					name="email"
					autocomplete={isGoogleMode ? 'off' : 'email'}
					disabled={isGoogleMode}
					readonly={isGoogleMode}
					value={emailValue}
					placeholder={m.auth_placeholder_email()}
					required
					type="email"
				/>
			</div>

			{#if requiresStoreName}
				<div>
					<label class="block text-sm font-medium text-slate-700" for="register-store-name">
						{m.auth_register_store_name()}
					</label>
					<input
						class="mt-1 block w-full rounded-custom border-slate-300 bg-white px-4 py-2.5 focus:border-brand focus:ring-brand"
						id="register-store-name"
						maxlength="80"
						minlength="2"
						name="storeName"
						autocomplete="organization"
						placeholder={m.auth_register_store_name_placeholder()}
						required
						type="text"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700" for="register-country">
						{m.auth_register_country()}
					</label>
					<select
						bind:value={selectedCountryCode}
						class="mt-1 block w-full rounded-custom border-slate-300 bg-white px-4 py-2.5 focus:border-brand focus:ring-brand"
						id="register-country"
						name="country"
						required
					>
						{#each SELLER_COUNTRIES as countryOption (countryOption.code)}
							<option value={countryOption.code}>{countryOption.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700" for="register-phone-local">
						{m.auth_register_phone()}
					</label>
					<div class="mt-1 flex overflow-hidden rounded-custom border border-slate-300 bg-white focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
						<span class="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">
							{selectedCountry?.dialCode}
						</span>
						<input
							bind:value={sellerPhoneLocal}
							class="block min-w-0 flex-1 border-0 px-4 py-2.5 text-sm focus:ring-0"
							id="register-phone-local"
							inputmode="tel"
							maxlength="20"
							name="phoneLocal"
							placeholder={m.auth_register_phone_placeholder()}
							required
							type="tel"
						/>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700" for="register-seller-description">
						{m.auth_register_description()}
					</label>
					<textarea
						bind:value={sellerDescription}
						class="mt-1 block w-full rounded-custom border-slate-300 bg-white px-4 py-3 focus:border-brand focus:ring-brand"
						id="register-seller-description"
						maxlength="300"
						name="sellerDescription"
						placeholder={m.auth_register_description_placeholder()}
						rows="4"
					></textarea>
					<div class="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
						<p>{m.auth_register_description_hint()}</p>
						<span>{sellerDescriptionRemaining}</span>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700" for="register-selfie">
						{m.auth_register_selfie()}
					</label>
					<p class="mt-2 rounded-custom border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
						{m.auth_register_selfie_instructions()}
					</p>
					<ImageUploadField
						accept="image/jpeg,image/png,image/webp"
						busy={isPreparingSelfie || isLoading}
						buttonLabel={m.common_select_image()}
						fileName={selfieFileName}
						hint={m.auth_register_selfie_requirements()}
						icon="camera"
						id="register-selfie"
						label={m.auth_register_selfie()}
						name="selfie"
						onchange={handleSelfieChange}
						previewAlt={m.auth_register_selfie_preview_alt()}
						previewClass="h-56 w-full rounded-custom object-cover"
						previewUrl={selfiePreviewUrl}
						required
						statusText={selfieUploadStatus}
					/>
				</div>
			{/if}

			{#if !isGoogleMode}
			<div>
				<label class="block text-sm font-medium text-slate-700" for="register-password">
					{m.common_password()}
				</label>
				<input
					class="mt-1 block w-full rounded-custom border-slate-300 bg-white px-4 py-2.5 focus:border-brand focus:ring-brand"
					id="register-password"
					name="password"
					autocomplete="new-password"
					minlength="8"
					pattern={passwordPattern.source}
					placeholder="••••••••"
					required
					type="password"
				/>
				<p class="mt-2 text-xs text-slate-500">
					{m.auth_password_hint()}
				</p>
			</div>

				<div>
					<label class="block text-sm font-medium text-slate-700" for="confirm-password">
						{m.common_confirm_password()}
					</label>
					<input
						class="mt-1 block w-full rounded-custom border-slate-300 bg-white px-4 py-2.5 focus:border-brand focus:ring-brand"
						id="confirm-password"
						name="confirmPassword"
						autocomplete="new-password"
						minlength="8"
						placeholder="••••••••"
						required
						type="password"
					/>
				</div>
			{/if}

			{#if errorMessage}
				<p
					aria-live="assertive"
					class="rounded-custom border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
					role="alert"
				>
					{errorMessage}
					{#if showLoginSuggestion}
						<a class="ml-1 font-semibold text-brand hover:text-brand-dark" href={resolve('/login')}
							>{m.common_login()}</a
						>
					{/if}
				</p>
			{/if}

			{#if successMessage}
				<p
					aria-live="polite"
					class="rounded-custom border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
					role="status"
				>
					{successMessage}
				</p>
			{/if}

			<button
				class="flex w-full justify-center rounded-custom bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
				type="submit"
			>
				{submitLabel}
			</button>
		</fieldset>
	</form>

	<footer class="mt-6 text-center text-sm text-slate-600">
		{m.auth_already_have_account()}
		<a class="font-semibold text-brand hover:text-brand-dark" href={resolve('/login')}>{m.common_login()}</a>
	</footer>
</section>

<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { onDestroy } from 'svelte';
	import ImageUploadField from '$lib/components/forms/ImageUploadField.svelte';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import AdminNewSellers from '$lib/components/dashboard-admin/AdminNewSellers.svelte';
	import AdminRecentOrders from '$lib/components/dashboard-admin/AdminRecentOrders.svelte';
	import AdminReportsCharts from '$lib/components/dashboard-admin/AdminReportsCharts.svelte';
	import AdminSidebar from '$lib/components/dashboard-admin/AdminSidebar.svelte';
	import AdminStatsGrid from '$lib/components/dashboard-admin/AdminStatsGrid.svelte';
	import AdminTopbar from '$lib/components/dashboard-admin/AdminTopbar.svelte';
	import {
		buildAdminDashboardHref,
		getAdminFooterNav,
		getAdminOrderStatusLabel,
		getAdminNavItems,
		getAdminSectionTitle,
		type AdminDashboardFeedback,
		type AdminStat
	} from '$lib/components/dashboard-admin/data';
	import { resetPassword } from '$lib/services/auth.service';
	import { AVATAR_IMAGE_COMPRESSION, compressImageFile } from '$lib/utils/image-upload';
	import type { ActionData, PageData } from './$types';

	type Props = {
		data: PageData;
		form?: ActionData;
	};

	let { data, form }: Props = $props();
	let passwordResetPending = $state(false);
	let passwordResetMessage = $state('');
	let passwordResetSuccess = $state(false);
	let shippingDialog: HTMLDialogElement | null = null;
	let verificationDialog: HTMLDialogElement | null = null;
	let rejectionDialog: HTMLDialogElement | null = null;
	let selectedShippingOrderId = $state<string | null>(null);
	let selectedVerificationSellerId = $state<string | null>(null);
	let signedSelfieUrl = $state('');
	let signedSelfieLoading = $state(false);
	let signedSelfieError = $state('');
	let rejectionReason = $state('');
	let shippingProvider = $state('');
	let trackingNumber = $state('');
	let adminAvatarFile = $state<File | null>(null);
	let adminAvatarFileName = $state('');
	let adminAvatarPreviewUrl = $state('');
	let adminAvatarObjectUrl = $state<string | null>(null);
	let isPreparingAdminAvatar = $state(false);
	let isSavingAdminProfile = $state(false);

	const adminNavItems = $derived.by(() => {
		$currentLocale;
		return getAdminNavItems(data.activeSection);
	});

	const adminFooterNav = $derived.by(() => {
		$currentLocale;
		return getAdminFooterNav(data.activeSection);
	});

	const sectionTitle = $derived.by(() => {
		$currentLocale;
		return getAdminSectionTitle(data.activeSection);
	});

	const feedback = $derived((form ?? null) as AdminDashboardFeedback | null);
	const adminProfileAvatar = $derived(adminAvatarPreviewUrl || data.adminProfile.avatarUrl || '');
	const adminProfileInitial = $derived(data.adminProfile.displayName.slice(0, 1).toUpperCase());
	const adminAvatarUploadStatus = $derived.by(() => {
		if (isPreparingAdminAvatar) {
			return m.common_image_compressing();
		}

		if (isSavingAdminProfile && adminAvatarFile) {
			return m.common_image_uploading();
		}

		return '';
	});
	const selectedShippingOrder = $derived.by(() =>
		data.orders?.items.find((order) => order.id === selectedShippingOrderId) ?? null
	);
	const selectedVerificationSeller = $derived.by(() =>
		data.sellers?.items.find((seller) => seller.id === selectedVerificationSellerId) ?? null
	);
	const currentSellerVerificationFilter = $derived(data.sellers?.verificationFilter ?? 'pending');
	const currencyFormatter = $derived.by(
		() =>
			new Intl.NumberFormat($currentLocale, {
				style: 'currency',
				currency: 'USD'
			})
	);
	const dateFormatter = $derived.by(
		() =>
			new Intl.DateTimeFormat($currentLocale === 'en' ? 'en-US' : 'es-CL', {
				dateStyle: 'medium'
			})
	);

	const buildHref = (updates: Record<string, string | number | null | undefined>) => {
		const searchParams = new URLSearchParams(data.query);

		for (const [key, value] of Object.entries(updates)) {
			if (value === null || value === undefined || value === '') {
				searchParams.delete(key);
			} else {
				searchParams.set(key, String(value));
			}
		}

		if (!searchParams.has('section')) {
			searchParams.set('section', data.activeSection);
		}

		return `/admin/dashboard?${searchParams.toString()}`;
	};

	const percentLabel = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
	const progressClass = (progress: number) => {
		if (progress >= 75) {
			return 'w-3/4';
		}

		if (progress >= 60) {
			return 'w-2/3';
		}

		if (progress >= 45) {
			return 'w-1/2';
		}

		return 'w-1/3';
	};
	const statCards = $derived.by<AdminStat[]>(() => {
		$currentLocale;
		const overview = data.overview;

		if (!overview) {
			return [];
		}

		return [
			{
				label: m.dashboard_admin_stat_total_users(),
				value: new Intl.NumberFormat($currentLocale).format(overview.stats.totalUsers.value),
				change: percentLabel(overview.stats.totalUsers.change),
				changeTone: overview.stats.totalUsers.change >= 0 ? 'emerald' : 'brand',
				progressClass: progressClass(overview.stats.totalUsers.progress)
			},
			{
				label: m.dashboard_admin_stat_active_sellers(),
				value: new Intl.NumberFormat($currentLocale).format(overview.stats.activeSellers.value),
				change: percentLabel(overview.stats.activeSellers.change),
				changeTone: overview.stats.activeSellers.change >= 0 ? 'emerald' : 'brand',
				progressClass: progressClass(overview.stats.activeSellers.progress)
			},
			{
				label: m.dashboard_admin_stat_sales_volume(),
				value: currencyFormatter.format(overview.stats.monthlySales.value),
				change: percentLabel(overview.stats.monthlySales.change),
				changeTone: overview.stats.monthlySales.change >= 0 ? 'brand' : 'emerald',
				progressClass: progressClass(overview.stats.monthlySales.progress)
			}
		];
	});

	const userRoleValue = (roles: string[]) => (roles.includes('admin') ? 'admin' : roles[0] ?? 'buyer');
	const roleBadgeClass = (role: string) => {
		switch (role) {
			case 'admin':
				return 'bg-slate-900 text-white';
			case 'seller':
				return 'bg-blue-100 text-blue-700';
			default:
				return 'bg-emerald-100 text-emerald-700';
		}
	};
	const accountStateClass = (isActive: boolean) =>
		isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
	const sellerStateClass = accountStateClass;
	const productStateLabel = (isActive: boolean, stock: number) => {
		if (stock === 0) {
			return m.dashboard_admin_product_status_out_of_stock();
		}

		return isActive ? m.dashboard_admin_product_status_active() : m.dashboard_admin_product_status_inactive();
	};
	const productStateClass = (isActive: boolean, stock: number) => {
		if (stock === 0) {
			return 'bg-amber-100 text-amber-700';
		}

		return isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700';
	};
	const orderStateClass = (status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled') => {
		switch (status) {
			case 'processing':
				return 'bg-blue-100 text-blue-700';
			case 'shipped':
				return 'bg-violet-100 text-violet-700';
			case 'completed':
				return 'bg-emerald-100 text-emerald-700';
			case 'cancelled':
				return 'bg-rose-100 text-rose-700';
			default:
				return 'bg-amber-100 text-amber-700';
		}
	};

	const handlePasswordReset = async () => {
		if (passwordResetPending || data.adminProfile.isGoogleAccount) {
			return;
		}

		passwordResetPending = true;
		passwordResetMessage = '';

		try {
			await resetPassword(data.adminProfile.email);
			passwordResetSuccess = true;
			passwordResetMessage = m.dashboard_admin_password_sent();
		} catch {
			passwordResetSuccess = false;
			passwordResetMessage = m.dashboard_admin_password_failed();
		} finally {
			passwordResetPending = false;
		}
	};

	const revokeAdminAvatarPreview = () => {
		if (adminAvatarObjectUrl) {
			URL.revokeObjectURL(adminAvatarObjectUrl);
			adminAvatarObjectUrl = null;
		}
	};

	onDestroy(() => {
		revokeAdminAvatarPreview();
	});

	const clearAdminAvatarSelection = () => {
		revokeAdminAvatarPreview();
		adminAvatarFile = null;
		adminAvatarFileName = '';
		adminAvatarPreviewUrl = '';
	};

	const handleAdminAvatarChange = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;

		revokeAdminAvatarPreview();
		adminAvatarFile = file;
		adminAvatarFileName = file?.name ?? '';

		if (!file) {
			adminAvatarPreviewUrl = '';
			return;
		}

		adminAvatarObjectUrl = URL.createObjectURL(file);
		adminAvatarPreviewUrl = adminAvatarObjectUrl;
	};

	const enhanceAdminProfileForm: SubmitFunction = async ({ formData }) => {
		if (adminAvatarFile) {
			isPreparingAdminAvatar = true;
			const { file } = await compressImageFile(adminAvatarFile, AVATAR_IMAGE_COMPRESSION);
			formData.set('avatar', file);
			isPreparingAdminAvatar = false;
		}

		isSavingAdminProfile = true;

		return async ({ result, update }) => {
			try {
				await update();

				if (result.type === 'success') {
					clearAdminAvatarSelection();
				}
			} finally {
				isPreparingAdminAvatar = false;
				isSavingAdminProfile = false;
			}
		};
	};

	const openShippingDialog = (order: NonNullable<PageData['orders']>['items'][number]) => {
		selectedShippingOrderId = order.id;
		shippingProvider = order.shippingProvider ?? '';
		trackingNumber = order.trackingNumber ?? '';
		shippingDialog?.showModal();
	};

	const closeShippingDialog = () => {
		shippingDialog?.close();
	};

	const handleShippingDialogClose = () => {
		selectedShippingOrderId = null;
		shippingProvider = '';
		trackingNumber = '';
	};

	const verificationTabClass = (tab: 'pending' | 'approved' | 'rejected') =>
		currentSellerVerificationFilter === tab
			? 'bg-slate-900 text-white'
			: 'bg-slate-100 text-slate-700 hover:bg-slate-200';

	const openVerificationDialog = async (sellerId: string) => {
		selectedVerificationSellerId = sellerId;
		signedSelfieUrl = '';
		signedSelfieError = '';
		signedSelfieLoading = true;
		verificationDialog?.showModal();

		try {
			const response = await fetch(`/api/admin/sellers/${sellerId}/verification-selfie`);
			const payload = (await response.json().catch(() => ({}))) as {
				signedUrl?: string;
				message?: string;
			};

			if (!response.ok || !payload.signedUrl) {
				throw new Error(payload.message || m.dashboard_admin_verification_selfie_unavailable());
			}

			signedSelfieUrl = payload.signedUrl;
		} catch (error) {
			signedSelfieError =
				error instanceof Error
					? error.message
					: m.dashboard_admin_verification_selfie_unavailable();
		} finally {
			signedSelfieLoading = false;
		}
	};

	const handleVerificationDialogClose = () => {
		selectedVerificationSellerId = null;
		signedSelfieUrl = '';
		signedSelfieError = '';
		signedSelfieLoading = false;
	};

	const openRejectionDialog = (sellerId: string) => {
		selectedVerificationSellerId = sellerId;
		rejectionReason = '';
		rejectionDialog?.showModal();
	};

	const closeRejectionDialog = () => {
		rejectionDialog?.close();
	};

	const handleRejectionDialogClose = () => {
		rejectionReason = '';
		selectedVerificationSellerId = null;
	};
</script>

<svelte:head>
	<title>{m.dashboard_admin_page_title()}</title>
</svelte:head>

<div class="flex min-h-screen flex-col overflow-hidden bg-slate-50" data-locale={$currentLocale}>
	<div class="flex min-h-screen flex-col md:flex-row">
		<AdminSidebar footerItem={adminFooterNav} items={adminNavItems} />

		<main class="flex min-w-0 flex-1 flex-col overflow-hidden">
			<AdminTopbar
				adminName={data.adminProfile.displayName}
				avatarUrl={data.adminProfile.avatarUrl}
				title={sectionTitle}
			/>
			<div class="flex-1 space-y-8 overflow-y-auto p-4 md:p-8">
				{#if feedback?.message}
					<div
						class={`rounded-[1.25rem] border px-4 py-3 text-sm font-medium ${feedback.success ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}
					>
						{feedback.message}
					</div>
				{/if}

				{#if data.activeSection === 'panel' && data.overview}
					<AdminStatsGrid stats={statCards} />
					<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
						<AdminRecentOrders
							orders={data.overview.recentOrders}
							viewAllHref={buildAdminDashboardHref('orders')}
						/>
						<AdminNewSellers
							sellers={data.overview.newSellers}
							viewAllHref={buildAdminDashboardHref('sellers')}
						/>
					</div>
				{:else if data.activeSection === 'users' && data.users}
					<section class="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-card">
						<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<h3 class="text-xl font-semibold text-slate-900">{m.dashboard_admin_users_title()}</h3>
								<p class="mt-1 text-sm text-slate-500">{m.dashboard_admin_users_copy()}</p>
							</div>
							<form class="grid gap-3 sm:grid-cols-3" method="GET">
								<input name="section" type="hidden" value="users" />
								<input class="rounded-custom border border-slate-200 px-4 py-2 text-sm text-slate-700" name="usersSearch" placeholder={m.dashboard_admin_search_name_or_email()} value={data.users.search} />
								<select class="rounded-custom border border-slate-200 px-4 py-2 text-sm text-slate-700" name="usersRole">
									<option selected={data.users.roleFilter === 'all'} value="all">{m.dashboard_admin_filter_all_roles()}</option>
									<option selected={data.users.roleFilter === 'buyer'} value="buyer">buyer</option>
									<option selected={data.users.roleFilter === 'seller'} value="seller">seller</option>
									<option selected={data.users.roleFilter === 'admin'} value="admin">admin</option>
								</select>
								<button class="rounded-custom bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">{m.dashboard_admin_apply_filters()}</button>
							</form>
						</div>

						<div class="mt-6 overflow-x-auto">
							<table class="w-full min-w-[980px] border-collapse text-left">
								<thead>
									<tr class="bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
										<th class="px-4 py-3">{m.dashboard_admin_table_avatar()}</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_name()}</th>
										<th class="px-4 py-3">{m.common_email_address()}</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_roles()}</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_registered_at()}</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_status()}</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_actions()}</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-100">
									{#each data.users.items as user}
										<tr>
											<td class="px-4 py-4">
												<div class="h-10 w-10 overflow-hidden rounded-full bg-slate-100">
													{#if user.avatarUrl}
														<img alt={user.name} class="h-full w-full object-cover" src={user.avatarUrl} />
													{:else}
														<div class="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">{user.name.slice(0, 1).toUpperCase()}</div>
													{/if}
												</div>
											</td>
											<td class="px-4 py-4 text-sm font-semibold text-slate-900">{user.name}</td>
											<td class="px-4 py-4 text-sm text-slate-600">{user.email}</td>
											<td class="px-4 py-4">
												<div class="flex flex-wrap gap-2">
													{#each user.roles as role}
														<span class={`${roleBadgeClass(role)} rounded-full px-2 py-1 text-xs font-semibold`}>{role}</span>
													{/each}
												</div>
											</td>
											<td class="px-4 py-4 text-sm text-slate-600">{dateFormatter.format(new Date(user.createdAt))}</td>
											<td class="px-4 py-4"><span class={`${accountStateClass(user.isActive)} rounded-full px-2 py-1 text-xs font-semibold`}>{user.isActive ? m.dashboard_admin_status_active() : m.dashboard_admin_status_inactive()}</span></td>
											<td class="px-4 py-4">
												<div class="flex flex-col gap-2 xl:flex-row">
													<form class="flex items-center gap-2" method="POST">
														<input name="intent" type="hidden" value="update-user-role" />
														<input name="section" type="hidden" value="users" />
														<input name="profileId" type="hidden" value={user.id} />
														<select class="rounded-custom border border-slate-200 px-3 py-2 text-xs text-slate-700" name="nextRole">
															<option selected={userRoleValue(user.roles) === 'buyer'} value="buyer">buyer</option>
															<option selected={userRoleValue(user.roles) === 'seller'} value="seller">seller</option>
															<option selected={userRoleValue(user.roles) === 'admin'} value="admin">admin</option>
														</select>
														<button class="rounded-custom bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700" type="submit">{m.dashboard_admin_change_role()}</button>
													</form>
													<form method="POST">
														<input name="intent" type="hidden" value="toggle-user-active" />
														<input name="section" type="hidden" value="users" />
														<input name="profileId" type="hidden" value={user.id} />
														<input name="nextActive" type="hidden" value={user.isActive ? 'false' : 'true'} />
														<button class={`rounded-custom px-3 py-2 text-xs font-semibold ${user.isCurrentAdmin ? 'cursor-not-allowed bg-slate-100 text-slate-400' : user.isActive ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`} disabled={user.isCurrentAdmin} type="submit">{user.isActive ? m.dashboard_admin_deactivate_account() : m.dashboard_admin_activate_account()}</button>
													</form>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<div class="mt-6 flex items-center justify-between text-sm text-slate-500">
							<span>{m.dashboard_client_pagination_summary({ page: data.users.page, totalPages: data.users.totalPages })}</span>
							<div class="flex gap-2">
								<a class={`rounded-custom px-3 py-2 ${data.users.page === 1 ? 'pointer-events-none bg-slate-100 text-slate-400' : 'bg-white text-slate-700'}`} href={buildHref({ section: 'users', usersPage: data.users.page - 1 })}>{m.dashboard_client_pagination_previous()}</a>
								<a class={`rounded-custom px-3 py-2 ${data.users.page === data.users.totalPages ? 'pointer-events-none bg-slate-100 text-slate-400' : 'bg-white text-slate-700'}`} href={buildHref({ section: 'users', usersPage: data.users.page + 1 })}>{m.dashboard_client_pagination_next()}</a>
							</div>
						</div>
					</section>
				{:else if data.activeSection === 'sellers' && data.sellers}
					<section class="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-card">
						<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<h3 class="text-xl font-semibold text-slate-900">{m.dashboard_admin_sellers_title()}</h3>
								<p class="mt-1 text-sm text-slate-500">{m.dashboard_admin_sellers_copy()}</p>
							</div>
							<form class="grid gap-3 sm:grid-cols-2" method="GET">
								<input name="section" type="hidden" value="sellers" />
								<input name="sellersVerification" type="hidden" value={currentSellerVerificationFilter} />
								<input class="rounded-custom border border-slate-200 px-4 py-2 text-sm text-slate-700" name="sellersSearch" placeholder={m.dashboard_admin_search_store_or_slug()} value={data.sellers.search} />
								<button class="rounded-custom bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">{m.dashboard_admin_apply_filters()}</button>
							</form>
						</div>

						<div class="mt-6 flex flex-wrap gap-2">
							<a class={`rounded-full px-4 py-2 text-sm font-semibold ${verificationTabClass('pending')}`} href={buildHref({ section: 'sellers', sellersVerification: 'pending', sellersPage: 1 })}>{m.dashboard_admin_sellers_tab_pending()}</a>
							<a class={`rounded-full px-4 py-2 text-sm font-semibold ${verificationTabClass('approved')}`} href={buildHref({ section: 'sellers', sellersVerification: 'approved', sellersPage: 1 })}>{m.dashboard_admin_sellers_tab_approved()}</a>
							<a class={`rounded-full px-4 py-2 text-sm font-semibold ${verificationTabClass('rejected')}`} href={buildHref({ section: 'sellers', sellersVerification: 'rejected', sellersPage: 1 })}>{m.dashboard_admin_sellers_tab_rejected()}</a>
						</div>

						<div class="mt-6 overflow-x-auto">
							<table class="w-full min-w-[1100px] border-collapse text-left">
								<thead>
									<tr class="bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
										<th class="px-4 py-3">{m.dashboard_admin_table_logo()}</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_store()}</th>
										<th class="px-4 py-3">{m.auth_register_country()}</th>
										<th class="px-4 py-3">{m.auth_register_phone()}</th>
										<th class="px-4 py-3">{currentSellerVerificationFilter === 'rejected' ? m.dashboard_admin_rejection_reason_label() : m.dashboard_admin_seller_description_label()}</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_registered_at()}</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_status()}</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_actions()}</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-100">
									{#each data.sellers.items as seller (seller.id)}
										<tr class={seller.id === data.sellers.highlightSellerId ? 'bg-brand/5' : ''}>
											<td class="px-4 py-4">
												<div class="h-10 w-10 overflow-hidden rounded-full bg-slate-100">
													{#if seller.logoUrl}
														<img alt={seller.storeName} class="h-full w-full object-cover" src={seller.logoUrl} />
													{:else}
														<div class="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">{seller.storeName.slice(0, 1).toUpperCase()}</div>
													{/if}
												</div>
											</td>
											<td class="px-4 py-4 text-sm font-semibold text-slate-900">{seller.storeName}</td>
											<td class="px-4 py-4 text-sm text-slate-600">{seller.country ?? '—'}</td>
											<td class="px-4 py-4 text-sm text-slate-600">{seller.phone ?? '—'}</td>
											<td class="px-4 py-4 text-sm text-slate-600">{currentSellerVerificationFilter === 'rejected' ? (seller.rejectionReason ?? '—') : (seller.description ?? '—')}</td>
											<td class="px-4 py-4 text-sm text-slate-600">{dateFormatter.format(new Date(seller.createdAt))}</td>
											<td class="px-4 py-4">
												<div class="flex flex-col gap-2">
													<span class={`${sellerStateClass(seller.isActive)} inline-flex w-fit rounded-full px-2 py-1 text-xs font-semibold`}>
														{seller.verificationStatus === 'pending' ? m.dashboard_admin_status_pending() : seller.verificationStatus === 'approved' ? m.dashboard_admin_seller_status_approved() : m.dashboard_admin_seller_status_rejected()}
													</span>
													{#if seller.verifiedAt}
														<span class="text-xs text-slate-500">{m.dashboard_admin_verified_at_label()} {dateFormatter.format(new Date(seller.verifiedAt))}</span>
													{/if}
												</div>
											</td>
											<td class="px-4 py-4">
												<div class="flex flex-wrap gap-2">
													<button class="rounded-custom bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700" onclick={() => openVerificationDialog(seller.id)} type="button">{m.dashboard_admin_view_selfie()}</button>
													{#if seller.verificationStatus === 'pending'}
														<form method="POST">
															<input name="intent" type="hidden" value="approve-seller-verification" />
															<input name="section" type="hidden" value="sellers" />
															<input name="sellerId" type="hidden" value={seller.id} />
															<button class="rounded-custom bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700" type="submit">{m.dashboard_admin_approve_seller()}</button>
														</form>
														<button class="rounded-custom bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" onclick={() => openRejectionDialog(seller.id)} type="button">{m.dashboard_admin_reject_seller()}</button>
													{:else if seller.verificationStatus === 'approved'}
														<form method="POST">
															<input name="intent" type="hidden" value="toggle-seller-active" />
															<input name="section" type="hidden" value="sellers" />
															<input name="sellerId" type="hidden" value={seller.id} />
															<input name="nextActive" type="hidden" value={seller.isActive ? 'false' : 'true'} />
															<button class={`rounded-custom px-3 py-2 text-xs font-semibold ${seller.isActive ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`} type="submit">{seller.isActive ? m.dashboard_admin_deactivate_seller() : m.dashboard_admin_activate_seller()}</button>
														</form>
													{/if}
													<a class="rounded-custom bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700" href={seller.storeHref}>{m.dashboard_admin_view_store()}</a>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<div class="mt-6 flex items-center justify-between text-sm text-slate-500">
							<span>{m.dashboard_client_pagination_summary({ page: data.sellers.page, totalPages: data.sellers.totalPages })}</span>
							<div class="flex gap-2">
								<a class={`rounded-custom px-3 py-2 ${data.sellers.page === 1 ? 'pointer-events-none bg-slate-100 text-slate-400' : 'bg-white text-slate-700'}`} href={buildHref({ section: 'sellers', sellersVerification: currentSellerVerificationFilter, sellersPage: data.sellers.page - 1 })}>{m.dashboard_client_pagination_previous()}</a>
								<a class={`rounded-custom px-3 py-2 ${data.sellers.page === data.sellers.totalPages ? 'pointer-events-none bg-slate-100 text-slate-400' : 'bg-white text-slate-700'}`} href={buildHref({ section: 'sellers', sellersVerification: currentSellerVerificationFilter, sellersPage: data.sellers.page + 1 })}>{m.dashboard_client_pagination_next()}</a>
							</div>
						</div>
					</section>
				{:else if data.activeSection === 'products' && data.products}
					<section class="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-card">
						<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<h3 class="text-xl font-semibold text-slate-900">{m.dashboard_admin_products_title()}</h3>
								<p class="mt-1 text-sm text-slate-500">{m.dashboard_admin_products_copy()}</p>
							</div>
							<form class="grid gap-3 sm:grid-cols-3" method="GET">
								<input name="section" type="hidden" value="products" />
								<input class="rounded-custom border border-slate-200 px-4 py-2 text-sm text-slate-700" name="productsSearch" placeholder={m.dashboard_admin_search_product_name()} value={data.products.search} />
								<select class="rounded-custom border border-slate-200 px-4 py-2 text-sm text-slate-700" name="productsStatus">
									<option selected={data.products.statusFilter === 'all'} value="all">{m.dashboard_admin_filter_all_statuses()}</option>
									<option selected={data.products.statusFilter === 'active'} value="active">{m.dashboard_admin_product_status_active()}</option>
									<option selected={data.products.statusFilter === 'inactive'} value="inactive">{m.dashboard_admin_product_status_inactive()}</option>
									<option selected={data.products.statusFilter === 'out_of_stock'} value="out_of_stock">{m.dashboard_admin_product_status_out_of_stock()}</option>
								</select>
								<button class="rounded-custom bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">{m.dashboard_admin_apply_filters()}</button>
							</form>
						</div>

						<div class="mt-6 overflow-x-auto">
							<table class="w-full min-w-[980px] border-collapse text-left">
								<thead>
									<tr class="bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
										<th class="px-4 py-3">{m.dashboard_admin_table_photo()}</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_product()}</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_seller()}</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_price()}</th>
										<th class="px-4 py-3">stock</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_status()}</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_created_at()}</th>
										<th class="px-4 py-3">{m.dashboard_admin_table_actions()}</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-100">
									{#each data.products.items as product}
										<tr>
											<td class="px-4 py-4">
												<div class="h-12 w-12 overflow-hidden rounded-custom bg-slate-100">
													{#if product.imageUrl}
														<img alt={product.name} class="h-full w-full object-cover" src={product.imageUrl} />
													{/if}
												</div>
											</td>
											<td class="px-4 py-4 text-sm font-semibold text-slate-900">{product.name}</td>
											<td class="px-4 py-4 text-sm text-slate-600">{product.sellerName}</td>
											<td class="px-4 py-4 text-sm text-slate-700">{currencyFormatter.format(product.price)}</td>
											<td class="px-4 py-4 text-sm text-slate-700">{product.stock}</td>
											<td class="px-4 py-4"><span class={`${productStateClass(product.isActive, product.stock)} rounded-full px-2 py-1 text-xs font-semibold`}>{productStateLabel(product.isActive, product.stock)}</span></td>
											<td class="px-4 py-4 text-sm text-slate-600">{dateFormatter.format(new Date(product.createdAt))}</td>
											<td class="px-4 py-4">
												<div class="flex flex-wrap gap-2">
													<form method="POST">
														<input name="intent" type="hidden" value="toggle-product-active" />
														<input name="section" type="hidden" value="products" />
														<input name="productId" type="hidden" value={product.id} />
														<input name="nextActive" type="hidden" value={product.isActive ? 'false' : 'true'} />
														<button class={`rounded-custom px-3 py-2 text-xs font-semibold ${product.isActive ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`} type="submit">{product.isActive ? m.dashboard_admin_deactivate_product() : m.dashboard_admin_activate_product()}</button>
													</form>
													<form method="POST" onsubmit={() => confirm(m.dashboard_admin_delete_product_confirm())}>
														<input name="intent" type="hidden" value="delete-product" />
														<input name="section" type="hidden" value="products" />
														<input name="productId" type="hidden" value={product.id} />
														<button class="rounded-custom bg-slate-900 px-3 py-2 text-xs font-semibold text-white" type="submit">{m.dashboard_admin_delete_product()}</button>
													</form>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<div class="mt-6 flex items-center justify-between text-sm text-slate-500">
							<span>{m.dashboard_client_pagination_summary({ page: data.products.page, totalPages: data.products.totalPages })}</span>
							<div class="flex gap-2">
								<a class={`rounded-custom px-3 py-2 ${data.products.page === 1 ? 'pointer-events-none bg-slate-100 text-slate-400' : 'bg-white text-slate-700'}`} href={buildHref({ section: 'products', productsPage: data.products.page - 1 })}>{m.dashboard_client_pagination_previous()}</a>
								<a class={`rounded-custom px-3 py-2 ${data.products.page === data.products.totalPages ? 'pointer-events-none bg-slate-100 text-slate-400' : 'bg-white text-slate-700'}`} href={buildHref({ section: 'products', productsPage: data.products.page + 1 })}>{m.dashboard_client_pagination_next()}</a>
							</div>
						</div>
					</section>
				{:else if data.activeSection === 'orders' && data.orders}
					<section class="space-y-6 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-card">
						<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<h3 class="text-xl font-semibold text-slate-900">{m.dashboard_admin_orders_title()}</h3>
								<p class="mt-1 text-sm text-slate-500">{m.dashboard_admin_orders_copy()}</p>
							</div>
							<form class="grid gap-3 sm:grid-cols-3" method="GET">
								<input name="section" type="hidden" value="orders" />
								<input class="rounded-custom border border-slate-200 px-4 py-2 text-sm text-slate-700" name="ordersSearch" placeholder={m.dashboard_admin_search_order_or_buyer()} value={data.orders.search} />
								<select class="rounded-custom border border-slate-200 px-4 py-2 text-sm text-slate-700" name="ordersStatus">
									<option selected={data.orders.statusFilter === 'all'} value="all">{m.dashboard_admin_filter_all_statuses()}</option>
									<option selected={data.orders.statusFilter === 'pending'} value="pending">{m.dashboard_admin_status_pending()}</option>
									<option selected={data.orders.statusFilter === 'processing'} value="processing">{m.dashboard_admin_status_processing()}</option>
									<option selected={data.orders.statusFilter === 'shipped'} value="shipped">{m.dashboard_admin_status_shipped()}</option>
									<option selected={data.orders.statusFilter === 'completed'} value="completed">{m.dashboard_admin_status_completed()}</option>
									<option selected={data.orders.statusFilter === 'cancelled'} value="cancelled">{m.dashboard_admin_status_cancelled()}</option>
								</select>
								<button class="rounded-custom bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">{m.dashboard_admin_apply_filters()}</button>
							</form>
						</div>

						<div class="grid gap-4">
							{#each data.orders.items as order}
								<details class="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50">
									<summary class="grid cursor-pointer grid-cols-2 gap-4 px-5 py-4 text-sm text-slate-700 marker:hidden lg:grid-cols-[1.15fr_1fr_1fr_0.8fr_0.7fr_0.85fr]">
										<span class="font-semibold text-slate-900">{order.orderNumber}</span>
										<span>{order.buyerName}</span>
										<span>{order.sellerName}</span>
										<span>{currencyFormatter.format(order.total)}</span>
										<span class={`${orderStateClass(order.status)} inline-flex w-fit rounded-full px-2 py-1 text-xs font-semibold`}>{getAdminOrderStatusLabel(order.status)}</span>
										<span>{dateFormatter.format(new Date(order.createdAt))}</span>
									</summary>

									<div class="border-t border-slate-200 bg-white p-5">
										<div class="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
											<div>
												<h4 class="text-sm font-semibold tracking-[0.16em] text-slate-400 uppercase">{m.dashboard_admin_order_detail_title()}</h4>
												<div class="mt-4 space-y-3">
													{#each order.items as item}
														<div class="flex items-center justify-between rounded-custom border border-slate-100 px-4 py-3 text-sm">
															<div>
																<p class="font-medium text-slate-900">{item.productName}</p>
																<p class="text-slate-500">{m.dashboard_admin_order_item_meta({ quantity: item.quantity, price: currencyFormatter.format(item.unitPrice) })}</p>
															</div>
															<p class="font-semibold text-slate-900">{currencyFormatter.format(item.total)}</p>
														</div>
													{/each}
												</div>

												{#if order.trackingNumber || order.shippingProvider || order.shippedAt}
													<div class="mt-5 rounded-[1.25rem] border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
														<p class="font-semibold">{m.dashboard_admin_shipping_summary_title()}</p>
														<div class="mt-3 grid gap-2 text-sm">
															{#if order.shippingProvider}
																<p><span class="font-semibold">{m.dashboard_admin_shipping_provider_label()}:</span> {order.shippingProvider}</p>
															{/if}
															{#if order.trackingNumber}
																<p><span class="font-semibold">{m.dashboard_admin_tracking_number_label()}:</span> {order.trackingNumber}</p>
															{/if}
															{#if order.shippedAt}
																<p><span class="font-semibold">{m.dashboard_admin_shipped_at_label()}:</span> {dateFormatter.format(new Date(order.shippedAt))}</p>
															{/if}
														</div>
													</div>
												{/if}
											</div>

											<div class="space-y-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
												<form method="POST">
													<input name="intent" type="hidden" value="update-order-status" />
													<input name="section" type="hidden" value="orders" />
													<input name="orderId" type="hidden" value={order.id} />
													<h4 class="text-sm font-semibold text-slate-900">{m.dashboard_admin_change_order_status()}</h4>
													<select class="mt-4 w-full rounded-custom border border-slate-200 px-4 py-2 text-sm text-slate-700" name="nextStatus">
														<option selected={order.status === 'pending'} value="pending">{m.dashboard_admin_status_pending()}</option>
														<option selected={order.status === 'processing'} value="processing">{m.dashboard_admin_status_processing()}</option>
														{#if order.status === 'shipped'}
															<option selected value="shipped">{m.dashboard_admin_status_shipped()}</option>
														{/if}
														<option selected={order.status === 'completed'} value="completed">{m.dashboard_admin_status_completed()}</option>
														<option selected={order.status === 'cancelled'} value="cancelled">{m.dashboard_admin_status_cancelled()}</option>
													</select>
													<button class="mt-4 rounded-custom bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">{m.dashboard_admin_save_order_status()}</button>
												</form>

												{#if order.status === 'pending' || order.status === 'processing'}
													<div class="rounded-[1rem] border border-dashed border-violet-200 bg-white p-4">
														<p class="text-sm font-semibold text-slate-900">{m.dashboard_admin_shipping_modal_title()}</p>
														<p class="mt-1 text-sm text-slate-500">{m.dashboard_admin_shipping_modal_copy()}</p>
														<button class="mt-4 rounded-custom bg-violet-600 px-4 py-2 text-sm font-semibold text-white" onclick={() => openShippingDialog(order)} type="button">{m.dashboard_admin_mark_as_shipped()}</button>
													</div>
												{/if}
											</div>
										</div>
									</div>
								</details>
							{/each}
						</div>

						<div class="flex items-center justify-between text-sm text-slate-500">
							<span>{m.dashboard_client_pagination_summary({ page: data.orders.page, totalPages: data.orders.totalPages })}</span>
							<div class="flex gap-2">
								<a class={`rounded-custom px-3 py-2 ${data.orders.page === 1 ? 'pointer-events-none bg-slate-100 text-slate-400' : 'bg-white text-slate-700'}`} href={buildHref({ section: 'orders', ordersPage: data.orders.page - 1 })}>{m.dashboard_client_pagination_previous()}</a>
								<a class={`rounded-custom px-3 py-2 ${data.orders.page === data.orders.totalPages ? 'pointer-events-none bg-slate-100 text-slate-400' : 'bg-white text-slate-700'}`} href={buildHref({ section: 'orders', ordersPage: data.orders.page + 1 })}>{m.dashboard_client_pagination_next()}</a>
							</div>
						</div>
					</section>
				{:else if data.activeSection === 'reports' && data.reports}
					<section class="space-y-6">
						<AdminReportsCharts
							newUsersByMonth={data.reports.newUsersByMonth}
							revenueByMonth={data.reports.revenueByMonth}
						/>

						<div class="grid gap-6 xl:grid-cols-2">
							<section class="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-card">
								<h3 class="text-lg font-semibold text-slate-900">{m.dashboard_admin_reports_top_sellers()}</h3>
								<div class="mt-5 space-y-3">
									{#each data.reports.topSellers as seller, index}
										<div class="flex items-center justify-between rounded-custom bg-slate-50 px-4 py-3">
											<div>
												<p class="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">#{index + 1}</p>
												<p class="mt-1 font-semibold text-slate-900">{seller.name}</p>
											</div>
											<p class="text-sm font-semibold text-slate-700">{currencyFormatter.format(seller.value)}</p>
										</div>
									{/each}
								</div>
							</section>

							<section class="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-card">
								<h3 class="text-lg font-semibold text-slate-900">{m.dashboard_admin_reports_top_products()}</h3>
								<div class="mt-5 space-y-3">
									{#each data.reports.topProducts as product, index}
										<div class="flex items-center justify-between rounded-custom bg-slate-50 px-4 py-3">
											<div>
												<p class="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">#{index + 1}</p>
												<p class="mt-1 font-semibold text-slate-900">{product.name}</p>
											</div>
											<p class="text-sm font-semibold text-slate-700">{m.dashboard_admin_units_sold({ count: product.value })}</p>
										</div>
									{/each}
								</div>
							</section>
						</div>
					</section>
				{:else if data.activeSection === 'settings'}
					<section class="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-card">
						<div class="max-w-3xl">
							<h3 class="text-xl font-semibold text-slate-900">{m.dashboard_admin_settings_title()}</h3>
							<p class="mt-1 text-sm text-slate-500">{m.dashboard_admin_settings_copy()}</p>
						</div>

						<form class="mt-6 grid gap-6" enctype="multipart/form-data" method="POST" use:enhance={enhanceAdminProfileForm}>
							<input name="intent" type="hidden" value="update-profile" />
							<input name="section" type="hidden" value="settings" />
							<div class="grid gap-6 md:grid-cols-[0.4fr_0.6fr]">
								<div class="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-6">
									<div class="h-24 w-24 overflow-hidden rounded-full bg-slate-200">
										{#if adminProfileAvatar}
											<img alt={data.adminProfile.displayName} class="h-full w-full object-cover" src={adminProfileAvatar} />
										{:else}
											<div class="flex h-full w-full items-center justify-center text-2xl font-semibold text-slate-600">{adminProfileInitial}</div>
										{/if}
									</div>
									<div class="mt-4">
										<ImageUploadField
											accept="image/jpeg,image/png,image/webp"
											busy={isPreparingAdminAvatar || (isSavingAdminProfile && Boolean(adminAvatarFile))}
											buttonLabel={m.common_select_image()}
											fileName={adminAvatarFileName}
											icon="camera"
											id="admin-avatar"
											label={m.dashboard_admin_profile_photo()}
											name="avatar"
											onchange={handleAdminAvatarChange}
											previewAlt={data.adminProfile.displayName}
											previewClass="h-48 w-full rounded-custom object-cover"
											previewUrl={adminAvatarFileName ? adminAvatarPreviewUrl : ''}
											statusText={adminAvatarUploadStatus}
										/>
									</div>
								</div>

								<div class="grid gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-6">
									<label class="grid gap-2 text-sm font-medium text-slate-700">
										<span>{m.auth_display_name()}</span>
										<input class="rounded-custom border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800" name="displayName" type="text" value={data.adminProfile.displayName} />
									</label>

									<label class="grid gap-2 text-sm font-medium text-slate-700">
										<span>{m.common_email_address()}</span>
										<input class="rounded-custom border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500" readonly type="email" value={data.adminProfile.email} />
									</label>

									<button class="mt-2 w-fit rounded-custom bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300" disabled={isSavingAdminProfile} type="submit">{m.dashboard_admin_save_profile()}</button>
								</div>
							</div>
						</form>

						<div class="mt-8 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-6">
							<h4 class="text-lg font-semibold text-slate-900">{m.dashboard_admin_password_title()}</h4>
							{#if data.adminProfile.isGoogleAccount}
								<p class="mt-2 text-sm text-slate-500">{m.dashboard_admin_google_auth_copy()}</p>
							{:else}
								<p class="mt-2 text-sm text-slate-500">{m.dashboard_admin_password_copy()}</p>
								<button class="mt-4 rounded-custom bg-white px-4 py-3 text-sm font-semibold text-slate-700" disabled={passwordResetPending} onclick={handlePasswordReset} type="button">{passwordResetPending ? m.auth_sending_email() : m.dashboard_admin_password_action()}</button>
							{/if}

							{#if passwordResetMessage}
								<p class={`mt-3 text-sm ${passwordResetSuccess ? 'text-emerald-700' : 'text-rose-700'}`}>{passwordResetMessage}</p>
							{/if}
						</div>
					</section>
				{/if}
			</div>

			<dialog bind:this={verificationDialog} class="backdrop:bg-slate-950/45 mx-auto w-full max-w-3xl rounded-[1.5rem] border border-slate-200 p-0 shadow-2xl" onclose={handleVerificationDialogClose}>
				<div class="space-y-5 bg-white p-6">
					<div class="flex items-start justify-between gap-4">
						<div>
							<h3 class="text-lg font-semibold text-slate-900">{m.dashboard_admin_verification_selfie_modal_title()}</h3>
							{#if selectedVerificationSeller}
								<p class="mt-1 text-sm text-slate-500">{selectedVerificationSeller.storeName}</p>
							{/if}
						</div>
						<button class="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600" onclick={() => verificationDialog?.close()} type="button">{m.common_close()}</button>
					</div>

					{#if signedSelfieLoading}
						<p class="text-sm text-slate-500">{m.dashboard_admin_verification_selfie_loading()}</p>
					{:else if signedSelfieError}
						<p class="rounded-custom border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{signedSelfieError}</p>
					{:else if signedSelfieUrl}
						<img alt={m.dashboard_admin_verification_selfie_modal_title()} class="max-h-[70vh] w-full rounded-[1.25rem] border border-slate-200 object-contain" src={signedSelfieUrl} />
					{/if}
				</div>
			</dialog>

			<dialog bind:this={rejectionDialog} class="backdrop:bg-slate-950/45 mx-auto w-full max-w-xl rounded-[1.5rem] border border-slate-200 p-0 shadow-2xl" onclose={handleRejectionDialogClose}>
				<form class="space-y-5 bg-white p-6" method="POST">
					<input name="intent" type="hidden" value="reject-seller-verification" />
					<input name="section" type="hidden" value="sellers" />
					<input name="sellerId" type="hidden" value={selectedVerificationSellerId ?? ''} />
					<div class="flex items-start justify-between gap-4">
						<div>
							<h3 class="text-lg font-semibold text-slate-900">{m.dashboard_admin_reject_seller_modal_title()}</h3>
							<p class="mt-1 text-sm text-slate-500">{m.dashboard_admin_reject_seller_modal_copy()}</p>
						</div>
						<button class="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600" onclick={closeRejectionDialog} type="button">{m.common_close()}</button>
					</div>

					<div>
						<label class="block text-sm font-medium text-slate-700" for="seller-rejection-reason">{m.dashboard_admin_rejection_reason_label()}</label>
						<textarea bind:value={rejectionReason} class="mt-1 block w-full rounded-custom border-slate-300 bg-white px-4 py-3 focus:border-brand focus:ring-brand" id="seller-rejection-reason" maxlength="300" minlength="5" name="rejectionReason" required rows="5"></textarea>
					</div>

					<div class="flex justify-end gap-3">
						<button class="rounded-custom bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700" onclick={closeRejectionDialog} type="button">{m.common_cancel()}</button>
						<button class="rounded-custom bg-rose-600 px-4 py-3 text-sm font-semibold text-white" type="submit">{m.dashboard_admin_reject_seller()}</button>
					</div>
				</form>
			</dialog>

			<dialog bind:this={shippingDialog} class="backdrop:bg-slate-950/45 mx-auto w-full max-w-lg rounded-[1.5rem] border border-slate-200 p-0 shadow-2xl" onclose={handleShippingDialogClose}>
				{#if selectedShippingOrder}
					<form class="p-6" method="POST">
						<input name="intent" type="hidden" value="mark-order-shipped" />
						<input name="section" type="hidden" value="orders" />
						<input name="orderId" type="hidden" value={selectedShippingOrder.id} />
						<div class="flex items-start justify-between gap-4">
							<div>
								<p class="text-xs font-semibold tracking-[0.18em] text-violet-600 uppercase">{m.dashboard_admin_shipping_modal_title()}</p>
								<h3 class="mt-2 text-xl font-semibold text-slate-900">{selectedShippingOrder.orderNumber}</h3>
								<p class="mt-2 text-sm text-slate-500">{m.dashboard_admin_shipping_modal_copy()}</p>
							</div>
							<button class="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600" onclick={closeShippingDialog} type="button">{m.common_close()}</button>
						</div>

						<div class="mt-6 grid gap-4">
							<label class="grid gap-2 text-sm font-medium text-slate-700">
								<span>{m.dashboard_admin_shipping_provider_label()}</span>
								<input bind:value={shippingProvider} class="rounded-custom border border-slate-200 px-4 py-3 text-sm text-slate-800" list="shipping-provider-options" name="shippingProvider" placeholder={m.dashboard_admin_shipping_provider_placeholder()} required type="text" />
							</label>

							<datalist id="shipping-provider-options">
								<option value="DHL"></option>
								<option value="FedEx"></option>
								<option value="Correos"></option>
								<option value="Otro"></option>
							</datalist>

							<label class="grid gap-2 text-sm font-medium text-slate-700">
								<span>{m.dashboard_admin_tracking_number_label()}</span>
								<input bind:value={trackingNumber} class="rounded-custom border border-slate-200 px-4 py-3 text-sm text-slate-800" name="trackingNumber" placeholder={m.dashboard_admin_tracking_number_placeholder()} required type="text" />
							</label>
						</div>

						<div class="mt-6 flex items-center justify-end gap-3">
							<button class="rounded-custom bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700" onclick={closeShippingDialog} type="button">{m.common_cancel()}</button>
							<button class="rounded-custom bg-violet-600 px-4 py-3 text-sm font-semibold text-white" type="submit">{m.dashboard_admin_confirm_shipping()}</button>
						</div>
					</form>
				{/if}
			</dialog>
		</main>
	</div>
</div>

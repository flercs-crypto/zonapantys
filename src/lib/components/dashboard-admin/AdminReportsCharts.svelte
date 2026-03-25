<script lang="ts">
	import { browser } from '$app/environment';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import Chart from 'chart.js/auto';
	import type { AdminReportPoint } from '$lib/services/admin-dashboard.server';

	type Props = {
		revenueByMonth: AdminReportPoint[];
		newUsersByMonth: AdminReportPoint[];
	};

	let { revenueByMonth, newUsersByMonth }: Props = $props();
	let revenueCanvas = $state<HTMLCanvasElement | null>(null);
	let usersCanvas = $state<HTMLCanvasElement | null>(null);
	let revenueChart: Chart | null = null;
	let usersChart: Chart | null = null;

	const localeTag = $derived($currentLocale === 'en' ? 'en-US' : 'es-CL');
	const monthFormatter = $derived.by(
		() =>
			new Intl.DateTimeFormat(localeTag, {
				month: 'short'
			})
	);
	const currencyFormatter = $derived.by(
		() =>
			new Intl.NumberFormat(localeTag, {
				style: 'currency',
				currency: 'USD',
				maximumFractionDigits: 0
			})
	);

	$effect(() => {
		if (!browser || !revenueCanvas || !usersCanvas) {
			return;
		}

		const labels = revenueByMonth.map((point) =>
			monthFormatter.format(new Date(`${point.month}-01T00:00:00Z`))
		);

		revenueChart?.destroy();
		usersChart?.destroy();

		revenueChart = new Chart(revenueCanvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: m.dashboard_admin_reports_revenue_chart_title(),
						data: revenueByMonth.map((point) => point.value),
						backgroundColor: '#0f172a',
						borderRadius: 12,
						maxBarThickness: 34
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							label: (context) => currencyFormatter.format(Number(context.raw ?? 0))
						}
					}
				},
				scales: {
					x: {
						grid: {
							display: false
						},
						border: {
							display: false
						}
					},
					y: {
						beginAtZero: true,
						grid: {
							color: 'rgba(148, 163, 184, 0.18)'
						},
						border: {
							display: false
						},
						ticks: {
							callback: (value) => currencyFormatter.format(Number(value))
						}
					}
				}
			}
		});

		usersChart = new Chart(usersCanvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: m.dashboard_admin_reports_users_chart_title(),
						data: newUsersByMonth.map((point) => point.value),
						borderColor: '#2563eb',
						backgroundColor: 'rgba(37, 99, 235, 0.14)',
						tension: 0.35,
						fill: true,
						pointRadius: 3,
						pointHoverRadius: 4
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					}
				},
				scales: {
					x: {
						grid: {
							display: false
						},
						border: {
							display: false
						}
					},
					y: {
						beginAtZero: true,
						grid: {
							color: 'rgba(148, 163, 184, 0.18)'
						},
						border: {
							display: false
						}
					}
				}
			}
		});

		return () => {
			revenueChart?.destroy();
			usersChart?.destroy();
			revenueChart = null;
			usersChart = null;
		};
	});
</script>

<div class="grid gap-6 xl:grid-cols-2" data-locale={$currentLocale}>
	<section class="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-card">
		<div class="flex items-center justify-between gap-4">
			<div>
				<h3 class="text-lg font-semibold text-slate-900">
					{m.dashboard_admin_reports_revenue_chart_title()}
				</h3>
				<p class="mt-1 text-sm text-slate-500">
					{m.dashboard_admin_reports_revenue_chart_copy()}
				</p>
			</div>
		</div>

		<div class="mt-6 h-80">
			<canvas bind:this={revenueCanvas}></canvas>
		</div>
	</section>

	<section class="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-card">
		<div class="flex items-center justify-between gap-4">
			<div>
				<h3 class="text-lg font-semibold text-slate-900">
					{m.dashboard_admin_reports_users_chart_title()}
				</h3>
				<p class="mt-1 text-sm text-slate-500">
					{m.dashboard_admin_reports_users_chart_copy()}
				</p>
			</div>
		</div>

		<div class="mt-6 h-80">
			<canvas bind:this={usersCanvas}></canvas>
		</div>
	</section>
</div>
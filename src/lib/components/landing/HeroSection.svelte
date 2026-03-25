<script lang="ts">
	import { resolve } from '$app/paths';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
</script>

<section class="relative overflow-hidden bg-white py-18 md:py-24" data-locale={$currentLocale}>
	<div
		class="absolute inset-x-0 top-0 z-0 h-72 bg-linear-to-b from-brand-light via-white to-white"
	></div>
	<div
		class="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8"
	>
		<div class="space-y-8 self-center">
			<div
				class="inline-flex rounded-full border border-brand/10 bg-brand-light px-4 py-1 text-sm font-semibold text-brand"
			>
				{m.landing_hero_badge()}
			</div>
			<div class="space-y-5">
				<h1 class="max-w-3xl text-5xl leading-tight font-extrabold text-slate-950 md:text-6xl">
					{m.landing_hero_title_prefix()}
					<span class="text-brand">{m.landing_hero_title_highlight()}</span>
				</h1>
				<p class="max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
					{m.landing_hero_copy()}
				</p>
			</div>
			<div class="flex flex-col gap-4 sm:flex-row">
				<a
					class="group inline-flex items-center justify-center gap-3 rounded-[1.15rem] border border-brand/15 bg-brand px-8 py-4 text-center text-lg font-bold text-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:bg-brand-dark"
					href={resolve('/vendedoras')}
				>
					{m.landing_hero_primary_cta()}
					<svg
						aria-hidden="true"
						class="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							d="M5 12h14m-6-6 6 6-6 6"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.25"
						></path>
					</svg>
				</a>
				<a
					class="rounded-custom border border-brand/20 bg-brand-light px-8 py-4 text-center text-lg font-bold text-brand hover:border-brand hover:bg-white"
					href={resolve('/register')}
				>
					{m.landing_hero_secondary_cta()}
				</a>
			</div>
		</div>

		<div class="relative">
			<div
				class="absolute -inset-6 rounded-4xl bg-linear-to-br from-brand/15 to-transparent blur-3xl"
			></div>
			<div
				class="relative overflow-hidden rounded-3xl border border-white/50 shadow-2xl shadow-brand/15"
			>
				<img
					alt={m.landing_hero_image_alt()}
					class="h-full w-full object-cover"
					src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtzcGkW683tFUX55q1k1jkz2NW6r265kOhU3O7vxHCuFKAym-dLq8oaHt7NxxciT5nmXdF4Pk1kY-216PYY6Wn57MdgOL675cpCwdOoET5Qlhmb29Np1S4_t4rx-cLhEZqCEpLJBpbAJ6nxMnP6j6Q6o8ZNDVQrmBxvkUPfq1XK473XQ-ZwrtrVyL1_mNukGY6RdO_qHwjHY_ZgKToOD2Cenq4tA0kQFQlEwooQAf9_98pe98dClkvKIQXsOFA89zYeRuzPcSjMF4"
				/>
			</div>
		</div>
	</div>
</section>

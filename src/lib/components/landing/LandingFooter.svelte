<script lang="ts">
	import BrandLogoLink from '$lib/components/brand/BrandLogoLink.svelte';
	import { resolve } from '$app/paths';
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
	import type { FooterGroup, LandingNavLink } from './data';

	type Props = {
		groups: FooterGroup[];
		socialLinks: LandingNavLink[];
	};

	let { groups, socialLinks }: Props = $props();
</script>

<footer class="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8" data-locale={$currentLocale}>
	<div class="mx-auto max-w-7xl">
		<div class="mb-12 grid gap-12 border-b border-slate-800 pb-12 md:grid-cols-4">
			<div>
				<BrandLogoLink rootClass="inline-flex items-center" imageClass="h-12 w-auto" title="" />
				<p class="mt-4 max-w-xs text-sm leading-7 text-slate-400">
					{m.landing_footer_copy()}
				</p>
			</div>

			{#each groups as group (group.title)}
				<div>
					<h4 class="mb-5 font-bold text-white">{group.title}</h4>
					<ul class="space-y-3 text-sm text-slate-400">
						{#each group.links as link (link.href)}
							<li>
								<a class="hover:text-brand" href={resolve(link.href)}>{link.label}</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<div
			class="flex flex-col items-center justify-between gap-4 text-xs text-slate-500 md:flex-row"
		>
			<p>{m.landing_footer_copyright()}</p>
			<div class="flex gap-6">
				{#each socialLinks as link (link.label)}
					<a class="hover:text-white" href={link.href}>{link.label}</a>
				{/each}
			</div>
		</div>
	</div>
</footer>

<script lang="ts">
	import { currentLocale } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages.js';
</script>

<section class="overflow-hidden bg-brand py-20 text-white" id="impact" data-locale={$currentLocale}>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="max-w-3xl space-y-6">
			<h2 class="text-4xl font-bold">{m.landing_sustainability_title()}</h2>
			<p class="text-lg leading-8 text-white/85">
				{m.landing_sustainability_copy()}
			</p>
			<div class="grid gap-8 border-t border-white/20 pt-8 sm:grid-cols-2">
				<div>
					<span class="block text-3xl font-bold">{m.landing_sustainability_stat_1_value()}</span>
					<span class="text-sm tracking-[0.2em] text-white/75 uppercase"
						>{m.landing_sustainability_stat_1_label()}</span
					>
				</div>
				<div>
					<span class="block text-3xl font-bold">{m.landing_sustainability_stat_2_value()}</span>
					<span class="text-sm tracking-[0.2em] text-white/75 uppercase"
						>{m.landing_sustainability_stat_2_label()}</span
					>
				</div>
			</div>
		</div>
	</div>
</section>

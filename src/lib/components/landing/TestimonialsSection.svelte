<script lang="ts">
	import type { TestimonialCard } from './data';

	type Props = {
		lead: { quote: string; author: string };
		cards: TestimonialCard[];
	};

	let { lead, cards }: Props = $props();

	const cardClass = (card: TestimonialCard) =>
		card.highlight
			? 'rounded-[1.25rem] border border-brand/10 bg-brand-light p-6'
			: 'rounded-[1.25rem] bg-slate-100 p-6';

	const quoteClass = (card: TestimonialCard) =>
		card.highlight
			? 'text-sm leading-7 text-brand font-semibold italic'
			: 'text-sm leading-7 text-slate-600';
</script>

<section class="bg-white py-20">
	<div class="mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
		<div>
			<h2 class="text-3xl font-bold italic leading-10 text-brand">&ldquo;{lead.quote}&rdquo;</h2>
			<p class="mt-6 font-semibold text-slate-900">{lead.author}</p>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-4 pt-8">
				{#each cards.slice(0, 2) as card}
					<div class="rounded-[1.25rem] bg-slate-100 p-6">
						<p class="text-sm leading-7 text-slate-600">&ldquo;{card.quote}&rdquo;</p>
						{#if card.author}
							<p class="mt-4 text-xs font-bold text-slate-900">- {card.author}</p>
						{/if}
					</div>
				{/each}
			</div>

			<div class="space-y-4">
				{#each cards.slice(2) as card}
					<div class={cardClass(card)}>
						<p class={quoteClass(card)}>
							&ldquo;{card.quote}&rdquo;
						</p>
						{#if card.author}
							<p class="mt-4 text-xs font-bold text-slate-900">- {card.author}</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
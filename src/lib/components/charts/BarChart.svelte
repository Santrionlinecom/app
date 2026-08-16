<!--
	Grafik batang SVG dengan sumbu, garis bantu, dan tooltip.

	Menggantikan pendekatan lama berupa `div` dengan `style="height: %"`, yang
	tidak punya sumbu, tidak punya skala nyata, dan tidak dapat dibaca pembaca layar.

	Ringan: hanya SVG statis. Animasi memakai transform/opacity dan otomatis
	dinonaktifkan saat pengguna meminta pengurangan gerak.
-->
<script lang="ts">
	import { scaleBand, scaleLinear } from 'd3-scale';
	import { max } from 'd3-array';
	import { prefersReducedMotion } from '$lib/motion';

	export type BarDatum = {
		label: string;
		value: number;
		display: string;
		/** Warna batang; menerima warna CSS apa pun. */
		color?: string;
	};

	let {
		data = [],
		height = 288,
		valueLabel = 'Nilai',
		animate = true
	}: {
		data?: BarDatum[];
		height?: number;
		valueLabel?: string;
		animate?: boolean;
	} = $props();

	const margin = { top: 16, right: 8, bottom: 34, left: 44 };
	const width = 720; // viewBox tetap; SVG diskalakan responsif oleh CSS.

	const innerWidth = width - margin.left - margin.right;
	const innerHeight = $derived(height - margin.top - margin.bottom);

	const domainMax = $derived(Math.max(1, max(data, (d) => d.value) ?? 1));

	const xScale = $derived(
		scaleBand()
			.domain(data.map((d) => d.label))
			.range([0, innerWidth])
			.padding(0.28)
	);

	const yScale = $derived(scaleLinear().domain([0, domainMax]).nice().range([innerHeight, 0]));

	/** Garis bantu horizontal beserta labelnya. */
	const ticks = $derived(yScale.ticks(4));

	const reduced = prefersReducedMotion();
	const shouldAnimate = $derived(animate && !reduced);

	let hovered = $state<number | null>(null);

	const formatTick = (value: number) =>
		Math.abs(value) >= 1000
			? `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(value / 1000)}rb`
			: new Intl.NumberFormat('id-ID').format(value);
</script>

{#if data.length}
	<figure class="bar-chart" aria-label="{valueLabel} per kategori">
		<svg viewBox="0 0 {width} {height}" role="img" preserveAspectRatio="xMidYMid meet">
			<title>{valueLabel} per kategori</title>
			<g transform="translate({margin.left},{margin.top})">
				<!-- Garis bantu memberi konteks besaran, hilang dari desain lama. -->
				{#each ticks as tick}
					<g transform="translate(0,{yScale(tick)})">
						<line x1="0" x2={innerWidth} class="gridline" />
						<text x="-10" dy="0.32em" class="tick-label">{formatTick(tick)}</text>
					</g>
				{/each}

				<line x1="0" x2={innerWidth} y1={innerHeight} y2={innerHeight} class="axis-line" />

				{#each data as d, i}
					{@const bw = xScale.bandwidth()}
					{@const bx = xScale(d.label) ?? 0}
					{@const by = yScale(d.value)}
					{@const bh = Math.max(2, innerHeight - by)}
					<g
						role="listitem"
						aria-label="{d.label}: {d.display}"
						onpointerenter={() => (hovered = i)}
						onpointerleave={() => (hovered = null)}
					>
						<!-- Area sentuh penuh tinggi supaya mudah di-hover pada batang pendek. -->
						<rect x={bx} y="0" width={bw} height={innerHeight} class="hit-area" />
						<rect
							x={bx}
							y={by}
							width={bw}
							height={bh}
							rx="6"
							class="bar"
							class:is-active={hovered === i}
							style="fill: {d.color ?? 'var(--color-so-green, #1b4332)'}; {shouldAnimate
								? `transform-origin: ${bx + bw / 2}px ${innerHeight}px; animation-delay: ${i * 55}ms`
								: ''}"
							class:animate-grow={shouldAnimate}
						/>
						{#if hovered === i}
							<text x={bx + bw / 2} y={by - 8} class="value-label">{d.display}</text>
						{/if}
						<text x={bx + bw / 2} y={innerHeight + 22} class="category-label">{d.label}</text>
					</g>
				{/each}
			</g>
		</svg>

		<!-- Tabel setara untuk pembaca layar dan saat SVG gagal tampil. -->
		<figcaption class="sr-only">
			<table>
				<thead><tr><th>Kategori</th><th>{valueLabel}</th></tr></thead>
				<tbody>
					{#each data as d}
						<tr><td>{d.label}</td><td>{d.display}</td></tr>
					{/each}
				</tbody>
			</table>
		</figcaption>
	</figure>
{/if}

<style>
	.bar-chart {
		margin: 0;
		width: 100%;
	}

	.bar-chart svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.gridline {
		stroke: var(--color-so-border, #e8e4dc);
		stroke-width: 1;
		stroke-dasharray: 3 5;
	}

	.axis-line {
		stroke: var(--color-so-border, #e8e4dc);
		stroke-width: 1.5;
	}

	.tick-label {
		fill: var(--color-so-muted, #6b7280);
		font-size: 11px;
		text-anchor: end;
		font-variant-numeric: tabular-nums;
	}

	.category-label {
		fill: var(--color-so-muted, #6b7280);
		font-size: 11.5px;
		font-weight: 600;
		text-anchor: middle;
	}

	.value-label {
		fill: var(--color-so-ink, #1a1a1a);
		font-size: 12px;
		font-weight: 700;
		text-anchor: middle;
		font-variant-numeric: tabular-nums;
	}

	.hit-area {
		fill: transparent;
	}

	.bar {
		transition: opacity 0.18s ease;
		opacity: 0.9;
	}

	.bar.is-active {
		opacity: 1;
	}

	.animate-grow {
		animation: grow-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) backwards;
	}

	@keyframes grow-up {
		from {
			transform: scaleY(0);
		}
		to {
			transform: scaleY(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.animate-grow {
			animation: none;
		}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>

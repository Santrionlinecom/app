<!--
	Kartu statistik dengan angka menghitung naik dan sorotan lembut.

	Menggantikan blok statistik yang sebelumnya ditulis ulang berkali-kali
	secara inline di dalam halaman dashboard.
-->
<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { countUp, spotlight, reveal } from '$lib/motion';

	let {
		label,
		value,
		display,
		desc = '',
		href,
		source = '',
		icon,
		accentClass = 'bg-so-green',
		iconClass = 'bg-emerald-50 text-emerald-700',
		badgeClass = 'bg-emerald-50 text-emerald-700',
		delay = 0,
		format
	}: {
		label: string;
		/** Nilai numerik untuk animasi hitung naik; null bila bukan angka. */
		value?: number | null;
		/** Teks yang ditampilkan bila nilai bukan angka murni (mis. mata uang). */
		display: string;
		desc?: string;
		href: string;
		source?: string;
		icon?: any;
		accentClass?: string;
		iconClass?: string;
		badgeClass?: string;
		delay?: number;
		format?: (value: number) => string;
	} = $props();

	// Hanya animasikan angka murni. Nilai teks/mata uang campuran ditulis apa adanya
	// agar tidak pernah menampilkan angka yang keliru.
	const numeric = $derived(typeof value === 'number' && Number.isFinite(value) ? value : null);
</script>

<a
	{href}
	class="stat-card group relative block min-h-[9.5rem] min-w-0 overflow-hidden rounded-xl border border-so-border bg-white/90 p-4 shadow-[0_12px_34px_rgb(27_67_50/0.08)] backdrop-blur-md"
	use:reveal={{ delay, distance: 14 }}
	use:spotlight
>
	<span class="absolute inset-x-0 top-0 h-1 {accentClass}"></span>

	<div class="flex min-w-0 items-start justify-between gap-3">
		<span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl {iconClass}">
			{#if icon}
				{@const Icon = icon}
				<Icon size={21} strokeWidth={2.2} />
			{/if}
		</span>
		{#if source}
			<span class="min-w-0 rounded-full px-2.5 py-1 text-[11px] font-bold {badgeClass}">
				{source}
			</span>
		{/if}
	</div>

	<p class="mt-4 break-words text-xs font-bold uppercase tracking-wide text-so-muted">{label}</p>

	{#if numeric !== null}
		<p
			class="mt-1 break-words text-2xl font-bold leading-tight tabular-nums text-so-ink"
			use:countUp={{ value: numeric, duration: 1.1, format }}
		>
			{display}
		</p>
	{:else}
		<p class="mt-1 break-words text-2xl font-bold leading-tight tabular-nums text-so-ink">
			{display}
		</p>
	{/if}

	<div class="mt-2 flex min-w-0 items-end justify-between gap-2">
		<p class="min-w-0 break-words text-xs leading-5 text-so-muted">{desc}</p>
		<ArrowRight
			size={16}
			class="shrink-0 text-so-muted/45 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-so-green"
			strokeWidth={2.2}
		/>
	</div>
</a>

<style>
	.stat-card {
		transition:
			transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
			border-color 0.22s ease,
			box-shadow 0.22s ease;
	}

	/* Sorotan mengikuti kursor; posisinya di-set oleh action spotlight. */
	.stat-card::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0;
		background: radial-gradient(
			420px circle at var(--spot-x, 50%) var(--spot-y, 50%),
			rgb(27 67 50 / 0.07),
			transparent 42%
		);
		transition: opacity 0.25s ease;
	}

	.stat-card:hover {
		transform: translateY(-3px);
		border-color: var(--color-so-green, #1b4332);
		box-shadow: 0 18px 46px rgb(27 67 50 / 0.14);
	}

	.stat-card:hover::after {
		opacity: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.stat-card,
		.stat-card::after {
			transition: none;
		}
		.stat-card:hover {
			transform: none;
		}
	}
</style>

<!--
	Panel operasional TPQ.

	Diekstrak dari halaman dashboard agar hanya diunduh oleh pengguna lembaga
	TPQ. Sebelumnya markup ini ikut terkirim ke semua peran — termasuk santri,
	masjid, dan musholla yang tidak pernah menampilkannya.
-->
<script lang="ts">
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { reveal } from '$lib/motion';

	export let tpqCards: Array<{
		label: string;
		value: string;
		desc: string;
		href: string;
		tone: string;
	}> = [];
	export let tpqRecentSetoran: any[] = [];
	export let tpqAgenda: any[] = [];
	export let academicPrimaryHref = '/tpq/akademik/riwayat';

	// Diteruskan dari induk supaya pemformatan tetap satu sumber kebenaran.
	export let formatDate: (value: string | number | null | undefined) => string;
	export let getSurahName: (value: number) => string;
	export let getSetoranStatusLabel: (status: string) => string;
	export let getSetoranStatusClass: (status: string) => string;
</script>

<section class="admin-card min-w-0 overflow-hidden p-5 sm:p-6" use:reveal={{ delay: 100, distance: 18 }}>
	<div class="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<div class="min-w-0">
			<p class="text-[10px] font-bold uppercase tracking-[0.25em] text-so-green">TPQ Akademik</p>
			<h3 class="font-display mt-2 break-words text-2xl font-bold text-so-green">
				Pusat Operasional TPQ
			</h3>
			<p class="mt-2 max-w-2xl break-words text-sm leading-relaxed text-so-muted">
				Satu pintu untuk setoran resmi, review, riwayat, rapor, sertifikat, dan agenda lembaga.
			</p>
		</div>
		<div class="flex min-w-0 flex-wrap gap-2">
			<a href={academicPrimaryHref} class="btn btn-sm btn-primary">Buka akademik</a>
			<a href="/habit" class="btn btn-sm btn-outline">Misi habit</a>
		</div>
	</div>

	<div class="mt-6 grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6">
		{#each tpqCards as card}
			<a
				href={card.href}
				class={`min-w-0 rounded-xl border border-so-border bg-gradient-to-br ${card.tone} p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-so-green hover:shadow-md`}
			>
				<p class="break-words text-[11px] font-bold uppercase tracking-wide text-so-muted">
					{card.label}
				</p>
				<p class="mt-2 break-words text-2xl font-bold tabular-nums tracking-tight">
					{card.value}
				</p>
				<p class="mt-1.5 break-words text-xs leading-relaxed text-so-muted">
					{card.desc}
				</p>
			</a>
		{/each}
	</div>

	<div class="mt-6 grid min-w-0 gap-4 xl:grid-cols-2">
		<div class="min-w-0 rounded-xl border border-so-border bg-so-cream/55 p-4 sm:p-5">
			<div class="flex min-w-0 items-center justify-between gap-3">
				<h4 class="text-sm font-bold text-so-green">Setoran terbaru</h4>
				<a class="text-xs font-bold text-so-green hover:text-so-green-2" href="/tpq/akademik/riwayat">
					Lihat riwayat
				</a>
			</div>
			{#if tpqRecentSetoran.length}
				<div class="mt-4 space-y-2.5">
					{#each tpqRecentSetoran as item}
						<div
							class="flex min-w-0 flex-col gap-2 rounded-xl border border-so-border bg-white px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between"
						>
							<div class="min-w-0">
								<p class="break-words font-semibold text-so-ink">
									{item.santriName || 'Santri'} · {getSurahName(Number(item.surah))}
									{item.ayatFrom}-{item.ayatTo}
								</p>
								<p class="mt-1 break-words text-xs text-so-muted">
									{formatDate(item.date)} · {item.type === 'murojaah' ? "Muroja'ah" : 'Hafalan'}
									· {item.ustadzName || 'Pengampu'}
								</p>
							</div>
							<span
								class={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getSetoranStatusClass(item.status)}`}
							>
								{getSetoranStatusLabel(item.status)}
							</span>
						</div>
					{/each}
				</div>
			{:else}
				<EmptyState
					icon="📖"
					title="Belum ada setoran"
					description="Setoran hafalan terbaru akan muncul di sini setelah santri mulai menyetor."
					actionLabel="Lihat Riwayat"
					actionHref="/tpq/akademik/riwayat"
					compact={true}
				/>
			{/if}
		</div>

		<div class="min-w-0 rounded-xl border border-so-border bg-so-cream/55 p-4 sm:p-5">
			<div class="flex min-w-0 items-center justify-between gap-3">
				<h4 class="text-sm font-bold text-so-green">Agenda TPQ</h4>
				<a class="text-xs font-bold text-so-green hover:text-so-green-2" href="/kalender">
					Buka kalender
				</a>
			</div>
			{#if tpqAgenda.length}
				<div class="mt-4 space-y-2.5">
					{#each tpqAgenda as item}
						<div class="min-w-0 rounded-xl border border-so-border bg-white px-4 py-3 text-sm shadow-sm">
							<p class="break-words font-semibold text-so-ink">
								{item.title}
							</p>
							<p class="mt-1 text-xs text-so-muted">
								{formatDate(item.eventDate)}
							</p>
							{#if item.content}
								<p class="mt-2 break-words text-xs leading-5 text-so-muted">
									{item.content}
								</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<EmptyState
					icon="📆"
					title="Belum ada agenda"
					description="Agenda TPQ 14 hari ke depan akan ditampilkan di sini. Tambahkan melalui kalender."
					actionLabel="Buka Kalender"
					actionHref="/kalender"
					compact={true}
				/>
			{/if}
		</div>
	</div>
</section>

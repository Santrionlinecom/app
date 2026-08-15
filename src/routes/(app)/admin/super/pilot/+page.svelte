<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	const trendLabels: Record<string, string> = {
		membaik: 'Membaik',
		stabil: 'Stabil',
		perlu_pendampingan: 'Perlu Pendampingan'
	};

	const trendClasses: Record<string, string> = {
		membaik: 'border-emerald-200 bg-emerald-50 text-emerald-700',
		stabil: 'border-sky-200 bg-sky-50 text-sky-700',
		perlu_pendampingan: 'border-amber-200 bg-amber-50 text-amber-700'
	};

	const cellTitle: Record<string, string> = {
		met: 'Tercatat',
		miss: 'Belum',
		future: 'Mendatang'
	};

	const cellClass: Record<string, string> = {
		met: 'bg-emerald-500',
		miss: 'bg-stone-300',
		future: 'bg-stone-100 border border-stone-200'
	};

	const guardianLabels: Record<string, string> = {
		sesuai_pantauan: 'Sesuai pantauan',
		perlu_dibicarakan: 'Perlu dibicarakan',
		belum_sempat: 'Belum sempat'
	};

	const guardianClass: Record<string, string> = {
		sesuai_pantauan: 'border-emerald-200 bg-emerald-50 text-emerald-700',
		perlu_dibicarakan: 'border-amber-200 bg-amber-50 text-amber-700',
		belum_sempat: 'border-stone-200 bg-stone-50 text-stone-600'
	};

	const formatDate = (value: string) => {
		const [y, m, d] = value.split('-').map(Number);
		return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			timeZone: 'UTC'
		});
	};

	const formatShort = (value: string) => {
		const [y, m, d] = value.split('-').map(Number);
		return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			timeZone: 'UTC'
		});
	};

	const confirmRemove = (event: SubmitEvent, name: string) => {
		if (!window.confirm(`Hapus ${name} dari daftar pilot? Data check-in tidak dihapus.`)) {
			event.preventDefault();
		}
	};

	let formError: string | null = null;
	$: formError = form && 'error' in form && typeof form.error === 'string' ? form.error : null;
</script>

<svelte:head>
	<title>Pilot Habit — Monitoring</title>
</svelte:head>

<div class="space-y-6 text-so-ink">		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<a href="/admin/super/overview" class="inline-flex items-center gap-1 text-xs font-bold text-so-green hover:text-so-green-2">← Overview</a>
				<h1 class="font-display mt-1 text-2xl font-bold text-so-green">Pilot Habit System — Monitoring</h1>
				<p class="mt-1 text-sm text-so-muted">Pantau konsistensi 3 santri + orang tua selama 14 hari. Tanpa leaderboard — data privat untuk pembinaan.</p>
			</div>
			<a href="/admin/super/pilot/export.csv" class="inline-flex h-10 items-center gap-2 rounded-xl border border-so-border bg-white px-4 text-sm font-bold text-so-green shadow-sm transition hover:border-so-green">
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
				Ekspor CSV
			</a>
		</div>

	{#if formError}
		<div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm">
			{formError}
		</div>
	{/if}

	<section class="admin-card p-5 sm:p-6">
		<h2 class="font-display text-lg font-bold text-so-green">Tambah Peserta Pilot</h2>
		<p class="mt-1 text-sm text-so-muted">Santri harus sudah punya akun di app.santrionline. Orang tua opsional (akun wali).</p>
		<form method="POST" action="?/addParticipant" use:enhance class="mt-4 grid gap-3 md:grid-cols-3">
			<input name="userEmail" type="email" placeholder="Email santri (wajib)" required class="so-focus h-11 w-full rounded-xl border border-so-border bg-white px-3 text-sm shadow-sm" />
			<input name="label" placeholder="Label (mis. Santri 1 — TPQ)" class="so-focus h-11 w-full rounded-xl border border-so-border bg-white px-3 text-sm shadow-sm" />
			<input name="guardianEmail" type="email" placeholder="Email orang tua (opsional)" class="so-focus h-11 w-full rounded-xl border border-so-border bg-white px-3 text-sm shadow-sm" />
			<input name="startDate" type="date" required class="so-focus h-11 w-full rounded-xl border border-so-border bg-white px-3 text-sm shadow-sm" />
			<input name="endDate" type="date" required class="so-focus h-11 w-full rounded-xl border border-so-border bg-white px-3 text-sm shadow-sm" />
			<input name="notes" placeholder="Catatan (opsional)" class="so-focus h-11 w-full rounded-xl border border-so-border bg-white px-3 text-sm shadow-sm" />
			<div class="md:col-span-3">
				<button class="h-11 rounded-xl bg-so-green px-5 text-sm font-bold text-white transition hover:bg-so-green-2" type="submit">Tambah Peserta</button>
			</div>
		</form>
	</section>

	{#if data.pilotParticipants.length === 0}
		<section class="admin-card p-8 text-center">
			<p class="text-sm font-semibold text-so-muted">Belum ada peserta pilot. Tambahkan 3 santri di atas untuk mulai monitoring.</p>
		</section>
	{:else}
		<section class="grid gap-5">
			{#each data.pilotParticipants as { participant, monitor }}
				<article class="admin-card overflow-hidden">
					<div class="flex flex-wrap items-start justify-between gap-3 border-b border-so-border px-5 py-4 sm:px-6">
						<div>
							<div class="flex flex-wrap items-center gap-2">
								<h3 class="font-display text-lg font-bold text-so-ink">{participant.userUsername || participant.userEmail}</h3>
								{#if participant.label}
									<span class="rounded-full border border-so-border bg-so-cream px-2.5 py-0.5 text-xs font-bold text-so-muted">{participant.label}</span>
								{/if}
								<span class={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${participant.active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-stone-50 text-stone-500'}`}>
									{participant.active ? 'Aktif' : 'Nonaktif'}
								</span>
							</div>
							<p class="mt-1 text-xs text-so-muted">{participant.userEmail}{#if participant.guardianEmail} • Orang tua: {participant.guardianEmail}{/if}</p>
							<p class="mt-1 text-xs text-so-muted">Jendela pilot: {formatDate(monitor.windowStart)} → {formatDate(monitor.windowEnd)} • {monitor.elapsedDays}/{monitor.totalWindowDays} hari berjalan</p>
						</div>
						<div class="flex flex-wrap items-center gap-2">
							<form method="POST" action="?/toggleActive" use:enhance>
								<input type="hidden" name="id" value={participant.id} />
								<input type="hidden" name="active" value={participant.active ? '0' : '1'} />
								<button class="h-9 rounded-xl border border-so-border bg-white px-3 text-xs font-bold text-so-green transition hover:border-so-green" type="submit">
									{participant.active ? 'Nonaktifkan' : 'Aktifkan'}
								</button>
							</form>
							<form method="POST" action="?/removeParticipant" use:enhance on:submit={(event) => confirmRemove(event, participant.userUsername || participant.userEmail)}>
								<input type="hidden" name="id" value={participant.id} />
								<button class="h-9 rounded-xl border border-rose-300 bg-rose-600 px-3 text-xs font-bold text-white transition hover:bg-rose-700" type="submit">Hapus</button>
							</form>
						</div>
					</div>

					<div class="grid gap-5 px-5 py-4 sm:px-6 lg:grid-cols-3">
						{#each monitor.missions as mission}
							<div class="rounded-xl border border-so-border bg-so-cream p-4">
								<div class="flex items-start justify-between gap-2">
									<div>
										<p class="text-sm font-bold text-so-ink">{mission.title}</p>
										<p class="mt-0.5 text-xs text-so-muted">{mission.metDays}/{mission.totalDays} hari tercatat • streak {mission.currentStreak} hari</p>
									</div>
									<span class={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${trendClasses[mission.trend]}`}>{trendLabels[mission.trend]}</span>
								</div>
								<div class="mt-3 flex flex-wrap gap-1">
									{#each mission.grid as day}
										<span class={`h-3 w-3 rounded-[3px] ${cellClass[day.cell]}`} title={`${formatShort(day.date)} — ${cellTitle[day.cell]}`}></span>
									{/each}
								</div>
							</div>
						{/each}
					</div>

					{#if monitor.guardianConfirmations.length > 0}
						<div class="border-t border-so-border px-5 py-3 sm:px-6">
							<p class="text-xs font-bold uppercase text-so-muted">Konfirmasi orang tua (mingguan)</p>
							<div class="mt-2 flex flex-wrap gap-2">
								{#each monitor.guardianConfirmations as conf}
									<span class={`rounded-full border px-2.5 py-1 text-xs font-bold ${guardianClass[conf.confirmation] ?? 'border-stone-200 bg-stone-50 text-stone-600'}`}>
										{formatShort(conf.weekStart)} — {guardianLabels[conf.confirmation] ?? conf.confirmation}
										{#if conf.note} • {conf.note}{/if}
									</span>
								{/each}
							</div>
						</div>
					{/if}
				</article>
			{/each}
		</section>
	{/if}

	<section class="admin-card p-5 text-sm text-so-muted">
		<p><span class="mr-3 inline-block h-3 w-3 rounded-[3px] bg-emerald-500 align-middle"></span> Hari tercatat</p>
		<p class="mt-2"><span class="mr-3 inline-block h-3 w-3 rounded-[3px] bg-stone-300 align-middle"></span> Hari belum tercatat</p>
		<p class="mt-2"><span class="mr-3 inline-block h-3 w-3 rounded-[3px] border border-stone-200 bg-stone-100 align-middle"></span> Hari mendatang</p>
		<p class="mt-3 text-xs">Privasi & adab: dashboard ini hanya menampilkan status tercatat/belum — tanpa detail ibadah, tanpa peringkat antarsantri, tanpa leaderboard ketakwaan.</p>
	</section>
</div>

<style>
	.admin-card {
		border: 1px solid rgb(232 228 220 / 0.95);
		border-radius: var(--radius-so, 12px);
		background: rgb(255 255 255 / 0.88);
		box-shadow: var(--shadow-card, 0 12px 34px rgb(27 67 50 / 0.08));
		backdrop-filter: blur(18px);
	}
</style>

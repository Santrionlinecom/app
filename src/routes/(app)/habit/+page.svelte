<script lang="ts">
	import HabitCard from '$lib/components/Dashboard/HabitCard.svelte';
	import { invalidateAll } from '$app/navigation';

	export let data: {
		localDate: string;
		timezone: string;
		migrationReady: boolean;
		cards: Array<{
			mission: { key: string; title: string; description: string };
			checkin: {
				status: string;
				detail: Record<string, unknown> | null;
				durationBucket: string | null;
				optionalReflection: string | null;
				isDayMet: boolean;
			} | null;
			streak: { currentStreak: number; bestStreak: number } | null;
			dayStatus: 'pending' | 'partial' | 'done';
			supportCopy: string;
		}>;
		summary7: null | {
			missions: Array<{
				key: string;
				title: string;
				metDays: number;
				consistent5of7: boolean;
				currentStreak: number;
				trend: string;
			}>;
		};
		summary28: null | {
			missions: Array<{
				key: string;
				title: string;
				metDays: number;
				consistent5of7: boolean;
				currentStreak: number;
				trend: string;
			}>;
		};
	};

	let busyKey: string | null = null;
	let actionError = '';
	let actionMessage = '';

	const detailLine = (card: (typeof data.cards)[number]) => {
		if (!card.checkin?.detail && !card.checkin?.durationBucket) return null;
		if (card.mission.key === 'shalat_wajib') {
			const kept = Number((card.checkin.detail as { keptCount?: number })?.keptCount ?? 0);
			return `Progress hari ini: ${kept}/5 waktu terjaga (uzur tidak dihitung gagal).`;
		}
		if (card.mission.key === 'quran_harian') {
			const mode = (card.checkin.detail as { mode?: string })?.mode ?? '-';
			const dur = card.checkin.durationBucket ?? '-';
			return `Mode: ${mode} · Durasi: ${dur} menit`;
		}
		const category = (card.checkin.detail as { category?: string })?.category;
		return category ? `Kategori: ${category.replaceAll('_', ' ')}` : null;
	};

	const postJson = async (url: string, body: Record<string, unknown>) => {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		const payload = await response.json().catch(() => ({}));
		if (!response.ok || !payload.ok) {
			throw new Error(payload.error || 'Gagal menyimpan.');
		}
		return payload;
	};

	const checkinShalat = async (key: string) => {
		busyKey = key;
		actionError = '';
		actionMessage = '';
		try {
			await postJson('/api/habit/checkin', {
				missionKey: 'shalat_wajib',
				times: {
					subuh: 'terlaksana',
					zuhur: 'terlaksana',
					asar: 'terlaksana',
					magrib: 'terlaksana',
					isya: 'terlaksana'
				}
			});
			actionMessage = 'Check-in shalat tersimpan. Alhamdulillah.';
			await invalidateAll();
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Gagal check-in shalat.';
		} finally {
			busyKey = null;
		}
	};

	const checkinQuran = async (key: string) => {
		busyKey = key;
		actionError = '';
		actionMessage = '';
		try {
			await postJson('/api/habit/checkin', {
				missionKey: 'quran_harian',
				mode: 'membaca',
				durationBucket: '10-19'
			});
			actionMessage = 'Waktu bersama Al-Qur\'an tercatat.';
			await invalidateAll();
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Gagal check-in Al-Qur\'an.';
		} finally {
			busyKey = null;
		}
	};

	const checkinKebaikan = async (key: string) => {
		busyKey = key;
		actionError = '';
		actionMessage = '';
		try {
			await postJson('/api/habit/checkin', {
				missionKey: 'amal_adab_harian',
				done: true,
				category: 'orang_tua'
			});
			actionMessage = 'Satu kebaikan hari ini tercatat.';
			await invalidateAll();
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Gagal check-in kebaikan.';
		} finally {
			busyKey = null;
		}
	};

	const restart = async (missionKey: string) => {
		busyKey = missionKey;
		actionError = '';
		actionMessage = '';
		try {
			const payload = await postJson('/api/habit/restart', { missionKey });
			actionMessage = payload.message || 'Streak dimulai lagi. Riwayat tetap aman.';
			await invalidateAll();
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Gagal restart streak.';
		} finally {
			busyKey = null;
		}
	};

	const trendLabel = (trend: string) => {
		if (trend === 'membaik') return 'Membaik';
		if (trend === 'perlu_pendampingan') return 'Perlu pendampingan';
		return 'Stabil';
	};
</script>

<svelte:head>
	<title>Misi Habit · SantriOnline</title>
</svelte:head>

<div class="mx-auto w-full max-w-3xl space-y-5 px-4 py-5 sm:px-6">
	<header class="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-sm">
		<p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Habit System Pilot</p>
		<h1 class="mt-2 text-2xl font-bold sm:text-3xl">Tiga Misi Harian</h1>
		<p class="mt-2 text-sm leading-6 text-emerald-50">
			Usia 10–12 · 28 hari · target konsisten 5 dari 7 hari · zona {data.timezone}. Tanggal hari ini:
			<strong>{data.localDate}</strong>.
		</p>
		<p class="mt-2 text-sm leading-6 text-emerald-50">
			Data ibadah bersifat privat. Tidak ada leaderboard kesalehan.
		</p>
	</header>

	{#if !data.migrationReady}
		<section class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
			Tabel habit belum tersedia di database. Jalankan migrasi
			<code class="rounded bg-white px-1">0053_habit_system_pilot.sql</code> lalu refresh.
		</section>
	{:else}
		{#if actionError}
			<p class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</p>
		{/if}
		{#if actionMessage}
			<p class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
				{actionMessage}
			</p>
		{/if}

		<section class="space-y-4">
			{#each data.cards as card (card.mission.key)}
				<HabitCard
					title={card.mission.title}
					description={card.mission.description}
					dayStatus={card.dayStatus}
					supportCopy={card.supportCopy}
					streakCurrent={card.streak?.currentStreak ?? 0}
					detailLine={detailLine(card)}
					busy={busyKey === card.mission.key}
				>
					<svelte:fragment slot="actions">
						{#if card.mission.key === 'shalat_wajib'}
							<button
								type="button"
								class="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
								on:click={() => checkinShalat(card.mission.key)}
								disabled={busyKey !== null}
							>
								Check-in 5 waktu
							</button>
						{:else if card.mission.key === 'quran_harian'}
							<button
								type="button"
								class="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
								on:click={() => checkinQuran(card.mission.key)}
								disabled={busyKey !== null}
							>
								+10 menit Qur'an
							</button>
						{:else}
							<button
								type="button"
								class="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
								on:click={() => checkinKebaikan(card.mission.key)}
								disabled={busyKey !== null}
							>
								Sudah berbuat baik
							</button>
						{/if}
						<button
							type="button"
							class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
							on:click={() => restart(card.mission.key)}
							disabled={busyKey !== null}
						>
							Mulai Lagi Hari Ini
						</button>
					</svelte:fragment>
				</HabitCard>
			{/each}
		</section>

		{#if data.summary7}
			<section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
				<h2 class="text-base font-bold text-slate-900">Ringkasan 7 hari</h2>
				<p class="mt-1 text-sm text-slate-600">Konsisten jika aktif minimal 5 dari 7 hari.</p>
				<ul class="mt-3 space-y-2">
					{#each data.summary7.missions as row}
						<li class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 text-sm">
							<div>
								<p class="font-semibold text-slate-800">{row.title}</p>
								<p class="text-xs text-slate-500">
									{row.metDays} hari tercapai · streak {row.currentStreak} · {trendLabel(row.trend)}
								</p>
							</div>
							<span
								class={`rounded-full px-2 py-1 text-[11px] font-bold ${
									row.consistent5of7 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
								}`}
							>
								{row.consistent5of7 ? '5/7 OK' : 'Belum 5/7'}
							</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if data.summary28}
			<section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
				<h2 class="text-base font-bold text-slate-900">Tren 28 hari</h2>
				<ul class="mt-3 space-y-2">
					{#each data.summary28.missions as row}
						<li class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 text-sm">
							<div>
								<p class="font-semibold text-slate-800">{row.title}</p>
								<p class="text-xs text-slate-500">{row.metDays} hari tercapai · {trendLabel(row.trend)}</p>
							</div>
							<span class="text-xs font-semibold text-slate-500">streak {row.currentStreak}</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}
</div>

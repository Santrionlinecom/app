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
	let shalatTimes: Record<string, string> = {};
	let shalatReflection = '';
	let quranMode = '';
	let quranDurationBucket = '';
	let quranReflection = '';
	let adabDone = false;
	let adabCategory = '';
	let adabReflection = '';
	let lastHydratedSignature = '';

	const hydrateForms = (cards: typeof data.cards) => {
		const shalat = cards.find((card) => card.mission.key === 'shalat_wajib')?.checkin;
		const shalatDetail = shalat?.detail as { times?: Record<string, string> } | null;
		shalatTimes = { ...(shalatDetail?.times ?? {}) };
		shalatReflection = shalat?.optionalReflection ?? '';

		const quran = cards.find((card) => card.mission.key === 'quran_harian')?.checkin;
		const quranDetail = quran?.detail as { mode?: string } | null;
		quranMode = quranDetail?.mode ?? '';
		quranDurationBucket = quran?.durationBucket ?? '';
		quranReflection = quran?.optionalReflection ?? '';

		const adab = cards.find((card) => card.mission.key === 'amal_adab_harian')?.checkin;
		const adabDetail = adab?.detail as { done?: boolean; category?: string } | null;
		adabDone = adabDetail?.done ?? adab?.isDayMet ?? false;
		adabCategory = adabDetail?.category ?? '';
		adabReflection = adab?.optionalReflection ?? '';
	};

	$: {
		const signature = JSON.stringify(data.cards.map((card) => card.checkin));
		if (!busyKey && signature !== lastHydratedSignature) {
			hydrateForms(data.cards);
			lastHydratedSignature = signature;
		}
	}

	const prayerTimes = [
		{ key: 'subuh', label: 'Subuh' },
		{ key: 'zuhur', label: 'Zuhur' },
		{ key: 'asar', label: 'Asar' },
		{ key: 'magrib', label: 'Magrib' },
		{ key: 'isya', label: 'Isya' }
	];
	const prayerStatuses = [
		{ value: 'tepat_waktu', label: 'Tepat waktu' },
		{ value: 'terlaksana', label: 'Terlaksana' },
		{ value: 'belum', label: 'Belum' },
		{ value: 'uzur', label: 'Uzur' }
	];
	const quranModes = [
		{ value: 'membaca', label: 'Membaca' },
		{ value: 'menyimak', label: 'Menyimak' },
		{ value: 'menghafal', label: 'Menghafal' },
		{ value: 'murajaah', label: 'Murajaah' }
	];
	const quranDurations = [
		{ value: '5-9', label: '5-9 menit' },
		{ value: '10-19', label: '10-19 menit' },
		{ value: '20+', label: '20+ menit' }
	];
	const adabCategories = [
		{ value: 'orang_tua', label: 'Orang tua' },
		{ value: 'guru_belajar', label: 'Guru atau belajar' },
		{ value: 'teman_lisan', label: 'Teman dan lisan' },
		{ value: 'amanah_disiplin', label: 'Amanah dan disiplin' },
		{ value: 'kebersihan_lingkungan', label: 'Kebersihan lingkungan' },
		{ value: 'lainnya', label: 'Lainnya' }
	];

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

	const canRestart = (card: (typeof data.cards)[number]) =>
		(card.streak?.bestStreak ?? 0) > 0 && (card.streak?.currentStreak ?? 0) === 0;

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
		const times = Object.fromEntries(
			Object.entries(shalatTimes).filter(([, value]) => Boolean(value))
		);
		if (Object.keys(times).length === 0) {
			actionError = 'Pilih minimal satu status shalat yang ingin dicatat.';
			return;
		}
		busyKey = key;
		actionError = '';
		actionMessage = '';
		try {
			await postJson('/api/habit/checkin', {
				missionKey: 'shalat_wajib',
				times,
				optionalReflection: shalatReflection
			});
			actionMessage = 'Catatan shalat tersimpan. Terima kasih sudah mengisi dengan jujur.';
			await invalidateAll();
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Gagal check-in shalat.';
		} finally {
			busyKey = null;
		}
	};

	const checkinQuran = async (key: string) => {
		if (!quranMode || !quranDurationBucket) {
			actionError = 'Pilih mode dan durasi Al-Qur\'an terlebih dahulu.';
			return;
		}
		busyKey = key;
		actionError = '';
		actionMessage = '';
		try {
			await postJson('/api/habit/checkin', {
				missionKey: 'quran_harian',
				mode: quranMode,
				durationBucket: quranDurationBucket,
				optionalReflection: quranReflection
			});
			actionMessage = 'Waktu bersama Al-Qur\'an tercatat sesuai isianmu.';
			await invalidateAll();
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Gagal check-in Al-Qur\'an.';
		} finally {
			busyKey = null;
		}
	};

	const checkinKebaikan = async (key: string) => {
		if (!adabCategory) {
			actionError = 'Pilih kategori adab atau kebaikan terlebih dahulu.';
			return;
		}
		busyKey = key;
		actionError = '';
		actionMessage = '';
		try {
			await postJson('/api/habit/checkin', {
				missionKey: 'amal_adab_harian',
				done: adabDone,
				category: adabCategory,
				optionalReflection: adabReflection
			});
			actionMessage = adabDone
				? 'Satu adab atau kebaikan hari ini tercatat.'
				: 'Belum hari ini tetap tercatat. Kamu bisa mulai dari langkah kecil.';
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
			Data ibadah bersifat privat. Isi yang terjadi hari ini, tanpa malu dan tanpa leaderboard kesalehan.
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
							<form class="w-full space-y-4" on:submit|preventDefault={() => checkinShalat(card.mission.key)}>
								<fieldset class="space-y-3">
									<legend class="text-sm font-bold text-slate-800">
										Catat tiap waktu sesuai keadaan hari ini
									</legend>
									<p class="text-xs leading-5 text-slate-500">
										Uzur cukup dipilih tanpa rincian. Ini catatan privat, bukan penilaian publik.
									</p>
									{#each prayerTimes as time}
										<div class="space-y-2 rounded-xl border border-slate-100 p-3">
											<p class="text-sm font-bold text-slate-700">{time.label}</p>
											<div class="grid gap-2 sm:grid-cols-4">
												{#each prayerStatuses as status}
													<label class="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
														<input
															type="radio"
															name={`shalat-${time.key}`}
															value={status.value}
															checked={shalatTimes[time.key] === status.value}
															on:change={() => (shalatTimes = { ...shalatTimes, [time.key]: status.value })}
															disabled={busyKey !== null}
														/>
														<span>{status.label}</span>
													</label>
												{/each}
											</div>
										</div>
									{/each}
								</fieldset>
								<label class="block text-sm font-semibold text-slate-700">
									Refleksi singkat opsional
									<textarea
										class="mt-2 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
										maxlength="140"
										bind:value={shalatReflection}
										placeholder="Contoh: ingin lebih siap sebelum azan."
										disabled={busyKey !== null}
									></textarea>
								</label>
								<div class="flex flex-wrap gap-2">
									<button
										type="submit"
										class="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
										disabled={busyKey !== null}
									>
										Simpan catatan shalat
									</button>
									{#if canRestart(card)}
										<button
											type="button"
											class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
											on:click={() => restart(card.mission.key)}
											disabled={busyKey !== null}
										>
											Mulai ulang streak
										</button>
									{/if}
								</div>
							</form>
						{:else if card.mission.key === 'quran_harian'}
							<form class="w-full space-y-4" on:submit|preventDefault={() => checkinQuran(card.mission.key)}>
								<div class="grid gap-3 sm:grid-cols-2">
									<label class="block text-sm font-semibold text-slate-700">
										Mode Al-Qur'an
										<select
											class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
											bind:value={quranMode}
											disabled={busyKey !== null}
										>
											<option value="">Pilih mode</option>
											{#each quranModes as mode}
												<option value={mode.value}>{mode.label}</option>
											{/each}
										</select>
									</label>
									<label class="block text-sm font-semibold text-slate-700">
										Durasi
										<select
											class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
											bind:value={quranDurationBucket}
											disabled={busyKey !== null}
										>
											<option value="">Pilih durasi</option>
											{#each quranDurations as duration}
												<option value={duration.value}>{duration.label}</option>
											{/each}
										</select>
									</label>
								</div>
								<label class="block text-sm font-semibold text-slate-700">
									Refleksi singkat opsional
									<textarea
										class="mt-2 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
										maxlength="140"
										bind:value={quranReflection}
										placeholder="Contoh: membaca setelah Magrib."
										disabled={busyKey !== null}
									></textarea>
								</label>
								<div class="flex flex-wrap gap-2">
									<button
										type="submit"
										class="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
										disabled={busyKey !== null}
									>
										Simpan catatan Qur'an
									</button>
									{#if canRestart(card)}
										<button
											type="button"
											class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
											on:click={() => restart(card.mission.key)}
											disabled={busyKey !== null}
										>
											Mulai ulang streak
										</button>
									{/if}
								</div>
							</form>
						{:else}
							<form class="w-full space-y-4" on:submit|preventDefault={() => checkinKebaikan(card.mission.key)}>
								<label class="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
									<input type="checkbox" bind:checked={adabDone} disabled={busyKey !== null} />
									<span>Sudah saya lakukan hari ini</span>
								</label>
								<label class="block text-sm font-semibold text-slate-700">
									Kategori adab atau kebaikan
									<select
										class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
										bind:value={adabCategory}
										disabled={busyKey !== null}
									>
										<option value="">Pilih kategori</option>
										{#each adabCategories as category}
											<option value={category.value}>{category.label}</option>
										{/each}
									</select>
								</label>
								<label class="block text-sm font-semibold text-slate-700">
									Refleksi singkat opsional
									<textarea
										class="mt-2 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
										maxlength="140"
										bind:value={adabReflection}
										placeholder="Contoh: membantu merapikan ruang belajar."
										disabled={busyKey !== null}
									></textarea>
								</label>
								<div class="flex flex-wrap gap-2">
									<button
										type="submit"
										class="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
										disabled={busyKey !== null}
									>
										Simpan catatan adab
									</button>
									{#if canRestart(card)}
										<button
											type="button"
											class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
											on:click={() => restart(card.mission.key)}
											disabled={busyKey !== null}
										>
											Mulai ulang streak
										</button>
									{/if}
								</div>
							</form>
						{/if}
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

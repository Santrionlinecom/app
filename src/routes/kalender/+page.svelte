<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	type CalendarCell = { date: Date; inMonth: boolean };
	type CalendarNote = { id: string; userId: string; role: string; title: string; content: string; eventDate: string; createdAt: number; updatedAt: number };
	type HafalanPoint = { date: string; total: number; hijau: number; kuning: number; merah: number };

	const pasaranCycle = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
	const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
	const dayEmojis = ['☀️', '🌙', '🔥', '💧', '⚡', '🕌', '🌟'];
	const DAILY_THEMES: Record<number, { name: string; emoji: string; color: string }> = {
		0: { name: 'Aqidah', emoji: '🤲', color: 'from-purple-500 to-pink-500' },
		1: { name: "Tadabbur Qur'an", emoji: '📖', color: 'from-blue-500 to-cyan-500' },
		2: { name: 'Hadits', emoji: '📜', color: 'from-amber-500 to-orange-500' },
		3: { name: 'Fiqih', emoji: '⚖️', color: 'from-emerald-500 to-teal-500' },
		4: { name: 'Tasawuf', emoji: '✨', color: 'from-indigo-500 to-purple-500' },
		5: { name: "Do'a & Dzikir", emoji: '🤲', color: 'from-rose-500 to-pink-500' },
		6: { name: 'B. Arab', emoji: '🔤', color: 'from-green-500 to-emerald-500' }
	};

	const makeFormatter = (locale: string, opts: Intl.DateTimeFormatOptions) => {
		try { return new Intl.DateTimeFormat(locale, opts); }
		catch { return new Intl.DateTimeFormat('id-ID', opts); }
	};

	const hijriFormatter = makeFormatter('id-ID-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
	const hijriDayFormatter = makeFormatter('en-u-ca-islamic', { day: 'numeric', timeZone: 'Asia/Jakarta' });
	const gregMonthFormatter = makeFormatter('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

	const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
	const toArabicNumeral = (value: number | string) => `${value}`.replace(/\d/g, d => arabicDigits[Number(d)]);
	const hijriDayNumber = (date: Date) => {
		try {
			const parts = hijriDayFormatter.formatToParts(date);
			const day = parts.find(p => p.type === 'day')?.value;
			return day ? Number(day) : null;
		} catch { return null; }
	};

	let today = new Date();
	let viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
	let selectedDate = new Date(today);
	let weeks: CalendarCell[][] = [];
	let notesByDate: Record<string, CalendarNote[]> = {};
	let noteModalDate: Date | null = null;
	let formTitle = '';
	let formContent = '';
	let editId: string | null = null;
	let savingNote = false;
	let dailyMap: Record<string, HafalanPoint> = {};
	let currentUser: any = null;

	$: currentUser = $page.data.user;
	$: modalTheme = noteModalDate ? DAILY_THEMES[noteModalDate.getDay()] : DAILY_THEMES[selectedDate.getDay()];

	const toISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	const pasaranFor = (date: Date) => {
		const baseline = Date.UTC(1970, 0, 1);
		const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
		const diffDays = Math.round((utc - baseline) / 86400000);
		return pasaranCycle[((diffDays + 3) % 5 + 5) % 5];
	};

	function buildWeeks(monthDate: Date) {
		const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
		const startDay = start.getDay();
		const firstCell = new Date(start);
		firstCell.setDate(1 - startDay);
		const cells: CalendarCell[] = [];
		for (let i = 0; i < 42; i++) {
			const d = new Date(firstCell);
			d.setDate(firstCell.getDate() + i);
			cells.push({ date: d, inMonth: d.getMonth() === monthDate.getMonth() });
		}
		const chunked: CalendarCell[][] = [];
		for (let i = 0; i < 42; i += 7) chunked.push(cells.slice(i, i + 7));
		return chunked;
	}

	onMount(() => {
		weeks = buildWeeks(viewMonth);
		loadNotesForMonth(viewMonth);
		loadDaily();
	});

	const setMonth = (delta: number) => {
		viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
		weeks = buildWeeks(viewMonth);
		loadNotesForMonth(viewMonth);
	};

	const pickDate = (date: Date) => {
		selectedDate = new Date(date);
		if (date.getMonth() !== viewMonth.getMonth()) {
			viewMonth = new Date(date.getFullYear(), date.getMonth(), 1);
			weeks = buildWeeks(viewMonth);
			loadNotesForMonth(viewMonth);
		}
		noteModalDate = new Date(date);
		formTitle = '';
		formContent = '';
		editId = null;
	};

	const loadNotesForMonth = async (monthDate: Date) => {
		if (!currentUser) return;
		const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
		const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
		try {
			const res = await fetch(`/api/notes?start=${toISODate(start)}&end=${toISODate(end)}`);
			if (res.ok) {
				const data = await res.json();
				const grouped: Record<string, CalendarNote[]> = {};
				for (const note of data.notes ?? []) {
					grouped[note.eventDate] = grouped[note.eventDate] ?? [];
					grouped[note.eventDate].push(note);
				}
				notesByDate = grouped;
			}
		} catch {}
	};

	const loadDaily = async () => {
		if (!currentUser) return;
		try {
			const res = await fetch('/api/hafalan/daily?days=60');
			if (res.ok) {
				const data = await res.json();
				const map: Record<string, HafalanPoint> = {};
				for (const p of data.points ?? []) map[p.date] = p;
				dailyMap = map;
			}
		} catch {}
	};

	const saveNote = async () => {
		if (!noteModalDate || !currentUser || !formTitle.trim()) return;
		savingNote = true;
		const payload = { title: formTitle.trim(), content: formContent.trim(), eventDate: toISODate(noteModalDate) };
		const url = editId ? `/api/notes/${editId}` : '/api/notes';
		const method = editId ? 'PUT' : 'POST';
		try {
			const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
			if (res.ok) {
				const data = await res.json();
				if (data.note) {
					const key = data.note.eventDate;
					const list = notesByDate[key] ? [...notesByDate[key]] : [];
					const idx = list.findIndex(n => n.id === data.note.id);
					if (idx >= 0) list[idx] = data.note;
					else list.push(data.note);
					notesByDate = { ...notesByDate, [key]: list };
					formTitle = '';
					formContent = '';
					editId = null;
				}
			}
		} catch {}
		finally { savingNote = false; }
	};

	const deleteNote = async (note: CalendarNote) => {
		if (!currentUser || !confirm('Hapus catatan?')) return;
		try {
			const res = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
			if (res.ok) {
				const list = notesByDate[note.eventDate] ?? [];
				notesByDate = { ...notesByDate, [note.eventDate]: list.filter(n => n.id !== note.id) };
			}
		} catch {}
	};

	const startEdit = (note: CalendarNote) => {
		formTitle = note.title;
		formContent = note.content;
		editId = note.id;
	};

	const canEdit = (note: CalendarNote) => currentUser && (currentUser.role === 'admin' || currentUser.id === note.userId);
</script>

<svelte:head>
	<title>📅 Kalender Santri</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
	<div class="mx-auto max-w-6xl px-4">
		<!-- Hero Header -->
		<div class="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r {DAILY_THEMES[selectedDate.getDay()].color} p-4 md:p-8 text-white shadow-2xl mb-6 md:mb-8">
			<div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10">
				<div class="flex items-center gap-2 md:gap-4 mb-3 md:mb-4">
					<span class="text-4xl md:text-6xl">{DAILY_THEMES[selectedDate.getDay()].emoji}</span>
					<div>
						<p class="text-xs md:text-sm opacity-90">Hari ini</p>
						<h1 class="text-xl md:text-4xl font-bold leading-tight">{selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h1>
						<p class="text-sm md:text-lg opacity-90 mt-0.5 md:mt-1">Pasaran: {pasaranFor(selectedDate)} • {hijriFormatter.format(selectedDate)}</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-2 md:gap-3">
					<div class="bg-white/20 backdrop-blur-sm rounded-lg md:rounded-xl px-3 md:px-4 py-1.5 md:py-2">
						<p class="text-[10px] md:text-xs opacity-80">Pelajaran Hari Ini</p>
						<p class="text-sm md:text-lg font-bold">{DAILY_THEMES[selectedDate.getDay()].name}</p>
					</div>
					{#if dailyMap[toISODate(selectedDate)]}
						<div class="bg-white/20 backdrop-blur-sm rounded-lg md:rounded-xl px-3 md:px-4 py-1.5 md:py-2">
							<p class="text-[10px] md:text-xs opacity-80">Setoran Hari Ini</p>
							<p class="text-sm md:text-lg font-bold">{dailyMap[toISODate(selectedDate)].total} ayat</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Calendar -->
		<div class="rounded-2xl md:rounded-3xl border-2 border-white bg-white/80 backdrop-blur-sm p-3 md:p-6 shadow-2xl">
			<div class="flex items-center justify-between mb-4 md:mb-6">
				<h2 class="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
					{gregMonthFormatter.format(viewMonth)}
				</h2>
				<div class="flex gap-1 md:gap-2">
					<button class="btn btn-circle btn-xs md:btn-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-110 transition" on:click={() => setMonth(-1)}>←</button>
					<button class="btn btn-xs md:btn-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:scale-105 transition" on:click={() => { viewMonth = new Date(today.getFullYear(), today.getMonth(), 1); weeks = buildWeeks(viewMonth); selectedDate = new Date(today); }}>
						Hari Ini
					</button>
					<button class="btn btn-circle btn-xs md:btn-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-110 transition" on:click={() => setMonth(1)}>→</button>
				</div>
			</div>

			<!-- Days Header -->
			<div class="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-4">
				{#each dayNames as name, i}
					<div class="text-center">
						<div class="text-lg md:text-2xl mb-0.5 md:mb-1">{dayEmojis[i]}</div>
						<div class="text-[10px] md:text-sm font-bold text-gray-700">{name}</div>
					</div>
				{/each}
			</div>

			<!-- Calendar Grid -->
			<div class="grid grid-cols-7 gap-1 md:gap-2">
				{#each weeks.flat() as cell}
					{#if cell.inMonth}
						<button
							class="group relative aspect-[4/5] md:aspect-square overflow-hidden rounded-xl md:rounded-2xl border-2 transition-all hover:scale-105 hover:shadow-xl {
								cell.date.toDateString() === selectedDate.toDateString()
									? 'border-purple-500 bg-gradient-to-br from-purple-100 to-pink-100 shadow-lg scale-105'
									: cell.date.toDateString() === today.toDateString()
										? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50'
										: 'border-gray-200 bg-white hover:border-purple-300'
							}"
							on:click={() => pickDate(cell.date)}
						>
							<div class="md:hidden absolute inset-0 flex flex-col justify-between p-1">
								<div class="flex items-start justify-between">
									<div class="text-[10px] font-bold {
										cell.date.toDateString() === selectedDate.toDateString() ? 'text-purple-600' :
										cell.date.toDateString() === today.toDateString() ? 'text-blue-600' : 'text-gray-700'
									}">
										{cell.date.getDate()}
									</div>
									{#if cell.date.toDateString() === today.toDateString()}
										<div class="text-[10px]">🌟</div>
									{/if}
								</div>
								<div class="text-center text-[12px] font-semibold text-emerald-700 leading-none">
									{toArabicNumeral(hijriDayNumber(cell.date) ?? '')}
								</div>
								<div class="text-center">
									<div class="text-[8px] font-semibold text-purple-600 leading-none">{pasaranFor(cell.date)}</div>
									<div class="flex justify-center gap-0.5 mt-0.5">
										{#if notesByDate[toISODate(cell.date)]?.length}
											<div class="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
										{/if}
										{#if dailyMap[toISODate(cell.date)]?.total}
											<div class="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
										{/if}
									</div>
								</div>
							</div>
							<div class="hidden md:block">
								<div class="absolute top-1 left-1 text-xs md:text-lg font-bold {
									cell.date.toDateString() === selectedDate.toDateString() ? 'text-purple-600' :
									cell.date.toDateString() === today.toDateString() ? 'text-blue-600' : 'text-gray-700'
								}">
									{cell.date.getDate()}
								</div>
								{#if cell.date.toDateString() === today.toDateString()}
									<div class="absolute top-1 right-1 text-sm md:text-xl">🌟</div>
								{/if}
								<div class="absolute inset-0 flex items-center justify-center">
									<div class="text-xl md:text-3xl font-bold text-green-700">
										{toArabicNumeral(hijriDayNumber(cell.date) ?? '')}
									</div>
								</div>
								<div class="absolute bottom-1 left-1 right-1 text-center">
									<div class="text-[9px] md:text-xs font-semibold text-purple-600">{pasaranFor(cell.date)}</div>
									<div class="flex justify-center gap-0.5 md:gap-1 mt-0.5">
										{#if notesByDate[toISODate(cell.date)]?.length}
											<div class="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
										{/if}
										{#if dailyMap[toISODate(cell.date)]?.total}
											<div class="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
										{/if}
									</div>
								</div>
							</div>
						</button>
					{:else}
						<div class="aspect-[4/5] md:aspect-square rounded-xl md:rounded-2xl bg-gray-50 opacity-30 flex items-center justify-center text-xs md:text-base text-gray-400">
							{cell.date.getDate()}
						</div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Legend -->
		<div class="mt-6 flex flex-wrap gap-4 justify-center text-sm">
			<div class="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow">
				<div class="h-3 w-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
				<span>Ada Catatan</span>
			</div>
			<div class="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow">
				<div class="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
				<span>Ada Setoran</span>
			</div>
			<div class="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow">
				<span class="text-xl">🌟</span>
				<span>Hari Ini</span>
			</div>
		</div>
	</div>
</div>

<!-- Modal -->
{#if noteModalDate}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
		<div class="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-3xl bg-white shadow-2xl">
			<!-- Modal Header -->
			<div class="sticky top-0 z-10 bg-gradient-to-r {modalTheme.color} p-6 text-white">
				<div class="flex items-start justify-between">
					<div>
						<div class="flex items-center gap-3 mb-2">
							<span class="text-5xl">{modalTheme.emoji}</span>
							<div>
								<h3 class="text-2xl font-bold">{noteModalDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
								<p class="text-sm opacity-90">Pasaran: {pasaranFor(noteModalDate)}</p>
							</div>
						</div>
						<div class="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 inline-block">
							<p class="text-sm font-semibold">📚 {modalTheme.name}</p>
						</div>
					</div>
					<button class="btn btn-circle btn-sm bg-white/20 hover:bg-white/30" on:click={() => noteModalDate = null}>✕</button>
				</div>
			</div>

			<!-- Modal Content -->
			<div class="p-6 space-y-6">
				<!-- Stats -->
				{#if dailyMap[toISODate(noteModalDate)]}
					<div class="grid grid-cols-4 gap-3">
						<div class="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-3 text-center border-2 border-blue-200">
							<p class="text-2xl font-bold text-blue-600">{dailyMap[toISODate(noteModalDate)].total}</p>
							<p class="text-xs text-gray-600">Total Ayat</p>
						</div>
						<div class="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-3 text-center border-2 border-green-200">
							<p class="text-2xl font-bold text-green-600">{dailyMap[toISODate(noteModalDate)].hijau}</p>
							<p class="text-xs text-gray-600">🟢 Lancar</p>
						</div>
						<div class="rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 p-3 text-center border-2 border-yellow-200">
							<p class="text-2xl font-bold text-yellow-600">{dailyMap[toISODate(noteModalDate)].kuning}</p>
							<p class="text-xs text-gray-600">🟡 Cukup</p>
						</div>
						<div class="rounded-xl bg-gradient-to-br from-red-50 to-rose-50 p-3 text-center border-2 border-red-200">
							<p class="text-2xl font-bold text-red-600">{dailyMap[toISODate(noteModalDate)].merah}</p>
							<p class="text-xs text-gray-600">🔴 Perlu</p>
						</div>
					</div>
				{/if}

				<!-- Notes List -->
				<div>
					<h4 class="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
						📝 Catatan ({notesByDate[toISODate(noteModalDate)]?.length || 0})
					</h4>
					{#if !currentUser}
						<div class="rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 p-4 text-center border-2 border-blue-300">
							<p class="text-sm text-gray-700 mb-3">Login untuk melihat dan menambah catatan</p>
							<div class="flex gap-2 justify-center">
								<a href="/auth" class="btn btn-sm bg-white">Login</a>
								<a href="/register" class="btn btn-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white">Daftar</a>
							</div>
						</div>
					{:else if notesByDate[toISODate(noteModalDate)]?.length}
						<div class="space-y-2 max-h-60 overflow-auto">
							{#each notesByDate[toISODate(noteModalDate)] as note}
								<div class="rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4">
									<div class="flex items-start justify-between mb-2">
										<div>
											<p class="font-bold text-gray-900">{note.title}</p>
											<p class="text-xs text-gray-600">{note.role}</p>
										</div>
										{#if canEdit(note)}
											<div class="flex gap-2">
												<button class="text-xs text-blue-600 hover:underline" on:click={() => startEdit(note)}>✏️ Edit</button>
												<button class="text-xs text-red-600 hover:underline" on:click={() => deleteNote(note)}>🗑️ Hapus</button>
											</div>
										{/if}
									</div>
									<p class="text-sm text-gray-700">{note.content || '-'}</p>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-center text-gray-500 py-8">Belum ada catatan</p>
					{/if}
				</div>

				<!-- Add Note Form -->
				{#if currentUser}
					<div class="rounded-2xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 p-4">
						<h4 class="text-lg font-bold text-gray-900 mb-3">{editId ? '✏️ Edit Catatan' : '➕ Tambah Catatan'}</h4>
						<div class="space-y-3">
							<input
								class="input input-bordered w-full bg-white"
								placeholder="Judul catatan..."
								bind:value={formTitle}
							/>
							<textarea
								class="textarea textarea-bordered w-full bg-white min-h-[100px]"
								placeholder="Tulis catatan kamu di sini..."
								bind:value={formContent}
							></textarea>
							<div class="flex gap-2">
								<button class="btn btn-sm flex-1 bg-white" on:click={() => { formTitle = ''; formContent = ''; editId = null; }}>
									Batal
								</button>
								<button class="btn btn-sm flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white" disabled={savingNote} on:click={saveNote}>
									{savingNote ? '⏳ Menyimpan...' : editId ? '💾 Simpan' : '➕ Tambah'}
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	const isAdmin = data.role === 'admin';
	const isUstadz = data.role === 'ustadz' || data.role === 'ustadzah';
	const isSantri = data.role === 'santri';
	const isAsisten = data.role === 'asisten';
	const isAlumni = data.role === 'alumni';

	const roleConfig = {
		admin: { title: 'Admin Dashboard', gradient: 'from-purple-600 via-purple-500 to-indigo-600', icon: '👑' },
		asisten: { title: 'Asisten Dashboard', gradient: 'from-indigo-600 via-indigo-500 to-blue-600', icon: '🤝' },
		ustadz: { title: 'Ustadz Dashboard', gradient: 'from-emerald-600 via-teal-500 to-cyan-600', icon: '📚' },
		ustadzah: { title: 'Ustadzah Dashboard', gradient: 'from-pink-600 via-rose-500 to-red-600', icon: '👩‍🏫' },
		santri: { title: 'Santri Dashboard', gradient: 'from-blue-600 via-indigo-500 to-purple-600', icon: '🎓' },
		alumni: { title: 'Alumni Dashboard', gradient: 'from-amber-600 via-orange-500 to-red-600', icon: '🏆' }
	};

	const currentUser = 'currentUser' in data ? data.currentUser : null;
	const users = ('users' in data ? data.users ?? [] : []).map(u => ({ ...u, role: u.role ?? 'santri' }));
	const pending = 'pending' in data ? data.pending ?? [] : [];
	const students = 'students' in data ? data.students ?? [] : [];
	const surahs = 'surahs' in data ? data.surahs ?? [] : [];
	const checklist = 'checklist' in data ? data.checklist ?? [] : [];
	const stats = 'stats' in data ? data.stats : undefined;
	const series = 'series' in data ? data.series ?? [] : [];

	let roleCounter = { admin: 0, ustadz: 0, santri: 0 };
	$: roleCounter = users.reduce((acc, u) => ({ ...acc, [u.role]: (acc[u.role as keyof typeof acc] ?? 0) + 1 }), { admin: 0, ustadz: 0, santri: 0 });

	const approvedAyah = stats?.approved ?? 0;
	const targetAyah = checklist.reduce((sum, r) => sum + (r.totalAyah ?? 0), 0);
	const hafalanPercent = targetAyah ? Math.round((approvedAyah / targetAyah) * 100) : 0;
	const maxSeries = Math.max(...series.map(s => s.approved || 0), 1);

	let selectedSantri = '';
	let selectedSurah = '';
	let assignStatus: 'setor' | 'disetujui' = 'disetujui';
	let assignQuality = '';
	let assignMessage = '';
	let assignLoading = false;

	const displayName = (u: any) => u?.username || u?.email || 'User';
	const formatDate = (val?: any) => {
		if (!val) return '-';
		const d = new Date(val);
		return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
	};

	const assignSurah = async () => {
		if (!selectedSantri || !selectedSurah) return;
		assignLoading = true;
		assignMessage = '';
		try {
			const res = await fetch('/api/hafalan/assign', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: selectedSantri,
					surahNumber: Number(selectedSurah),
					status: assignStatus,
					qualityStatus: assignQuality || undefined
				})
			});
			const result = await res.json();
			assignMessage = result.ok ? '✅ Berhasil menyimpan setoran' : `❌ ${result.error || 'Gagal'}`;
		} catch {
			assignMessage = '❌ Terjadi kesalahan';
		} finally {
			assignLoading = false;
		}
	};
</script>

<svelte:head>
	<title>{roleConfig[data.role as keyof typeof roleConfig]?.title || 'Dashboard'}</title>
</svelte:head>

<!-- Hero Header -->
<div class="relative overflow-hidden rounded-3xl bg-gradient-to-br {roleConfig[data.role as keyof typeof roleConfig]?.gradient} p-8 text-white shadow-2xl">
	<div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
	<div class="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
	<div class="relative z-10">
		<div class="flex items-center gap-3 mb-4">
			<span class="text-5xl">{roleConfig[data.role as keyof typeof roleConfig]?.icon}</span>
			<div>
				<h1 class="text-3xl font-bold">{roleConfig[data.role as keyof typeof roleConfig]?.title}</h1>
				<p class="text-white/90 mt-1">Selamat datang, {displayName(currentUser)}</p>
			</div>
		</div>
		<div class="flex flex-wrap gap-3 mt-6">
			{#if isAdmin}
				<div class="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
					<p class="text-xs opacity-80">Total Users</p>
					<p class="text-2xl font-bold">{users.length}</p>
				</div>
				<div class="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
					<p class="text-xs opacity-80">Admin</p>
					<p class="text-2xl font-bold">{roleCounter.admin}</p>
				</div>
				<div class="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
					<p class="text-xs opacity-80">Ustadz</p>
					<p class="text-2xl font-bold">{roleCounter.ustadz}</p>
				</div>
				<div class="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
					<p class="text-xs opacity-80">Santri</p>
					<p class="text-2xl font-bold">{roleCounter.santri}</p>
				</div>
			{:else if isUstadz}
				<div class="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
					<p class="text-xs opacity-80">Santri Dibimbing</p>
					<p class="text-2xl font-bold">{students.length}</p>
				</div>
				<div class="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
					<p class="text-xs opacity-80">Setoran Pending</p>
					<p class="text-2xl font-bold">{pending.length}</p>
				</div>
				<div class="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
					<p class="text-xs opacity-80">Total Ayat Disetujui</p>
					<p class="text-2xl font-bold">{students.reduce((sum, s) => sum + (s.approvedAyah ?? 0), 0)}</p>
				</div>
			{:else}
				<div class="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
					<p class="text-xs opacity-80">Ayat Disetujui</p>
					<p class="text-2xl font-bold">{approvedAyah}</p>
				</div>
				<div class="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
					<p class="text-xs opacity-80">Progress</p>
					<p class="text-2xl font-bold">{hafalanPercent}%</p>
				</div>
				<div class="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
					<p class="text-xs opacity-80">Hari Ini</p>
					<p class="text-2xl font-bold">{stats?.todayApproved ?? 0}</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Quick Actions -->
<div class="mt-8 grid grid-cols-2 gap-4">
	{#if isAdmin}
		<a href="/dashboard/kelola-role" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">🔐</div>
			<p class="relative text-sm font-medium opacity-90">Kelola Role</p>
			<p class="relative mt-1 text-2xl font-bold">Users</p>
		</a>
		<a href="/dashboard/kelola-santri" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">👥</div>
			<p class="relative text-sm font-medium opacity-90">Kelola Santri</p>
			<p class="relative mt-1 text-2xl font-bold">{roleCounter.santri}</p>
		</a>
		<a href="/dashboard/review-setoran" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">📋</div>
			<p class="relative text-sm font-medium opacity-90">Review Setoran</p>
			<p class="relative mt-1 text-2xl font-bold">{pending.length}</p>
		</a>
		<a href="/dashboard/hafalan-belum-lancar" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">⚠️</div>
			<p class="relative text-sm font-medium opacity-90">Belum Lancar</p>
			<p class="relative mt-1 text-2xl font-bold">Monitor</p>
		</a>
		<a href="/dashboard/pencapaian-hafalan" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">🎯</div>
			<p class="relative text-sm font-medium opacity-90">Pencapaian Hafalan</p>
			<p class="relative mt-1 text-2xl font-bold">{approvedAyah}</p>
		</a>
		<a href="/dashboard/sertifikat" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">📜</div>
			<p class="relative text-sm font-medium opacity-90">Sertifikat</p>
			<p class="relative mt-1 text-2xl font-bold">Kelola</p>
		</a>
		<a href="/dashboard/request-asisten" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">🤝</div>
			<p class="relative text-sm font-medium opacity-90">Request Asisten</p>
			<p class="relative mt-1 text-2xl font-bold">Kelola</p>
		</a>
		<a href="/kalender" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">📅</div>
			<p class="relative text-sm font-medium opacity-90">Kalender</p>
			<p class="relative mt-1 text-2xl font-bold">Semua</p>
		</a>
	{:else if isAsisten}
		<a href="/dashboard/review-setoran" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">✅</div>
			<p class="relative text-sm font-medium opacity-90">Bantuan Lain</p>
			<p class="relative mt-1 text-2xl font-bold">Support</p>
		</a>
		<a href="/dashboard/pencapaian-hafalan" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">🎯</div>
			<p class="relative text-sm font-medium opacity-90">Pencapaian Hafalan</p>
			<p class="relative mt-1 text-2xl font-bold">{approvedAyah}</p>
		</a>
	{:else if isUstadz}
		<a href="/dashboard/review-setoran" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">✅</div>
			<p class="relative text-sm font-medium opacity-90">Review Setoran</p>
			<p class="relative mt-1 text-2xl font-bold">{pending.length}</p>
		</a>
		<a href="/dashboard/kelola-santri" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">👥</div>
			<p class="relative text-sm font-medium opacity-90">Santri</p>
			<p class="relative mt-1 text-2xl font-bold">{students.length}</p>
		</a>
		<a href="/dashboard/hafalan-belum-lancar" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">📊</div>
			<p class="relative text-sm font-medium opacity-90">Monitoring</p>
			<p class="relative mt-1 text-2xl font-bold">Progres</p>
		</a>
		<a href="/dashboard/pencapaian-hafalan" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">🎯</div>
			<p class="relative text-sm font-medium opacity-90">Pencapaian Hafalan</p>
			<p class="relative mt-1 text-2xl font-bold">{approvedAyah}</p>
		</a>
		<a href="/dashboard/sertifikat" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">🏆</div>
			<p class="relative text-sm font-medium opacity-90">Sertifikat</p>
			<p class="relative mt-1 text-2xl font-bold">Terbitkan</p>
		</a>
	{:else if isAlumni}
		<a href="/dashboard/hafalan-mandiri" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">📖</div>
			<p class="relative text-sm font-medium opacity-90">Hafalan Mandiri</p>
			<p class="relative mt-1 text-2xl font-bold">Muroja'ah</p>
		</a>
		<a href="/kalender" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">📅</div>
			<p class="relative text-sm font-medium opacity-90">Kalender</p>
			<p class="relative mt-1 text-2xl font-bold">Jadwal</p>
		</a>
		<a href="/dashboard/pencapaian-hafalan" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">🎯</div>
			<p class="relative text-sm font-medium opacity-90">Pencapaian</p>
			<p class="relative mt-1 text-2xl font-bold">{approvedAyah}</p>
		</a>
		<a href="/dashboard/sertifikat" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">📜</div>
			<p class="relative text-sm font-medium opacity-90">Sertifikat</p>
			<p class="relative mt-1 text-2xl font-bold">Lihat</p>
		</a>
	{:else}
		<a href="/dashboard/pencapaian-hafalan" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">🎯</div>
			<p class="relative text-sm font-medium opacity-90">Pencapaian Hafalan</p>
			<p class="relative mt-1 text-2xl font-bold">{approvedAyah}</p>
		</a>
		<a href="/kalender" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">📅</div>
			<p class="relative text-sm font-medium opacity-90">Kalender</p>
			<p class="relative mt-1 text-2xl font-bold">Jadwal</p>
		</a>
		<a href="/dashboard/setoran-hari-ini" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">📥</div>
			<p class="relative text-sm font-medium opacity-90">Setoran Hari Ini</p>
			<p class="relative mt-1 text-2xl font-bold">{stats?.todayApproved ?? 0}</p>
		</a>
		<a href="/dashboard/pencapaian-hafalan" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">🎯</div>
			<p class="relative text-sm font-medium opacity-90">Pencapaian</p>
			<p class="relative mt-1 text-2xl font-bold">{approvedAyah}</p>
		</a>
		<a href="/dashboard/halaqoh" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">🕋</div>
			<p class="relative text-sm font-medium opacity-90">Halaqoh</p>
			<p class="relative mt-1 text-2xl font-bold">Jadwal</p>
		</a>
		<a href="/dashboard/ujian-tahfidz" class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg transition hover:scale-105">
			<div class="absolute -right-4 -top-4 text-6xl opacity-20">📝</div>
			<p class="relative text-sm font-medium opacity-90">Ujian</p>
			<p class="relative mt-1 text-2xl font-bold">Tahfidz</p>
		</a>
	{/if}
</div>

<!-- Main Content -->
<div class="mt-8 grid gap-6 lg:grid-cols-3">
	<!-- Left Column (2/3) -->
	<div class="space-y-6 lg:col-span-2">
		{#if isAdmin || isUstadz}
			<!-- Quick Assign -->
			<div class="rounded-2xl border bg-white p-6 shadow-lg">
				<h2 class="text-xl font-bold text-gray-900 mb-4">⚡ Setor Cepat</h2>
				<div class="grid gap-4 md:grid-cols-3">
					<select class="select select-bordered" bind:value={selectedSantri}>
						<option value="">Pilih Santri</option>
						{#each (isAdmin ? users.filter(u => u.role === 'santri') : students) as u}
							<option value={u.id}>{displayName(u)}</option>
						{/each}
					</select>
					<select class="select select-bordered" bind:value={selectedSurah}>
						<option value="">Pilih Surah</option>
						{#each surahs as s}
							<option value={s.number}>{s.number}. {s.name}</option>
						{/each}
					</select>
					<select class="select select-bordered" bind:value={assignStatus}>
						<option value="disetujui">Disetujui</option>
						<option value="setor">Setor</option>
					</select>
				</div>
				<div class="mt-4 flex items-center gap-3">
					<select class="select select-bordered flex-1" bind:value={assignQuality}>
						<option value="">Tanpa Penilaian</option>
						<option value="hijau">🟢 Lancar</option>
						<option value="kuning">🟡 Kurang Lancar</option>
						<option value="merah">🔴 Belum Lancar</option>
					</select>
					<button class="btn btn-primary" on:click={assignSurah} disabled={assignLoading}>
						{assignLoading ? '⏳' : '✅'} Simpan
					</button>
				</div>
				{#if assignMessage}
					<p class="mt-3 text-sm {assignMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}">{assignMessage}</p>
				{/if}
			</div>
		{/if}

		{#if isSantri}
			<!-- Progress Chart -->
			<div class="rounded-2xl border bg-white p-6 shadow-lg">
				<h2 class="text-xl font-bold text-gray-900 mb-4">📊 Progress Hafalan</h2>
				<div class="flex items-center justify-between mb-4">
					<div>
						<p class="text-3xl font-bold text-emerald-600">{hafalanPercent}%</p>
						<p class="text-sm text-gray-600">{approvedAyah} dari {targetAyah} ayat</p>
					</div>
					<div class="relative h-24 w-24">
						<svg class="h-full w-full -rotate-90">
							<circle cx="48" cy="48" r="40" stroke="#e5e7eb" stroke-width="8" fill="none" />
							<circle cx="48" cy="48" r="40" stroke="#10b981" stroke-width="8" fill="none" stroke-dasharray="{(hafalanPercent / 100) * 251.2} 251.2" stroke-linecap="round" />
						</svg>
						<div class="absolute inset-0 flex items-center justify-center text-lg font-bold">{hafalanPercent}%</div>
					</div>
				</div>
				<div class="h-4 w-full overflow-hidden rounded-full bg-gray-200">
					<div class="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style="width: {hafalanPercent}%"></div>
				</div>
			</div>

			<!-- Weekly Chart -->
			<div class="rounded-2xl border bg-white p-6 shadow-lg">
				<h2 class="text-xl font-bold text-gray-900 mb-4">📈 Aktivitas 7 Hari</h2>
				<div class="grid grid-cols-7 gap-2">
					{#each series as point}
						<div class="flex flex-col items-center gap-2">
							<div class="flex h-32 w-full items-end justify-center rounded-lg bg-gray-100 p-1">
								<div class="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-indigo-500" style="height: {(point.approved / maxSeries) * 100}%"></div>
							</div>
							<p class="text-xs font-semibold">{point.approved}</p>
							<p class="text-[10px] text-gray-500">{point.label}</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if isUstadz}
			<!-- Top Santri -->
			<div class="rounded-2xl border bg-white p-6 shadow-lg">
				<h2 class="text-xl font-bold text-gray-900 mb-4">🏆 Top Santri</h2>
				<div class="space-y-3">
					{#each students.sort((a, b) => (b.approvedAyah ?? 0) - (a.approvedAyah ?? 0)).slice(0, 5) as student, i}
						<div class="flex items-center gap-4 rounded-xl bg-gradient-to-r from-gray-50 to-white p-3 border">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-lg font-bold text-white">
								{i + 1}
							</div>
							<div class="flex-1">
								<p class="font-semibold text-gray-900">{displayName(student)}</p>
								<div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
									<div class="h-full bg-emerald-500" style="width: {Math.min(100, student.percentage ?? 0)}%"></div>
								</div>
							</div>
							<div class="text-right">
								<p class="text-lg font-bold text-emerald-600">{student.approvedAyah ?? 0}</p>
								<p class="text-xs text-gray-500">ayat</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Right Column (1/3) -->
	<div class="space-y-6">
		{#if isUstadz || isAdmin}
			<!-- Pending Setoran -->
			<div class="rounded-2xl border bg-white p-6 shadow-lg">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-bold text-gray-900">⏳ Pending</h2>
					<span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{pending.length}</span>
				</div>
				<div class="space-y-2 max-h-96 overflow-auto">
					{#if pending.length === 0}
						<p class="text-center text-sm text-gray-500 py-8">Tidak ada setoran pending</p>
					{:else}
						{#each pending as item}
							<div class="rounded-lg border bg-gray-50 p-3">
								<p class="font-semibold text-sm text-gray-900">{item.email}</p>
								<p class="text-xs text-gray-600 mt-1">Surah {item.surahNumber} • Ayat {item.ayahNumber}</p>
								<p class="text-[10px] text-gray-500 mt-1">{formatDate(item.tanggalSetor)}</p>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/if}

		{#if isSantri}
			<!-- Stats Cards -->
			<div class="space-y-3">
				<div class="rounded-2xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
					<p class="text-xs font-medium text-gray-600">Disetujui</p>
					<p class="text-3xl font-bold text-blue-600 mt-1">{approvedAyah}</p>
					<p class="text-xs text-gray-500 mt-1">Total ayat tersimpan</p>
				</div>
				<div class="rounded-2xl border bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
					<p class="text-xs font-medium text-gray-600">Hari Ini</p>
					<p class="text-3xl font-bold text-emerald-600 mt-1">{stats?.todayApproved ?? 0}</p>
					<p class="text-xs text-gray-500 mt-1">Ayat disetujui hari ini</p>
				</div>
				<div class="rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-50 p-4">
					<p class="text-xs font-medium text-gray-600">Menunggu</p>
					<p class="text-3xl font-bold text-amber-600 mt-1">{stats?.submitted ?? 0}</p>
					<p class="text-xs text-gray-500 mt-1">Setoran pending</p>
				</div>
			</div>

			<!-- Checklist Surah -->
			<div class="rounded-2xl border bg-white p-6 shadow-lg">
				<h2 class="text-lg font-bold text-gray-900 mb-4">📖 Surah Progress</h2>
				<div class="space-y-2 max-h-96 overflow-auto">
					{#each checklist.slice(0, 10) as row}
						<div class="rounded-lg border p-3">
							<div class="flex items-center justify-between mb-2">
								<p class="text-sm font-semibold text-gray-900">{row.name}</p>
								<span class="text-xs text-gray-500">{row.disetujui}/{row.totalAyah}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
								<div class="h-full bg-emerald-500" style="width: {Math.min(100, (row.disetujui / (row.totalAyah || 1)) * 100)}%"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

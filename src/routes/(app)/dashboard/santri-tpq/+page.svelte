<script lang="ts">
	import { onMount } from 'svelte';
	import { UserPlus, Trash2, Users, Loader2 } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	type SantriRow = {
		id: string;
		nama: string;
		nis: string | null;
		kelas: string | null;
		waliNama: string | null;
		waliHp: string | null;
		isAktif: number;
	};

	let daftar: SantriRow[] = [];
	let memuat = true;
	let menyimpan = false;
	let galat = '';
	let pesan = '';

	const formKosong = { nama: '', nis: '', kelas: '', waliNama: '', waliHp: '' };
	let form = { ...formKosong };

	const muatDaftar = async () => {
		memuat = true;
		galat = '';
		try {
			const res = await fetch('/api/tpq/santri?limit=200');
			const hasil = await res.json();
			if (!res.ok) throw new Error(hasil?.message ?? 'Gagal memuat data santri.');
			daftar = hasil.santri ?? [];
		} catch (err) {
			galat = err instanceof Error ? err.message : 'Gagal memuat data santri.';
		} finally {
			memuat = false;
		}
	};

	const tambah = async () => {
		if (!form.nama.trim()) {
			galat = 'Nama santri wajib diisi.';
			return;
		}
		menyimpan = true;
		galat = '';
		pesan = '';
		try {
			const res = await fetch('/api/tpq/santri', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(form)
			});
			const hasil = await res.json();
			if (!res.ok) throw new Error(hasil?.message ?? 'Gagal menambah santri.');
			pesan = `${hasil.nama} berhasil ditambahkan.`;
			form = { ...formKosong };
			await muatDaftar();
		} catch (err) {
			galat = err instanceof Error ? err.message : 'Gagal menambah santri.';
		} finally {
			menyimpan = false;
		}
	};

	const hapus = async (row: SantriRow) => {
		if (!confirm(`Hapus data santri ${row.nama}?`)) return;
		galat = '';
		pesan = '';
		try {
			const res = await fetch('/api/tpq/santri', {
				method: 'DELETE',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ id: row.id })
			});
			const hasil = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(hasil?.message ?? 'Gagal menghapus santri.');
			pesan = `${row.nama} dihapus.`;
			await muatDaftar();
		} catch (err) {
			galat = err instanceof Error ? err.message : 'Gagal menghapus santri.';
		}
	};

	onMount(muatDaftar);
</script>

<svelte:head>
	<title>Data Santri TPQ - Dashboard</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-6">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">Data Santri</h1>
		<p class="mt-1 text-sm text-slate-600">
			{#if data.lembagaNama}
				{data.lembagaNama} —
			{/if}
			santri didata tanpa akun login. Cukup nama; NIS, kelas, dan data wali boleh menyusul.
		</p>
	</div>

	{#if galat}
		<div class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
			{galat}
		</div>
	{/if}

	{#if pesan}
		<div class="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
			{pesan}
		</div>
	{/if}

	<div class="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
		<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
			<UserPlus class="h-5 w-5" />
			Tambah Santri
		</h2>

		<form on:submit|preventDefault={tambah} class="grid gap-4 sm:grid-cols-2">
			<label class="sm:col-span-2">
				<span class="mb-1 block text-sm font-medium">Nama santri <span class="text-red-500">*</span></span>
				<input
					class="input input-bordered w-full"
					bind:value={form.nama}
					placeholder="Ahmad Fauzi"
					required
					maxlength="120"
				/>
			</label>

			<label>
				<span class="mb-1 block text-sm font-medium">NIS</span>
				<input class="input input-bordered w-full" bind:value={form.nis} placeholder="2026-001" />
			</label>

			<label>
				<span class="mb-1 block text-sm font-medium">Kelas</span>
				<input class="input input-bordered w-full" bind:value={form.kelas} placeholder="Iqro 3" />
			</label>

			<label>
				<span class="mb-1 block text-sm font-medium">Nama wali</span>
				<input
					class="input input-bordered w-full"
					bind:value={form.waliNama}
					placeholder="Bapak Slamet"
				/>
			</label>

			<label>
				<span class="mb-1 block text-sm font-medium">HP wali</span>
				<input
					class="input input-bordered w-full"
					bind:value={form.waliHp}
					placeholder="0812xxxxxxx"
					inputmode="tel"
				/>
			</label>

			<div class="sm:col-span-2">
				<button class="btn btn-primary" type="submit" disabled={menyimpan}>
					{#if menyimpan}
						<Loader2 class="h-4 w-4 animate-spin" />
						Menyimpan...
					{:else}
						Simpan Santri
					{/if}
				</button>
			</div>
		</form>
	</div>

	<div class="rounded-xl border border-slate-200 bg-white shadow-sm">
		<div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				<Users class="h-5 w-5" />
				Daftar Santri
			</h2>
			<span class="text-sm text-slate-500">{daftar.length} santri</span>
		</div>

		{#if memuat}
			<div class="px-5 py-10 text-center text-slate-500">Memuat data...</div>
		{:else if daftar.length === 0}
			<div class="px-5 py-10 text-center text-slate-500">
				Belum ada data santri. Tambahkan lewat formulir di atas.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table w-full">
					<thead>
						<tr>
							<th>Nama</th>
							<th>NIS</th>
							<th>Kelas</th>
							<th>Wali</th>
							<th class="text-right">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each daftar as row (row.id)}
							<tr>
								<td class="font-medium">{row.nama}</td>
								<td>{row.nis ?? '-'}</td>
								<td>{row.kelas ?? '-'}</td>
								<td>
									{#if row.waliNama || row.waliHp}
										<div>{row.waliNama ?? '-'}</div>
										{#if row.waliHp}
											<div class="text-xs text-slate-500">{row.waliHp}</div>
										{/if}
									{:else}
										-
									{/if}
								</td>
								<td class="text-right">
									<button
										class="btn btn-ghost btn-sm text-red-600"
										on:click={() => hapus(row)}
										aria-label={`Hapus ${row.nama}`}
									>
										<Trash2 class="h-4 w-4" />
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

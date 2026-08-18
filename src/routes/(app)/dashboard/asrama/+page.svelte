<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
	export let form: { error?: string; ok?: boolean } | null;

	$: occupantsByRoom = data.rooms.map((room) => ({
		...room,
		santri: data.occupants.filter((row) => row.roomId === room.id)
	}));
</script>

<svelte:head>
	<title>Asrama / Kamar | SantriOnline</title>
</svelte:head>

<div class="space-y-5">
	<section class="rounded-3xl border border-so-border bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 p-6 text-white shadow-sm">
		<p class="text-xs font-bold uppercase tracking-[0.22em] text-white/75">Operasional pondok</p>
		<h1 class="mt-2 font-display text-2xl font-bold sm:text-3xl">Asrama / Kamar</h1>
		<p class="mt-2 max-w-2xl text-sm leading-7 text-white/90">
			Catat kamar, kapasitas, dan penempatan santri di {data.org.name}.
		</p>
	</section>

	{#if form?.error}
		<p class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{form.error}</p>
	{/if}

	{#if data.canManage}
		<section class="grid gap-4 lg:grid-cols-2">
			<form method="POST" action="?/buatKamar" use:enhance class="rounded-2xl border border-so-border bg-white p-5 shadow-sm">
				<h2 class="text-lg font-bold text-so-ink">Tambah kamar</h2>
				<div class="mt-4 grid gap-3">
					<label class="text-sm font-semibold text-so-ink">
						Nama kamar
						<input class="input input-bordered mt-1 w-full" name="name" required maxlength="60" placeholder="Kamar A1" />
					</label>
					<label class="text-sm font-semibold text-so-ink">
						Kapasitas
						<input class="input input-bordered mt-1 w-full" name="capacity" type="number" min="1" max="40" value="4" />
					</label>
					<label class="text-sm font-semibold text-so-ink">
						Catatan
						<input class="input input-bordered mt-1 w-full" name="notes" maxlength="200" placeholder="Lantai 1 / kamar putra" />
					</label>
					<button class="btn bg-so-green text-white hover:bg-so-green/90" type="submit">Simpan kamar</button>
				</div>
			</form>

			<form method="POST" action="?/tempatkan" use:enhance class="rounded-2xl border border-so-border bg-white p-5 shadow-sm">
				<h2 class="text-lg font-bold text-so-ink">Tempatkan santri</h2>
				<div class="mt-4 grid gap-3">
					<label class="text-sm font-semibold text-so-ink">
						Kamar
						<select class="select select-bordered mt-1 w-full" name="room_id" required>
							<option value="">Pilih kamar</option>
							{#each data.rooms as room}
								<option value={room.id}>{room.name} ({room.occupied}/{room.capacity})</option>
							{/each}
						</select>
					</label>
					<label class="text-sm font-semibold text-so-ink">
						Santri belum ditempatkan
						<select class="select select-bordered mt-1 w-full" name="santri_id" required>
							<option value="">Pilih santri</option>
							{#each data.unassigned as santri}
								<option value={santri.id}>{santri.nama}</option>
							{/each}
						</select>
					</label>
					<button class="btn bg-so-green text-white hover:bg-so-green/90" type="submit">Tempatkan</button>
				</div>
			</form>
		</section>
	{/if}

	<section class="grid gap-4 md:grid-cols-2">
		{#each occupantsByRoom as room}
			<article class="rounded-2xl border border-so-border bg-white p-5 shadow-sm">
				<div class="flex items-start justify-between gap-3">
					<div>
						<h2 class="text-lg font-bold text-so-ink">{room.name}</h2>
						<p class="text-sm text-so-muted">{room.occupied}/{room.capacity} santri</p>
					</div>
					<span class="rounded-full bg-so-cream px-3 py-1 text-xs font-bold text-so-green">
						{room.capacity - room.occupied} kosong
					</span>
				</div>
				{#if room.notes}
					<p class="mt-2 text-sm text-so-muted">{room.notes}</p>
				{/if}
				<ul class="mt-4 space-y-2">
					{#each room.santri as santri}
						<li class="flex items-center justify-between gap-2 rounded-xl border border-so-border px-3 py-2">
							<span class="text-sm font-semibold text-so-ink">{santri.nama}</span>
							{#if data.canManage}
								<form method="POST" action="?/keluarkan" use:enhance>
									<input type="hidden" name="santri_id" value={santri.santriId} />
									<button class="text-xs font-bold text-rose-700" type="submit">Keluarkan</button>
								</form>
							{/if}
						</li>
					{:else}
						<li class="text-sm text-so-muted">Belum ada santri di kamar ini.</li>
					{/each}
				</ul>
			</article>
		{:else}
			<p class="rounded-2xl border border-dashed border-so-border p-6 text-sm text-so-muted">
				Belum ada kamar. Tambah kamar dulu, lalu tempatkan santri dari data santri pondok.
			</p>
		{/each}
	</section>
</div>

<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { BadgeCheck, Clock3, Loader2, MessageCircle, Settings } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	type AddonAktif = {
		tipeAddon: string;
		status: string;
	};

	type AddonTipe =
		| 'santri_unlimited'
		| 'raport_premium'
		| 'modul_masjid'
		| 'modul_tahfidz'
		| 'modul_musholla'
		| 'lembaga_tambahan';

	type AddonCatalogItem = {
		type: AddonTipe;
		emoji: string;
		name: string;
		price: number;
		features: string[];
	};

	type OrderResponse = {
		type?: string;
		message?: string;
		currentBalance?: number;
		requiredAmount?: number;
		shortfall?: number;
		productName?: string;
		newBalance?: number;
		orderId?: string;
	};

	type ToastKind = 'success' | 'pending' | 'error';
	type ToastState = {
		kind: ToastKind;
		message: string;
	};

	const addonCatalog = [
		{
			type: 'santri_unlimited',
			emoji: '👥',
			name: 'Santri Unlimited',
			price: 0,
			features: ['Hapus batas 30 santri aktif']
		},
		{
			type: 'raport_premium',
			emoji: '📄',
			name: 'Raport PDF Premium',
			price: 0,
			features: ['Template custom', 'Kirim ke wali via WhatsApp']
		},
		{
			type: 'modul_masjid',
			emoji: '🕌',
			name: 'Modul Masjid',
			price: 0,
			features: ['Zakat', 'Qurban', 'Agenda jamaah']
		},
		{
			type: 'modul_tahfidz',
			emoji: '📖',
			name: 'Modul Rumah Tahfidz',
			price: 0,
			features: ['Halaqoh detail', 'Ujian', 'Ijazah']
		},
		{
			type: 'modul_musholla',
			emoji: '🏠',
			name: 'Modul Musholla',
			price: 0,
			features: ['Kas musholla', 'Kegiatan rutin']
		},
		{
			type: 'lembaga_tambahan',
			emoji: '➕',
			name: 'Lembaga Tambahan',
			price: 0,
			features: ['Tambah lembaga ke-2', 'Tambah lembaga ke-3 dan seterusnya']
		}
	] satisfies AddonCatalogItem[];

	let activatingAddon: AddonTipe | null = null;
	let toast: ToastState | null = null;
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	const formatCoin = (amount: number) => new Intl.NumberFormat('id-ID').format(amount);

	const showToast = (kind: ToastKind, message: string) => {
		if (toastTimer) {
			clearTimeout(toastTimer);
		}

		toast = { kind, message };
		toastTimer = setTimeout(() => {
			toast = null;
			toastTimer = null;
		}, 4200);
	};

	const activateAddon = async (addon: AddonCatalogItem) => {
		if (!data.lembagaId) {
			showToast('error', 'Lembaga aktif tidak ditemukan untuk akun ini.');
			return;
		}

		activatingAddon = addon.type;

		try {
			const formData = new FormData();
			formData.set('addon_tipe', addon.type);
			formData.set('lembaga_id', data.lembagaId);

			const response = await fetch('?/order', {
				method: 'POST',
				body: formData
			});
			const result = deserialize(await response.text());

			if (result.type === 'failure') {
				const payload = result.data as OrderResponse | undefined;
				throw new Error(payload?.message ?? 'Gagal membuat permintaan addon.');
			}

			if (result.type === 'error') {
				throw new Error(result.error?.message ?? 'Gagal membuat permintaan addon.');
			}

			if (result.type === 'redirect') {
				window.location.href = result.location;
				return;
			}

			const payload = result.data as OrderResponse | undefined;
			if (result.type === 'success' && payload?.type === 'success') {
				showToast('success', payload.message ?? 'Permintaan addon berhasil dikirim!');
				void invalidateAll();
			} else {
				throw new Error(payload?.message ?? 'Gagal mengirim permintaan addon.');
			}
		} catch (err) {
			showToast('error', err instanceof Error ? err.message : 'Gagal memproses permintaan.');
		} finally {
			activatingAddon = null;
		}
	};

	$: activeTypes = new Set(
		((data.addonAktif ?? []) as AddonAktif[]).map((addon) => addon.tipeAddon)
	);

	$: pendingTypes = new Set(
		((data.addonAktif ?? []) as AddonAktif[])
			.filter((addon) => addon.status === 'pending')
			.map((addon) => addon.tipeAddon)
	);
</script>

<svelte:head>
	<title>Addon - SantriOnline App</title>
	<meta name="description" content="Katalog addon SantriOnline untuk lembaga aktif." />
</svelte:head>

<section class="space-y-6 font-sans">
	<header
		class="rounded-so-lg border border-so-border bg-white/88 p-5 shadow-card backdrop-blur md:p-6"
	>
		<p class="text-xs font-bold uppercase tracking-[0.22em] text-so-muted">Addon Gratis</p>
		<div class="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
			<div class="min-w-0">
				<h1 class="text-2xl font-black tracking-tight text-so-green md:text-3xl">
					Katalog Addon
				</h1>
				<p class="mt-2 max-w-2xl text-sm leading-6 text-so-muted">
					Aktivasi fitur tambahan untuk {data.lembagaNama ?? 'lembaga aktif'}. Gratis! 
					Perlu konfirmasi admin.
				</p>
			</div>
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
				<div
					class="inline-flex w-fit items-center gap-2 rounded-full border border-so-gold/40 bg-so-gold/12 px-3 py-1.5 text-xs font-bold text-so-green"
				>
					<BadgeCheck size={15} strokeWidth={2.4} />
					{activeTypes.size} addon aktif
				</div>
			</div>
		</div>
	</header>

	<div
		class="flex flex-col gap-3 rounded-so-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-card md:flex-row md:items-center"
	>
		<div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
			<MessageCircle size={19} strokeWidth={2.2} />
		</div>
		<div class="min-w-0 flex-1">
			<p class="text-sm font-semibold leading-6">
				Semua addon <strong>GRATIS</strong>! Permintaan akan dikirim ke admin untuk diverifikasi.
			</p>
			<p class="mt-1 text-xs text-emerald-700">
				<strong>Syarat:</strong> Anda harus bergabung ke grup WhatsApp SantriOnline terlebih dahulu.
				<a href="https://chat.whatsapp.com/santrionline" target="_blank" rel="noopener" class="font-bold underline hover:text-emerald-900">
					Gabung Grup WA →
				</a>
			</p>
		</div>
	</div>

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each addonCatalog as addon}
			{@const isActive = activeTypes.has(addon.type) && !pendingTypes.has(addon.type)}
			{@const isPending = pendingTypes.has(addon.type)}
			<article
				class={`flex min-h-[18rem] flex-col rounded-so-lg border bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft ${
					isActive ? 'border-so-green/45' : isPending ? 'border-amber-300' : 'border-so-border hover:border-so-gold/60'
				}`}
			>
				<div class="flex items-start justify-between gap-4">
					<div class="min-w-0">
						<div class="text-4xl leading-none" aria-hidden="true">{addon.emoji}</div>
						<h2 class="mt-4 text-lg font-black text-so-green">{addon.name}</h2>
						<p class="mt-1 flex items-center gap-1 text-sm font-bold text-emerald-600">
							<BadgeCheck size={14} strokeWidth={2.4} />
							Gratis
						</p>
					</div>

					{#if isActive}
						<span
							class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-so-green/20 bg-so-green/10 px-3 py-1 text-xs font-black text-so-green"
						>
							<BadgeCheck size={14} strokeWidth={2.4} />
							Aktif
						</span>
					{:else if isPending}
						<span
							class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"
						>
							<Clock3 size={14} strokeWidth={2.4} />
							Menunggu
						</span>
					{:else}
						<span
							class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-so-border bg-so-cream px-3 py-1 text-xs font-bold text-so-muted"
						>
							<Clock3 size={14} strokeWidth={2.4} />
							Belum aktif
						</span>
					{/if}
				</div>

				<ul class="mt-5 space-y-2 text-sm leading-6 text-so-muted">
					{#each addon.features as feature}
						<li class="flex gap-2">
							<span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-so-gold"></span>
							<span>{feature}</span>
						</li>
					{/each}
				</ul>

				<div class="mt-auto pt-6">
					{#if isActive}
						<button
							type="button"
							class="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-so-green px-4 text-sm font-bold text-white opacity-75"
							disabled
						>
							<Settings size={17} strokeWidth={2.3} />
							Kelola
						</button>
					{:else if isPending}
						<div class="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-700">
							<Clock3 size={17} strokeWidth={2.3} />
							Menunggu Konfirmasi Admin
						</div>
					{:else}
						<button
							type="button"
							class={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-4 text-sm font-black text-[#1F1A12] shadow-sm transition ${
								activatingAddon || !data.lembagaId
									? 'cursor-not-allowed opacity-70'
									: 'hover:bg-[#D7BA63]'
							}`}
							disabled={Boolean(activatingAddon) || !data.lembagaId}
							on:click={() => activateAddon(addon)}
						>
							{#if activatingAddon === addon.type}
								<Loader2 size={17} strokeWidth={2.4} class="animate-spin" />
								Mengirim...
							{:else}
								<MessageCircle size={17} strokeWidth={2.4} />
								Minta Addon
							{/if}
						</button>
					{/if}
				</div>
			</article>
		{/each}
	</div>
</section>

{#if toast}
	<div
		class={`fixed bottom-5 right-5 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-xl border px-4 py-3 text-sm font-bold shadow-soft ${
			toast.kind === 'success'
				? 'border-emerald-200 bg-emerald-50 text-emerald-800'
				: toast.kind === 'pending'
					? 'border-amber-200 bg-amber-50 text-amber-800'
					: 'border-red-200 bg-red-50 text-red-800'
		}`}
	>
		{toast.message}
	</div>
{/if}
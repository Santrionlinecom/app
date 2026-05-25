<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { BadgeCheck, Clock3, CreditCard, Loader2, Settings } from 'lucide-svelte';
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

	type SnapCallbacks = {
		onSuccess?: (result: unknown) => void;
		onPending?: (result: unknown) => void;
		onError?: (result: unknown) => void;
	};

	type SnapTokenPayload = {
		type?: string;
		snapToken?: string;
		message?: string;
	};

	type ToastKind = 'success' | 'pending' | 'error';
	type ToastState = {
		kind: ToastKind;
		message: string;
	};

	type SnapWindow = Window &
		typeof globalThis & {
			snap?: {
				pay: (token: string, callbacks?: SnapCallbacks) => void;
			};
		};

	const addonCatalog = [
		{
			type: 'santri_unlimited',
			emoji: '👥',
			name: 'Santri Unlimited',
			price: 20000,
			features: ['Hapus batas 30 santri aktif']
		},
		{
			type: 'raport_premium',
			emoji: '📄',
			name: 'Raport PDF Premium',
			price: 15000,
			features: ['Template custom', 'Kirim ke wali via WhatsApp']
		},
		{
			type: 'modul_masjid',
			emoji: '🕌',
			name: 'Modul Masjid',
			price: 25000,
			features: ['Zakat', 'Qurban', 'Agenda jamaah']
		},
		{
			type: 'modul_tahfidz',
			emoji: '📖',
			name: 'Modul Rumah Tahfidz',
			price: 20000,
			features: ['Halaqoh detail', 'Ujian', 'Ijazah']
		},
		{
			type: 'modul_musholla',
			emoji: '🏠',
			name: 'Modul Musholla',
			price: 15000,
			features: ['Kas musholla', 'Kegiatan rutin']
		},
		{
			type: 'lembaga_tambahan',
			emoji: '➕',
			name: 'Lembaga Tambahan',
			price: 15000,
			features: ['Tambah lembaga ke-2', 'Tambah lembaga ke-3 dan seterusnya']
		}
	] satisfies AddonCatalogItem[];

	let activatingAddon: AddonTipe | null = null;
	let toast: ToastState | null = null;
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	const formatRupiah = (amount: number) => new Intl.NumberFormat('id-ID').format(amount);

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

	const getMidtransSnap = () => (window as SnapWindow).snap;

	const activateAddon = async (addon: AddonCatalogItem) => {
		if (!data.lembagaId) {
			showToast('error', 'Lembaga aktif tidak ditemukan untuk akun ini.');
			return;
		}

		const snap = getMidtransSnap();
		if (!data.midtransClientKey || !snap) {
			showToast('error', 'Midtrans Snap belum siap. Muat ulang halaman lalu coba lagi.');
			return;
		}

		activatingAddon = addon.type;

		try {
			const formData = new FormData();
			formData.set('addon_tipe', addon.type);
			formData.set('lembaga_id', data.lembagaId);
			formData.set('nominal', String(addon.price));

			const response = await fetch('?/order', {
				method: 'POST',
				body: formData
			});
			const result = deserialize(await response.text());

			if (result.type === 'failure') {
				const payload = result.data as SnapTokenPayload | undefined;
				throw new Error(payload?.message ?? 'Gagal membuat order addon.');
			}

			if (result.type === 'error') {
				throw new Error(result.error?.message ?? 'Gagal membuat order addon.');
			}

			if (result.type === 'redirect') {
				window.location.href = result.location;
				return;
			}

			const payload = result.data as SnapTokenPayload | undefined;
			if (result.type !== 'success' || payload?.type !== 'snapToken' || !payload.snapToken) {
				throw new Error(payload?.message ?? 'Token pembayaran tidak tersedia.');
			}

			snap.pay(payload.snapToken, {
				onSuccess: () => {
					showToast('success', 'Pembayaran sukses. Addon sedang diaktifkan.');
					void invalidateAll();
				},
				onPending: () => {
					showToast('pending', 'Pembayaran masih pending. Selesaikan pembayaran di Midtrans.');
				},
				onError: () => {
					showToast('error', 'Pembayaran gagal diproses.');
				}
			});
		} catch (err) {
			showToast('error', err instanceof Error ? err.message : 'Gagal memulai pembayaran addon.');
		} finally {
			activatingAddon = null;
		}
	};

	$: midtransClientKey = data.midtransClientKey ?? '';
	$: activeTypes = new Set(
		((data.addonAktif ?? []) as AddonAktif[]).map((addon) => addon.tipeAddon)
	);
</script>

<svelte:head>
	<title>Addon - SantriOnline App</title>
	<meta name="description" content="Katalog addon SantriOnline untuk lembaga aktif." />
	<script src="https://app.midtrans.com/snap/snap.js" data-client-key={midtransClientKey}></script>
</svelte:head>

<section class="space-y-6 font-sans">
	<header
		class="rounded-so-lg border border-so-border bg-white/88 p-5 shadow-card backdrop-blur md:p-6"
	>
		<p class="text-xs font-bold uppercase tracking-[0.22em] text-so-muted">Addon Berbayar</p>
		<div class="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
			<div class="min-w-0">
				<h1 class="text-2xl font-black tracking-tight text-so-green md:text-3xl">
					Katalog Addon
				</h1>
				<p class="mt-2 max-w-2xl text-sm leading-6 text-so-muted">
					Aktivasi fitur tambahan untuk {data.lembagaNama ?? 'lembaga aktif'}.
				</p>
			</div>
			<div
				class="inline-flex w-fit items-center gap-2 rounded-full border border-so-gold/40 bg-so-gold/12 px-3 py-1.5 text-xs font-bold text-so-green"
			>
				<BadgeCheck size={15} strokeWidth={2.4} />
				{activeTypes.size} addon aktif
			</div>
		</div>
	</header>

	<div
		class="flex flex-col gap-3 rounded-so-lg border border-so-gold/35 bg-so-gold/12 p-4 text-so-green shadow-card md:flex-row md:items-center"
	>
		<div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-so-green text-white">
			<CreditCard size={19} strokeWidth={2.2} />
		</div>
		<p class="text-sm font-semibold leading-6">
			Pembayaran addon diproses via Midtrans Snap production untuk aktivasi bulanan.
		</p>
	</div>

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each addonCatalog as addon}
			{@const isActive = activeTypes.has(addon.type)}
			<article
				class={`flex min-h-[18rem] flex-col rounded-so-lg border bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft ${
					isActive ? 'border-so-green/45' : 'border-so-border hover:border-so-gold/60'
				}`}
			>
				<div class="flex items-start justify-between gap-4">
					<div class="min-w-0">
						<div class="text-4xl leading-none" aria-hidden="true">{addon.emoji}</div>
						<h2 class="mt-4 text-lg font-black text-so-green">{addon.name}</h2>
						<p class="mt-1 text-sm font-bold text-so-gold">
							Rp{formatRupiah(addon.price)}/bulan
						</p>
					</div>

					{#if isActive}
						<span
							class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-so-green/20 bg-so-green/10 px-3 py-1 text-xs font-black text-so-green"
						>
							<BadgeCheck size={14} strokeWidth={2.4} />
							Aktif
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
								Memproses...
							{:else}
								Aktifkan — Rp{formatRupiah(addon.price)}/bulan
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

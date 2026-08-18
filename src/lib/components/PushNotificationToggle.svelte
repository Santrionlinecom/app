<script lang="ts">
	import { onMount } from 'svelte';

	// Tombol izin notifikasi.
	//
	// PENTING: izin notifikasi hanya bisa diminta SEKALI. Kalau ditolak, browser
	// mengingatnya selamanya dan tidak bisa diminta ulang lewat kode. Karena itu
	// komponen ini sengaja tidak memunculkan permintaan otomatis — hanya setelah
	// pengguna menekan tombol dengan sadar.

	export let className = '';

	type Status = 'memeriksa' | 'tidak_didukung' | 'mati' | 'siap' | 'aktif' | 'ditolak' | 'proses';

	let status: Status = 'memeriksa';
	let pesan = '';
	let publicKey = '';

	const urlBase64ToUint8Array = (base64: string) => {
		const padding = '='.repeat((4 - (base64.length % 4)) % 4);
		const normal = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
		const biner = atob(normal);
		const bytes = new Uint8Array(biner.length);
		for (let i = 0; i < biner.length; i += 1) bytes[i] = biner.charCodeAt(i);
		return bytes;
	};

	onMount(async () => {
		if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
			status = 'tidak_didukung';
			return;
		}

		try {
			const respons = await fetch('/api/push/subscribe');
			const data = (await respons.json()) as { enabled: boolean; publicKey: string | null };
			if (!data.enabled || !data.publicKey) {
				status = 'mati';
				return;
			}
			publicKey = data.publicKey;
		} catch {
			status = 'mati';
			return;
		}

		if (Notification.permission === 'denied') {
			status = 'ditolak';
			return;
		}

		const registrasi = await navigator.serviceWorker.ready;
		const langganan = await registrasi.pushManager.getSubscription();
		status = langganan ? 'aktif' : 'siap';
	});

	const nyalakan = async () => {
		status = 'proses';
		pesan = '';
		try {
			const izin = await Notification.requestPermission();
			if (izin !== 'granted') {
				status = izin === 'denied' ? 'ditolak' : 'siap';
				return;
			}

			const registrasi = await navigator.serviceWorker.ready;
			const langganan = await registrasi.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(publicKey)
			});

			const respons = await fetch('/api/push/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(langganan.toJSON())
			});
			if (!respons.ok) throw new Error('gagal menyimpan');

			status = 'aktif';
		} catch {
			status = 'siap';
			pesan = 'Gagal mengaktifkan pengingat. Coba lagi sebentar lagi.';
		}
	};

	const matikan = async () => {
		status = 'proses';
		try {
			const registrasi = await navigator.serviceWorker.ready;
			const langganan = await registrasi.pushManager.getSubscription();
			if (langganan) {
				await fetch('/api/push/subscribe', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ endpoint: langganan.endpoint })
				});
				await langganan.unsubscribe();
			}
			status = 'siap';
		} catch {
			status = 'aktif';
			pesan = 'Gagal mematikan pengingat.';
		}
	};
</script>

{#if status !== 'memeriksa' && status !== 'mati' && status !== 'tidak_didukung'}
	<div class={`rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 ${className}`}>
		{#if status === 'aktif'}
			<p class="text-sm font-semibold text-emerald-800">Pengingat harian aktif</p>
			<p class="mt-1 text-xs text-emerald-700">
				Kamu akan diingatkan supaya setoran dan hafalan tidak terlewat.
			</p>
			<button
				type="button"
				on:click={matikan}
				class="mt-3 text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
			>
				Matikan pengingat
			</button>
		{:else if status === 'ditolak'}
			<p class="text-sm font-semibold text-slate-700">Pengingat diblokir browser</p>
			<p class="mt-1 text-xs text-slate-600">
				Izin notifikasi pernah ditolak. Untuk mengaktifkan kembali, ubah izin situs ini lewat
				pengaturan browser.
			</p>
		{:else}
			<p class="text-sm font-semibold text-emerald-900">Nyalakan pengingat harian</p>
			<p class="mt-1 text-xs text-emerald-700">
				Supaya streak belajarmu tidak putus. Bisa dimatikan kapan saja.
			</p>
			<button
				type="button"
				on:click={nyalakan}
				disabled={status === 'proses'}
				class="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
			>
				{status === 'proses' ? 'Menyiapkan…' : 'Nyalakan pengingat'}
			</button>
		{/if}

		{#if pesan}
			<p class="mt-2 text-xs text-red-600">{pesan}</p>
		{/if}
	</div>
{/if}

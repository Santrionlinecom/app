<script lang="ts">
	// Editor desain: kanvas Fabric untuk lembaga membuat banner, poster,
	// sertifikat, dan twibbon sendiri.
	//
	// Fabric SENGAJA dimuat lewat dynamic import di dalam onMount: pustaka ini
	// menyentuh `window` dan `document` saat modulnya dievaluasi, sehingga
	// import statis akan meruntuhkan SSR Cloudflare Workers.
	import { onDestroy, onMount } from 'svelte';
	import Download from '@lucide/svelte/icons/download';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Loader from '@lucide/svelte/icons/loader';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Type from '@lucide/svelte/icons/type';
	import UserRound from '@lucide/svelte/icons/user-round';
	import {
		UKURAN_KERTAS,
		cariUkuran,
		dpiAman,
		penggandaCetak,
		ukuranCetakPx,
		ukuranKerjaPx
	} from '$lib/desain/ukuran-cetak';
	import { hitungFontMuat, kiriTerpusat } from '$lib/desain/teks-muat';

	/** Baris teks awal dari template terpilih. */
	export let barisAwal: string[] = [];
	/** Kelas gradien Tailwind milik template, dipakai sebagai warna dasar. */
	export let warnaDasar = '#064e3b';
	/** Nama berkas saat diunduh. */
	export let namaBerkas = 'desain-santrionline';

	let elemenKanvas: HTMLCanvasElement;
	let wadah: HTMLDivElement;
	let kanvas: any = null;
	let fabricNs: any = null;

	/**
	 * Konteks 2D khusus pengukuran teks — tidak pernah digambar ke layar.
	 * Dipakai measureText() untuk tahu lebar teks sebenarnya sebelum objek
	 * Fabric dibuat.
	 *
	 * Tipenya ditulis lokal, bukan CanvasRenderingContext2D global, karena
	 * tsconfig proyek memakai "types": ["node"] sehingga pustaka DOM tidak
	 * ikut dimuat. Mengubah setelan itu berdampak ke seluruh proyek, jadi
	 * cukup dipersempit di sini.
	 */
	type PengukurKanvas = {
		font: string;
		measureText: (teks: string) => { width: number };
	};
	let konteksUkur: PengukurKanvas | null = null;

	let ukuranId = 'a4-potret';
	let siap = false;
	let sibuk = false;
	let pesan = '';
	let galat = '';
	let adaPilihan = false;

	/** Mode twibbon: foto pengguna di belakang, bingkai acara di depan. */
	let modeTwibbon = false;
	let fotoTwibbon: any = null;
	let bingkaiTwibbon: any[] = [];

	$: ukuran = cariUkuran(ukuranId);
	$: kerja = ukuranKerjaPx(ukuran.mm);
	$: dpi = dpiAman(ukuran.mm);
	$: cetak = ukuranCetakPx(ukuran.mm, dpi);

	/** Batas unggahan; foto ponsel modern bisa 8–12 MB. */
	const MAKS_UNGGAH = 8 * 1024 * 1024;

	/**
	 * Pasang teks yang dijamin muat di dalam kanvas.
	 *
	 * Fabric TIDAK mengecilkan huruf saat teks melebihi lebar Textbox — ia
	 * membungkus per kata, dan satu KATA yang lebih lebar dari kotaknya akan
	 * meluber. Dengan textAlign 'center', luapan itu terbagi ke kiri dan
	 * kanan sehingga teks terpotong di KEDUA tepi.
	 *
	 * Lebar diukur dengan measureText() dari Canvas 2D — API peramban baku,
	 * bukan properti internal Fabric yang bisa berubah antar versi.
	 */
	const ukurTeks = (teks: string, fontSize: number, tebal: boolean) => {
		const ctx = konteksUkur;
		// Cadangan saat konteks belum siap: perkiraan kasar lebar rata-rata
		// huruf. Hanya dipakai sebelum kanvas terbentuk.
		if (!ctx) return teks.length * fontSize * 0.55;
		ctx.font = `${tebal ? 'bold ' : ''}${fontSize}px Arial`;
		return ctx.measureText(teks).width;
	};

	const buatTeksMuat = (
		fabric: any,
		isi: string,
		opsi: { top: number; fontSize: number; tebal?: boolean; lebarKanvas: number }
	) => {
		const lebarKotak = opsi.lebarKanvas * 0.86;
		const tebal = opsi.tebal ?? false;
		const font = hitungFontMuat(
			(t, s) => ukurTeks(t, s, tebal),
			isi,
			lebarKotak,
			opsi.fontSize
		);

		const kiri = kiriTerpusat(opsi.lebarKanvas, lebarKotak);

		return new fabric.Textbox(isi, {
			// originX WAJIB dinyatakan tegas. Fabric v7 memperlakukan `left`
			// sebagai titik PUSAT saat originX 'center', sehingga kotak selebar
			// 683px dengan left=56 sebenarnya dimulai di x=-285 dan terpotong
			// tepi kiri kanvas — persis cacat yang terlihat pada judul
			// "Selamat Hari Santri Nasional" (tulisan mulai x=0, berhenti 376,
			// menyisakan 418px kosong di kanan).
			originX: 'left',
			originY: 'top',
			left: kiri,
			top: opsi.top,
			width: lebarKotak,
			fontSize: font,
			fontWeight: tebal ? 'bold' : 'normal',
			fill: '#ffffff',
			textAlign: 'center',
			fontFamily: 'Arial'
		});
	};

	const bersihkanPesan = () => {
		pesan = '';
		galat = '';
	};

	onMount(() => {
		let dibatalkan = false;

		(async () => {
			try {
				// Dynamic import: wajib, karena Fabric butuh window.
				const fabric = await import('fabric');
				if (dibatalkan) return;
				fabricNs = fabric;

				// Kanvas terpisah khusus mengukur teks. Tidak pernah dipasang
				// ke halaman, jadi tidak menambah beban render.
				konteksUkur = document
					.createElement('canvas')
					.getContext('2d') as unknown as PengukurKanvas | null;

				kanvas = new fabric.Canvas(elemenKanvas, {
					width: kerja.lebar,
					height: kerja.tinggi,
					backgroundColor: warnaDasar,
					preserveObjectStacking: true
				});

				// Lacak pilihan supaya tombol Hapus tahu diri.
				const perbaruiPilihan = () => {
					adaPilihan = Boolean(kanvas?.getActiveObject());
				};
				kanvas.on('selection:created', perbaruiPilihan);
				kanvas.on('selection:updated', perbaruiPilihan);
				kanvas.on('selection:cleared', perbaruiPilihan);

				// Isi teks awal dari template supaya pengguna tidak mulai dari
				// kanvas kosong — ini yang membuat template terasa berguna.
				barisAwal.slice(0, 3).forEach((baris, i) => {
					const teks = buatTeksMuat(fabric, baris, {
						top: kerja.tinggi * (0.16 + i * 0.14),
						fontSize: i === 0 ? kerja.lebar * 0.075 : kerja.lebar * 0.042,
						tebal: i === 0,
						lebarKanvas: kerja.lebar
					});
					kanvas.add(teks);
				});
				kanvas.renderAll();
				siap = true;
			} catch (e) {
				galat = 'Editor gagal dimuat. Muat ulang halaman untuk mencoba lagi.';
				console.error('[desain] gagal memuat Fabric', e);
			}
		})();

		return () => {
			dibatalkan = true;
		};
	});

	onDestroy(() => {
		// Lepas kanvas agar bitmap tidak menumpuk saat pindah template.
		try {
			kanvas?.dispose();
		} catch {
			// kanvas mungkin belum sempat terbentuk
		}
		kanvas = null;
	});

	/** Ganti ukuran kertas tanpa kehilangan objek yang sudah dibuat. */
	const gantiUkuran = () => {
		if (!kanvas) return;
		bersihkanPesan();
		const baru = ukuranKerjaPx(cariUkuran(ukuranId).mm);
		const lama = { lebar: kanvas.getWidth(), tinggi: kanvas.getHeight() };
		const skalaX = baru.lebar / lama.lebar;
		const skalaY = baru.tinggi / lama.tinggi;

		kanvas.setDimensions({ width: baru.lebar, height: baru.tinggi });
		// Bingkai twibbon dibuat dari ukuran kanvas lama, jadi harus dibangun
		// ulang — kalau tidak, lubangnya melenceng setelah ganti ukuran.
		const twibbonAktif = modeTwibbon;
		if (twibbonAktif) lepasBingkaiTwibbon();

		// Reposisi proporsional supaya tata letak tidak berantakan.
		kanvas.getObjects().forEach((o: any) => {
			o.set({
				left: (o.left ?? 0) * skalaX,
				top: (o.top ?? 0) * skalaY,
				scaleX: (o.scaleX ?? 1) * skalaX,
				scaleY: (o.scaleY ?? 1) * skalaY
			});
			o.setCoords();
		});

		if (twibbonAktif) {
			pasangBingkaiTwibbon();
			kanvas.getObjects().forEach((o: any) => {
				if (o.type === 'textbox') kanvas.bringObjectToFront(o);
			});
			if (fotoTwibbon) kanvas.sendObjectToBack(fotoTwibbon);
		}
		kanvas.renderAll();
	};

	const tambahTeks = () => {
		if (!kanvas || !fabricNs) return;
		bersihkanPesan();
		const teks = buatTeksMuat(fabricNs, 'Tulis teks di sini', {
			top: kanvas.getHeight() * 0.45,
			fontSize: kanvas.getWidth() * 0.05,
			lebarKanvas: kanvas.getWidth()
		});
		kanvas.add(teks);
		if (modeTwibbon) kanvas.bringObjectToFront(teks);
		kanvas.setActiveObject(teks);
		kanvas.renderAll();
	};

	/**
	 * Unggah foto dari perangkat. Berkas TIDAK dikirim ke server.
	 *
	 * Pada mode twibbon, foto masuk ke LAPISAN PALING BELAKANG supaya bingkai
	 * acara (teks dan ornamen) tetap terbaca di atasnya — inilah inti twibbon:
	 * wajah pengguna di belakang, bingkai di depan.
	 */
	const unggahFoto = async (event: Event) => {
		const input = event.target as HTMLInputElement;
		const berkas = input.files?.[0];
		if (!berkas || !kanvas || !fabricNs) return;
		bersihkanPesan();

		if (!berkas.type.startsWith('image/')) {
			galat = 'Berkas harus berupa gambar (JPG, PNG, atau WebP).';
			input.value = '';
			return;
		}
		if (berkas.size > MAKS_UNGGAH) {
			galat = `Ukuran foto ${(berkas.size / 1024 / 1024).toFixed(1)} MB melebihi batas 8 MB.`;
			input.value = '';
			return;
		}

		sibuk = true;
		try {
			const dataUrl = await new Promise<string>((selesai, tolak) => {
				const pembaca = new FileReader();
				pembaca.onload = () => selesai(String(pembaca.result));
				pembaca.onerror = () => tolak(new Error('gagal membaca berkas'));
				pembaca.readAsDataURL(berkas);
			});

			const gambar = await fabricNs.FabricImage.fromURL(dataUrl);

			if (modeTwibbon) {
				// MENUTUP seluruh kanvas (bukan muat di dalam): foto twibbon
				// harus mengisi penuh, sisi lebihnya terpotong wajar seperti
				// object-fit: cover.
				const tutup = Math.max(
					kanvas.getWidth() / (gambar.width || 1),
					kanvas.getHeight() / (gambar.height || 1)
				);
				gambar.set({
					originX: 'center',
					originY: 'center',
					left: kanvas.getWidth() / 2,
					top: kanvas.getHeight() / 2,
					scaleX: tutup,
					scaleY: tutup
				});
				kanvas.add(gambar);
				// Kunci twibbon: dorong ke lapisan terbawah.
				kanvas.sendObjectToBack(gambar);
				fotoTwibbon = gambar;
				pesan = 'Foto masuk di belakang bingkai. Geser dan perbesar untuk mengatur posisi wajah.';
			} else {
				const muat = Math.min(
					(kanvas.getWidth() * 0.6) / (gambar.width || 1),
					(kanvas.getHeight() * 0.6) / (gambar.height || 1)
				);
				gambar.set({
					left: kanvas.getWidth() * 0.2,
					top: kanvas.getHeight() * 0.2,
					scaleX: muat,
					scaleY: muat
				});
				kanvas.add(gambar);
				pesan = 'Foto ditambahkan. Geser dan ubah ukurannya sesuai kebutuhan.';
			}

			kanvas.setActiveObject(gambar);
			kanvas.renderAll();
		} catch (e) {
			galat = 'Foto gagal dimuat. Coba berkas lain.';
			console.error('[desain] gagal memuat foto', e);
		} finally {
			sibuk = false;
			input.value = '';
		}
	};

	/**
	 * Mode twibbon: pasang bingkai berlubang supaya wajah pengguna terlihat.
	 *
	 * Dibuat dari dua persegi: satu menutup seluruh kanvas, satu lagi lubang
	 * transparan di tengah. Fabric tidak punya "mask" bawaan yang sederhana,
	 * jadi lubangnya dibuat dengan menggambar empat bilah di tepi — pendekatan
	 * ini bekerja di semua peramban dan tetap tajam saat diekspor karena
	 * seluruhnya vektor.
	 */
	const pasangBingkaiTwibbon = () => {
		if (!kanvas || !fabricNs) return;
		const L = kanvas.getWidth();
		const T = kanvas.getHeight();
		// Lubang: 78% lebar, ditempatkan agak ke atas supaya ada ruang teks.
		const lubang = {
			l: L * 0.11,
			t: T * 0.08,
			w: L * 0.78,
			h: T * 0.62
		};
		const bilah = [
			{ left: 0, top: 0, width: L, height: lubang.t },
			{ left: 0, top: lubang.t + lubang.h, width: L, height: T - (lubang.t + lubang.h) },
			{ left: 0, top: lubang.t, width: lubang.l, height: lubang.h },
			{ left: lubang.l + lubang.w, top: lubang.t, width: L - (lubang.l + lubang.w), height: lubang.h }
		];

		bingkaiTwibbon = bilah.map((b) => {
			const r = new fabricNs.Rect({
				...b,
				// Sama seperti Textbox: tanpa originX tegas, bilah bergeser
				// setengah lebarnya dan lubang twibbon jadi melenceng.
				originX: 'left',
				originY: 'top',
				fill: warnaDasar,
				selectable: false,
				evented: false,
				excludeFromExport: false
			});
			kanvas.add(r);
			return r;
		});
		kanvas.renderAll();
	};

	const lepasBingkaiTwibbon = () => {
		if (!kanvas) return;
		bingkaiTwibbon.forEach((r) => kanvas.remove(r));
		bingkaiTwibbon = [];
		kanvas.renderAll();
	};

	/** Nyalakan atau matikan mode twibbon. */
	const alihkanTwibbon = () => {
		if (!kanvas) return;
		bersihkanPesan();
		modeTwibbon = !modeTwibbon;

		if (modeTwibbon) {
			pasangBingkaiTwibbon();
			// Teks harus di atas bingkai agar tetap terbaca.
			kanvas.getObjects().forEach((o: any) => {
				if (o.type === 'textbox') kanvas.bringObjectToFront(o);
			});
			// Foto yang sudah ada didorong ke belakang.
			if (fotoTwibbon) kanvas.sendObjectToBack(fotoTwibbon);
			pesan = 'Mode twibbon aktif. Unggah foto Anda — foto akan masuk di belakang bingkai.';
		} else {
			lepasBingkaiTwibbon();
			pesan = 'Mode twibbon dimatikan.';
		}
		kanvas.renderAll();
	};

	const hapusPilihan = () => {
		if (!kanvas) return;
		bersihkanPesan();
		kanvas.getActiveObjects().forEach((o: any) => kanvas.remove(o));
		kanvas.discardActiveObject();
		kanvas.renderAll();
	};

	const unduh = (dataUrl: string, ekstensi: string) => {
		const a = document.createElement('a');
		a.href = dataUrl;
		a.download = `${namaBerkas}.${ekstensi}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	/**
	 * Ekspor PNG pada resolusi cetak.
	 *
	 * Kuncinya `multiplier`: Fabric merender ULANG seluruh objek pada ukuran
	 * penuh, bukan memperbesar bitmap kanvas kerja. Tanpa itu hasilnya buram.
	 */
	const eksporPng = async () => {
		if (!kanvas) return;
		bersihkanPesan();
		sibuk = true;
		try {
			// Beri browser satu frame agar indikator sibuk sempat tampil.
			await new Promise((r) => setTimeout(r, 30));
			const dataUrl = kanvas.toDataURL({
				format: 'png',
				multiplier: penggandaCetak(ukuran.mm, dpi)
			});
			unduh(dataUrl, 'png');
			pesan = `PNG ${cetak.lebar}x${cetak.tinggi} px (${dpi} dpi) berhasil diunduh.`;
		} catch (e) {
			galat = 'Ekspor gagal. Coba ukuran yang lebih kecil.';
			console.error('[desain] ekspor png gagal', e);
		} finally {
			sibuk = false;
		}
	};

	/** Ekspor PDF berukuran fisik benar, memakai pdf-lib yang sudah terpasang. */
	const eksporPdf = async () => {
		if (!kanvas) return;
		bersihkanPesan();
		sibuk = true;
		try {
			await new Promise((r) => setTimeout(r, 30));
			const { PDFDocument } = await import('pdf-lib');
			const dataUrl = kanvas.toDataURL({
				format: 'png',
				multiplier: penggandaCetak(ukuran.mm, dpi)
			});
			const pngBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());

			const pdf = await PDFDocument.create();
			// PDF memakai satuan poin: 1 poin = 1/72 inci = 25,4/72 mm.
			const lebarPt = (ukuran.mm.lebar / 25.4) * 72;
			const tinggiPt = (ukuran.mm.tinggi / 25.4) * 72;
			const halaman = pdf.addPage([lebarPt, tinggiPt]);
			const gambar = await pdf.embedPng(pngBytes);
			halaman.drawImage(gambar, { x: 0, y: 0, width: lebarPt, height: tinggiPt });

			const bytes = await pdf.save();
			// pdf-lib mengembalikan Uint8Array yang buffer-nya bertipe
			// ArrayBufferLike, sedangkan Blob menuntut ArrayBuffer. Disalin ke
			// Uint8Array baru agar tipenya pasti dan isinya tetap sama.
			const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
			const url = URL.createObjectURL(blob);
			unduh(url, 'pdf');
			URL.revokeObjectURL(url);
			pesan = `PDF ${ukuran.mm.lebar} x ${ukuran.mm.tinggi} mm berhasil diunduh.`;
		} catch (e) {
			galat = 'Ekspor PDF gagal. Coba unduh PNG sebagai gantinya.';
			console.error('[desain] ekspor pdf gagal', e);
		} finally {
			sibuk = false;
		}
	};
</script>

<div class="rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
	<div class="flex flex-wrap items-center gap-2">
		<label class="text-sm font-bold text-white/70" for="ukuran-kertas">Ukuran</label>
		<select
			id="ukuran-kertas"
			bind:value={ukuranId}
			on:change={gantiUkuran}
			class="rounded-xl border border-white/20 bg-slate-900 px-3 py-2 text-sm font-bold text-white"
		>
			{#each UKURAN_KERTAS as u}
				<option value={u.id}>{u.nama}</option>
			{/each}
		</select>
		<span class="text-xs text-white/50">{ukuran.catatan} · {cetak.lebar}×{cetak.tinggi} px @{dpi}dpi</span>
	</div>

	<div class="mt-4 flex flex-wrap gap-2">
		<button
			type="button"
			on:click={alihkanTwibbon}
			disabled={!siap || sibuk}
			class="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black disabled:opacity-40"
			class:bg-amber-400={modeTwibbon}
			class:text-slate-950={modeTwibbon}
			class:bg-white-10={!modeTwibbon}
			class:text-white={!modeTwibbon}
			style={modeTwibbon ? '' : 'background-color: rgba(255,255,255,0.1)'}
		>
			<UserRound class="h-4 w-4" />
			{modeTwibbon ? 'Twibbon: AKTIF' : 'Mode Twibbon'}
		</button>

		<button
			type="button"
			on:click={tambahTeks}
			disabled={!siap || sibuk}
			class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-40"
		>
			<Type class="h-4 w-4" /> Tambah teks
		</button>

		<label
			class="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
			class:pointer-events-none={!siap || sibuk}
			class:opacity-40={!siap || sibuk}
		>
			<ImagePlus class="h-4 w-4" />
			{modeTwibbon ? 'Unggah foto Anda' : 'Unggah foto'}
			<input type="file" accept="image/*" class="hidden" on:change={unggahFoto} />
		</label>

		<button
			type="button"
			on:click={hapusPilihan}
			disabled={!siap || sibuk || !adaPilihan}
			class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-40"
		>
			<Trash2 class="h-4 w-4" /> Hapus
		</button>

		<button
			type="button"
			on:click={eksporPng}
			disabled={!siap || sibuk}
			class="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-40"
		>
			{#if sibuk}<Loader class="h-4 w-4 animate-spin" />{:else}<Download class="h-4 w-4" />{/if}
			PNG cetak
		</button>

		<button
			type="button"
			on:click={eksporPdf}
			disabled={!siap || sibuk}
			class="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-2 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-40"
		>
			<Download class="h-4 w-4" /> PDF
		</button>
	</div>

	{#if galat}
		<p class="mt-3 rounded-xl bg-rose-500/15 px-4 py-2 text-sm font-bold text-rose-200">{galat}</p>
	{:else if pesan}
		<p class="mt-3 rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-200">{pesan}</p>
	{/if}

	<div bind:this={wadah} class="mt-4 overflow-auto rounded-2xl bg-slate-950/60 p-3">
		<!--
			Kanvas Fabric dibungkus pembatas lebar. Fabric menyuntikkan
			wrapper .canvas-container dengan lebar tetap dalam piksel, sehingga
			kanvas A4 (794px) meluber keluar kolom dan memotong teks di layar
			sempit. Aturan CSS di bawah memaksa seluruh lapisan Fabric ikut
			menyusut mengikuti kolom, tanpa mengubah ukuran kanvas sebenarnya —
			jadi hasil ekspor tetap resolusi penuh.
		-->
		<div class="pembatas-kanvas mx-auto">
			<canvas bind:this={elemenKanvas} class="rounded-lg shadow-2xl"></canvas>
		</div>
		{#if !siap && !galat}
			<p class="py-10 text-center text-sm text-white/60">Menyiapkan editor…</p>
		{/if}
	</div>

	<p class="mt-3 text-xs leading-5 text-white/50">
		Foto diproses di perangkat Anda sendiri dan tidak diunggah ke server SantriOnline.
		Klik objek untuk memilih, seret untuk memindah, tarik sudutnya untuk mengubah ukuran.
		Klik dua kali pada teks untuk menyuntingnya.
	</p>
</div>

<style>
	/* :global dibutuhkan karena .canvas-container dibuat Fabric saat runtime,
	   bukan ditulis di markup, sehingga tidak kena scoping Svelte. */
	.pembatas-kanvas :global(.canvas-container) {
		max-width: 100% !important;
		height: auto !important;
	}
	.pembatas-kanvas :global(canvas) {
		max-width: 100%;
		height: auto !important;
	}
</style>

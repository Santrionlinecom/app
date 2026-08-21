<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';

	export let bookId: string;
	export let chapterId = '';
	export let userName = '';
	export let initialPage = 1;
	export let totalPages = 0;

	type PdfJsWindow = Window & {
		pdfjsLib?: any;
		__santriPdfJsLoading?: Promise<any>;
	};

	const PDFJS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
	const PDFJS_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

	/**
	 * Mode Buku (flipbook) menyuapkan gambar halaman ke StPageFlip.
	 *
	 * Gambar dibuat sebagai JPEG, bukan PNG. Satu bab novel bisa 4 halaman dan
	 * PNG teks-di-atas-putih berukuran ~1,5 MB per halaman; JPEG mutu 0,88
	 * turun ke ratusan KB dengan selisih ketajaman yang tidak terlihat pada
	 * ukuran layar. Untuk buku 100 bab, selisih inilah yang menjaga heap tetap
	 * datar saat pembaca berpindah bab.
	 */
	const FLIP_IMAGE_TYPE = 'image/jpeg';
	const FLIP_IMAGE_QUALITY = 0.88;

	let canvasWrap: HTMLDivElement | null = null;
	let canvases: (HTMLCanvasElement | null)[] = [];
	let pageNumbers: number[] = [];
	let currentPage = Math.max(1, Number(initialPage || 1));
	let pageTotal = Number(totalPages || 0);
	let isLoading = true;
	let errorMessage = '';
	let pdfDoc: any = null;
	let deviceFingerprint = '';
	let resizeTimer: ReturnType<typeof setTimeout> | undefined;
	let progressTimer: ReturnType<typeof setTimeout> | undefined;
	let pageObserver: IntersectionObserver | null = null;
	let renderQueue = Promise.resolve();
	let isMounted = false;

	// --- Mode Buku ---------------------------------------------------------
	let flipMode = false;
	let flipBuilding = false;
	let flipNotice = '';
	let flipContainer: HTMLDivElement | null = null;
	let flipInstance: any = null;
	let flipImages: string[] = [];
	let flipProgress = 0;

	/**
	 * Penanda generasi. Setiap pemuatan bab / pergantian mode menaikkan nilai
	 * ini sehingga proses render yang masih berjalan tahu dirinya sudah usang
	 * dan berhenti tanpa menyentuh state milik bab baru.
	 */
	let generation = 0;

	/** Kunci bab yang sedang termuat, dipakai mendeteksi perpindahan bab. */
	let loadedKey = '';

	$: progressPercent = pageTotal > 0 ? Math.min(100, (currentPage / pageTotal) * 100) : 0;

	// Navigasi bab memakai <a href> di halaman induk, dan halaman itu tidak
	// membungkus komponen ini dalam blok {#key}. Akibatnya instance komponen
	// dipakai ulang: onMount tidak berjalan lagi dan PDF bab lama tetap
	// tampil. Reaktivitas di bawah yang memuat ulang sekaligus melepas
	// dokumen lama.
	$: if (isMounted && `${bookId}::${chapterId}` !== loadedKey) {
		void loadPdf();
	}

	async function loadPdfJs() {
		const win = window as PdfJsWindow;
		if (win.pdfjsLib) return win.pdfjsLib;

		if (!win.__santriPdfJsLoading) {
			win.__santriPdfJsLoading = new Promise((resolve, reject) => {
				const existing = document.querySelector<HTMLScriptElement>(`script[src="${PDFJS_SRC}"]`);
				if (existing) {
					existing.addEventListener('load', () => resolve(win.pdfjsLib));
					existing.addEventListener('error', reject);
					return;
				}

				const script = document.createElement('script');
				script.src = PDFJS_SRC;
				script.async = true;
				script.onload = () => resolve(win.pdfjsLib);
				script.onerror = reject;
				document.head.appendChild(script);
			});
		}

		const pdfjsLib = await win.__santriPdfJsLoading;
		pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
		return pdfjsLib;
	}

	async function generateFingerprint() {
		const raw = [
			navigator.userAgent,
			navigator.language,
			navigator.platform,
			`${screen.width}x${screen.height}`,
			new Date().getTimezoneOffset(),
			navigator.hardwareConcurrency || 0
		].join('|');

		if (crypto?.subtle) {
			const bytes = new TextEncoder().encode(raw);
			const digest = await crypto.subtle.digest('SHA-256', bytes);
			return Array.from(new Uint8Array(digest))
				.slice(0, 16)
				.map((value) => value.toString(16).padStart(2, '0'))
				.join('');
		}

		let hash = 0;
		for (let i = 0; i < raw.length; i += 1) {
			hash = (hash << 5) - hash + raw.charCodeAt(i);
			hash |= 0;
		}
		return Math.abs(hash).toString(16);
	}

	async function renderPageToCanvas(pageNumber: number) {
		const canvas = canvases[pageNumber - 1];
		if (!pdfDoc || !canvas) return;

		const pdfPage = await pdfDoc.getPage(pageNumber);
		const baseViewport = pdfPage.getViewport({ scale: 1 });
		const availableWidth = Math.max(300, (canvasWrap?.clientWidth || window.innerWidth) - 32);
		const scale = Math.min(2.1, Math.max(0.85, availableWidth / baseViewport.width));
		const viewport = pdfPage.getViewport({ scale });
		const ctx = canvas.getContext('2d');

		if (!ctx) return;
		canvas.width = Math.floor(viewport.width);
		canvas.height = Math.floor(viewport.height);

		await pdfPage.render({ canvasContext: ctx, viewport }).promise;
		drawWatermark(ctx, canvas.width, canvas.height);

		// pdf.js menyimpan struktur operator per halaman; tanpa cleanup()
		// cache itu ikut menumpuk saat pembaca melintasi banyak bab.
		pdfPage.cleanup();
	}

	function renderAllPages() {
		renderQueue = renderQueue.then(async () => {
			errorMessage = '';
			try {
				for (let pageNumber = 1; pageNumber <= pageTotal; pageNumber += 1) {
					await renderPageToCanvas(pageNumber);
				}
			} catch (err) {
				console.error('PDF render error:', err);
				errorMessage = 'Halaman gagal dimuat. Coba buka ulang bacaan ini.';
			}
		});
		return renderQueue;
	}

	function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
		const label = `SantriOnline - ${userName || 'Pembaca'}`;
		ctx.save();
		ctx.globalAlpha = 0.06;
		ctx.fillStyle = '#0f766e';
		ctx.font = '700 24px Arial, sans-serif';
		ctx.textAlign = 'center';

		for (let y = 140; y < height + 160; y += 300) {
			for (let x = 120; x < width + 260; x += 460) {
				ctx.save();
				ctx.translate(x, y);
				ctx.rotate((-28 * Math.PI) / 180);
				ctx.fillText(label, 0, 0);
				ctx.restore();
			}
		}
		ctx.restore();
	}

	function queueProgressUpdate() {
		clearTimeout(progressTimer);
		progressTimer = setTimeout(() => {
			void updateProgress();
		}, 1200);
	}

	async function updateProgress() {
		try {
			await fetch('/api/drm/progress', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bookId,
					chapterId,
					currentPage,
					totalPages: pageTotal
				})
			});
		} catch (err) {
			console.error('Reading progress error:', err);
		}
	}

	function observePages() {
		pageObserver?.disconnect();
		if (!('IntersectionObserver' in window)) return;

		pageObserver = new IntersectionObserver(
			(entries) => {
				let bestRatio = 0;
				let bestPage = 0;
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					const page = Number((entry.target as HTMLElement).dataset.page || 0);
					if (entry.intersectionRatio > bestRatio && page > 0) {
						bestRatio = entry.intersectionRatio;
						bestPage = page;
					}
				}
				if (bestPage > 0 && bestPage !== currentPage) {
					currentPage = bestPage;
					queueProgressUpdate();
				}
			},
			{ root: canvasWrap, threshold: [0.25, 0.5, 0.75] }
		);

		for (const canvas of canvases) {
			if (canvas) pageObserver.observe(canvas);
		}
	}

	/**
	 * Lepas seluruh sumber daya milik bab yang sedang tampil.
	 * Dipanggil sebelum memuat bab lain dan saat komponen dibongkar.
	 */
	async function releaseChapter() {
		generation += 1;
		destroyFlip();
		releaseFlipImages();

		pageObserver?.disconnect();
		pageObserver = null;

		// Melepas referensi elemen saja tidak membebaskan backing store canvas.
		// Menolkan dimensi memaksa peramban melepas bitmap-nya saat itu juga.
		for (const canvas of canvases) {
			if (!canvas) continue;
			canvas.width = 0;
			canvas.height = 0;
		}
		canvases = [];
		pageNumbers = [];

		if (pdfDoc) {
			const previous = pdfDoc;
			pdfDoc = null;
			try {
				await previous.cleanup?.();
				await previous.destroy?.();
			} catch (err) {
				console.error('PDF cleanup error:', err);
			}
		}
	}

	async function loadPdf() {
		const key = `${bookId}::${chapterId}`;
		loadedKey = key;

		await releaseChapter();
		const token = generation;

		isLoading = true;
		errorMessage = '';
		flipNotice = '';

		try {
			const pdfjsLib = await loadPdfJs();
			deviceFingerprint = await generateFingerprint();
			const params = new URLSearchParams({
				book: bookId,
				fp: deviceFingerprint,
				ua: navigator.userAgent.slice(0, 80)
			});
			if (chapterId) params.set('chapter', chapterId);

			const doc = await pdfjsLib.getDocument({
				url: `/api/drm/serve-pdf?${params.toString()}`,
				withCredentials: true
			}).promise;

			// Bab lain sudah diminta selagi dokumen ini diunduh.
			if (token !== generation) {
				await doc.destroy?.();
				return;
			}

			pdfDoc = doc;
			pageTotal = Number(pdfDoc.numPages || 0);
			pageNumbers = Array.from({ length: pageTotal }, (_, index) => index + 1);
			currentPage = 1;
			isLoading = false;

			await tick();
			if (token !== generation) return;

			if (flipMode) {
				await buildFlipbook(token);
				return;
			}

			await renderAllPages();
			if (token !== generation) return;
			observePages();

			const startPage = Math.min(Math.max(1, Number(initialPage || 1)), pageTotal || 1);
			if (startPage > 1) {
				canvases[startPage - 1]?.scrollIntoView({ block: 'start' });
				currentPage = startPage;
			}
		} catch (err) {
			if (token !== generation) return;
			console.error('PDF load error:', err);
			errorMessage = 'Bacaan belum bisa dibuka. Pastikan akses dan perangkat masih valid.';
			isLoading = false;
		}
	}

	// --- Mode Buku ---------------------------------------------------------

	function releaseFlipImages() {
		// Data URL adalah string biasa di heap. Mengosongkan array-nya adalah
		// satu-satunya cara melepasnya; tidak ada revokeObjectURL di sini
		// karena tidak ada blob URL yang dibuat (URL blob bisa disalin
		// pembaca dan akan melubangi DRM).
		flipImages = [];
	}

	function destroyFlip() {
		if (flipInstance) {
			try {
				flipInstance.destroy();
			} catch (err) {
				console.error('Flipbook destroy error:', err);
			}
			flipInstance = null;
		}
		if (flipContainer) flipContainer.innerHTML = '';
	}

	/** Ubah satu halaman PDF menjadi data URL berwatermark. */
	async function renderPageToDataUrl(pageNumber: number, width: number) {
		const pdfPage = await pdfDoc.getPage(pageNumber);
		const baseViewport = pdfPage.getViewport({ scale: 1 });

		// Batasi kepadatan piksel: layar HP ber-DPR 3 akan membuat canvas
		// tiga kali lipat dan itu yang bikin ponsel kelas menengah tersendat.
		const ratio = Math.min(window.devicePixelRatio || 1, 2);
		const scale = Math.min(2.2, Math.max(0.8, (width * ratio) / baseViewport.width));
		const viewport = pdfPage.getViewport({ scale });

		const canvas = document.createElement('canvas');
		canvas.width = Math.floor(viewport.width);
		canvas.height = Math.floor(viewport.height);
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas 2D tidak tersedia');

		// JPEG tidak punya kanal alfa; tanpa alas putih hasilnya jadi hitam.
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		await pdfPage.render({ canvasContext: ctx, viewport }).promise;
		drawWatermark(ctx, canvas.width, canvas.height);
		pdfPage.cleanup();

		const dataUrl = canvas.toDataURL(FLIP_IMAGE_TYPE, FLIP_IMAGE_QUALITY);

		// Canvas sementara ini tidak pernah masuk DOM, tapi bitmap-nya tetap
		// menempati memori sampai dinolkan.
		canvas.width = 0;
		canvas.height = 0;

		return dataUrl;
	}

	/**
	 * Pastikan setiap data URL benar-benar bisa didekode peramban.
	 *
	 * StPageFlip.loadFromImages() tidak melempar galat saat gambarnya cacat —
	 * sudah diuji, ia diam saja dan menyisakan panggung kosong. Karena itu
	 * pendekodean diperiksa lebih dulu di sini supaya kegagalan bisa
	 * ditangkap dan dijatuhkan ke mode gulir, bukan berakhir sebagai layar
	 * kosong di tangan pembaca.
	 */
	function decodeImages(sources: string[]) {
		return Promise.all(
			sources.map(
				(src) =>
					new Promise<void>((resolve, reject) => {
						const probe = new Image();
						probe.onload = () => (probe.naturalWidth > 0 ? resolve() : reject(new Error('Gambar kosong')));
						probe.onerror = () => reject(new Error('Gambar gagal didekode'));
						probe.src = src;
					})
			)
		);
	}

	async function buildFlipbook(token: number) {
		if (!pdfDoc || pageTotal < 1) return;

		flipBuilding = true;
		flipProgress = 0;
		flipNotice = '';

		try {
			const targetWidth = Math.min(
				560,
				Math.max(280, Math.floor(((flipContainer?.clientWidth || window.innerWidth) - 24) / 2))
			);

			const images: string[] = [];
			for (let pageNumber = 1; pageNumber <= pageTotal; pageNumber += 1) {
				// Render hanya bab yang sedang dibuka, dan berhenti begitu
				// pembaca pindah bab atau mematikan mode.
				if (token !== generation) return;
				images.push(await renderPageToDataUrl(pageNumber, targetWidth));
				flipProgress = Math.round((pageNumber / pageTotal) * 100);
			}

			if (token !== generation) return;

			await decodeImages(images);

			const module = await import('page-flip');
			const PageFlip = (module as any).PageFlip ?? (module as any).default ?? module;

			if (token !== generation) return;

			flipImages = images;
			await tick();

			if (!flipContainer || token !== generation) return;
			destroyFlip();

			flipInstance = new PageFlip(flipContainer, {
				width: 420,
				height: 580,
				size: 'stretch',
				minWidth: 240,
				maxWidth: 560,
				minHeight: 330,
				maxHeight: 760,
				usePortrait: true,
				autoSize: true,
				maxShadowOpacity: 0.25,
				showCover: false,
				mobileScrollSupport: true,
				flippingTime: 700,
				swipeDistance: 30,
				startPage: 0,
				drawShadow: true,
				useMouseEvents: true
			});

			flipInstance.loadFromImages(images);
			flipInstance.on('flip', (event: { data: number }) => {
				const page = Number(event.data) + 1;
				if (page > 0 && page !== currentPage) {
					currentPage = Math.min(page, pageTotal);
					queueProgressUpdate();
				}
			});

			await tick();
			if (token !== generation) return;

			// Pemeriksaan terakhir: StPageFlip menggambar ke <canvas> miliknya.
			// Kalau panggung tetap kosong atau tanpa dimensi, perlakukan
			// sebagai kegagalan alih-alih menyerahkan layar kosong.
			const stageOk = Boolean(
				flipContainer.querySelector('canvas, .stf__item, img') &&
					flipContainer.getBoundingClientRect().height > 0
			);
			if (!stageOk) throw new Error('Panggung Mode Buku kosong');

			currentPage = 1;
		} catch (err) {
			console.error('Flipbook error:', err);
			if (token !== generation) return;

			// Syarat verifikasi: kegagalan render harus jatuh ke mode gulir,
			// bukan layar kosong.
			destroyFlip();
			releaseFlipImages();
			flipMode = false;
			flipNotice = 'Mode Buku belum bisa dijalankan di perangkat ini. Kembali ke mode gulir.';
			await tick();
			await renderAllPages();
			observePages();
		} finally {
			if (token === generation) flipBuilding = false;
		}
	}

	async function toggleFlipMode() {
		if (flipBuilding || isLoading || !pdfDoc) return;

		// Menaikkan generasi membatalkan render mode sebelumnya yang mungkin
		// masih berjalan.
		generation += 1;
		const token = generation;

		flipNotice = '';

		if (flipMode) {
			// Matikan: lepas flipbook beserta gambarnya, lalu susun ulang
			// canvas gulir.
			destroyFlip();
			releaseFlipImages();
			flipMode = false;
			flipBuilding = false;
			await tick();
			if (token !== generation) return;
			await renderAllPages();
			if (token !== generation) return;
			observePages();
			return;
		}

		// Nyalakan: canvas gulir dilepas dulu supaya bitmap-nya tidak
		// menganggur selama flipbook aktif.
		pageObserver?.disconnect();
		pageObserver = null;
		for (const canvas of canvases) {
			if (!canvas) continue;
			canvas.width = 0;
			canvas.height = 0;
		}

		flipMode = true;
		await tick();
		await buildFlipbook(token);
	}

	function blockCopy(event: Event) {
		event.preventDefault();
	}

	function blockKeys(event: KeyboardEvent) {
		const key = event.key.toLowerCase();
		if ((event.ctrlKey || event.metaKey) && ['s', 'p', 'c', 'a'].includes(key)) {
			event.preventDefault();
		}
	}

	function handleResize() {
		if (!pdfDoc) return;
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			// Flipbook mengurus penskalaannya sendiri lewat size: 'stretch';
			// membangun ulang gambar tiap resize justru memicu render mahal.
			if (flipMode) {
				flipInstance?.update?.();
				return;
			}
			void renderAllPages();
		}, 200);
	}

	onMount(() => {
		isMounted = true;
		void loadPdf();
		document.addEventListener('keydown', blockKeys);
		window.addEventListener('resize', handleResize);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', blockKeys);
		window.removeEventListener('resize', handleResize);
		clearTimeout(resizeTimer);
		clearTimeout(progressTimer);
		void releaseChapter();
	});
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="reader-shell" on:contextmenu={blockCopy}>
	{#if isLoading}
		<div class="reader-state">
			<div class="spinner" aria-hidden="true"></div>
			<p>Memuat bacaan...</p>
		</div>
	{:else if errorMessage}
		<div class="reader-state">
			<p class="state-title">Bacaan tidak dapat dimuat</p>
			<p>{errorMessage}</p>
			<button type="button" on:click={() => loadPdf()}>Coba Lagi</button>
		</div>
	{:else}
		<div class="reader-toolbar">
			<span>Halaman {currentPage} / {pageTotal}</span>
			<button
				type="button"
				class="mode-toggle"
				class:is-active={flipMode}
				role="switch"
				aria-checked={flipMode}
				disabled={flipBuilding}
				on:click={toggleFlipMode}
			>
				<span class="mode-dot" aria-hidden="true"></span>
				{flipMode ? 'Mode Buku' : 'Mode Gulir'}
			</button>
		</div>

		<div class="progress-bar" aria-hidden="true">
			<div class="progress-fill" style={`width: ${progressPercent}%`}></div>
		</div>

		{#if flipNotice}
			<p class="flip-notice" role="status">{flipNotice}</p>
		{/if}

		{#if flipMode}
			<div class="flip-wrap">
				{#if flipBuilding}
					<div class="reader-state flip-loading">
						<div class="spinner" aria-hidden="true"></div>
						<p>Menyiapkan Mode Buku... {flipProgress}%</p>
					</div>
				{/if}
				<div
					class="flip-stage"
					class:is-hidden={flipBuilding}
					bind:this={flipContainer}
					on:copy|preventDefault
					on:dragstart|preventDefault
				></div>
			</div>
		{:else}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="canvas-wrap"
				bind:this={canvasWrap}
				on:copy|preventDefault
				on:dragstart|preventDefault
			>
				{#each pageNumbers as pageNumber (pageNumber)}
					<canvas data-page={pageNumber} bind:this={canvases[pageNumber - 1]}></canvas>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.reader-shell {
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(15, 23, 42, 0.16);
		border-radius: 18px;
		background: #111827;
		box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
		user-select: none;
		-webkit-user-select: none;
	}

	.reader-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 10px 12px;
		background: #0f172a;
		color: #f8fafc;
		font-size: 14px;
		font-weight: 700;
	}

	.mode-toggle {
		display: inline-flex;
		min-height: 36px;
		align-items: center;
		gap: 8px;
		border: 1px solid rgba(148, 163, 184, 0.4);
		border-radius: 999px;
		padding: 0 14px;
		background: transparent;
		color: #e2e8f0;
		font: inherit;
		font-size: 12px;
		font-weight: 800;
		cursor: pointer;
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.mode-toggle:hover:not(:disabled) {
		border-color: #10b981;
		color: #ffffff;
	}

	.mode-toggle:disabled {
		cursor: progress;
		opacity: 0.6;
	}

	.mode-toggle.is-active {
		border-color: #10b981;
		background: #10b981;
		color: #ffffff;
	}

	.mode-dot {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: #64748b;
	}

	.mode-toggle.is-active .mode-dot {
		background: #ffffff;
	}

	.reader-state button {
		min-height: 42px;
		border: 0;
		border-radius: 10px;
		background: #10b981;
		color: #ffffff;
		font: inherit;
		font-size: 13px;
		font-weight: 800;
		cursor: pointer;
	}

	.progress-bar {
		height: 4px;
		background: #1f2937;
	}

	.progress-fill {
		height: 100%;
		background: #10b981;
		transition: width 0.25s ease;
	}

	.flip-notice {
		margin: 0;
		padding: 10px 14px;
		background: #78350f;
		color: #fef3c7;
		font-size: 12px;
		font-weight: 700;
		text-align: center;
	}

	.canvas-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		overflow: auto;
		max-height: min(82vh, 920px);
		padding: 14px;
		background: #111827;
	}

	canvas {
		max-width: 100%;
		height: auto;
		background: #ffffff;
		box-shadow: 0 12px 34px rgba(0, 0, 0, 0.34);
	}

	.flip-wrap {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: min(82vh, 920px);
		padding: 14px;
		background: #111827;
	}

	.flip-stage {
		width: 100%;
		max-width: 1120px;
	}

	.flip-stage.is-hidden {
		visibility: hidden;
		position: absolute;
		pointer-events: none;
	}

	.flip-loading {
		min-height: 260px;
	}

	.reader-state {
		display: flex;
		min-height: 340px;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 28px;
		text-align: center;
		color: #cbd5e1;
	}

	.reader-state p {
		margin: 0;
		max-width: 28rem;
		font-size: 14px;
		line-height: 1.7;
	}

	.reader-state .state-title {
		color: #ffffff;
		font-size: 18px;
		font-weight: 800;
	}

	.reader-state button {
		margin-top: 4px;
		padding: 0 18px;
	}

	.spinner {
		width: 34px;
		height: 34px;
		border: 3px solid rgba(255, 255, 255, 0.18);
		border-top-color: #10b981;
		border-radius: 999px;
		animation: spin 0.9s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 640px) {
		.reader-shell {
			border-radius: 12px;
		}

		.reader-toolbar {
			font-size: 12px;
		}

		.canvas-wrap {
			max-height: 76vh;
			padding: 8px;
			gap: 10px;
		}

		.flip-wrap {
			min-height: 76vh;
			padding: 8px;
		}
	}
</style>

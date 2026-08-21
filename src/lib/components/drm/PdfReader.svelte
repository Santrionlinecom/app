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

	$: progressPercent = pageTotal > 0 ? Math.min(100, (currentPage / pageTotal) * 100) : 0;

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

	async function loadPdf() {
		isLoading = true;
		errorMessage = '';

		try {
			const pdfjsLib = await loadPdfJs();
			deviceFingerprint = await generateFingerprint();
			const params = new URLSearchParams({
				book: bookId,
				fp: deviceFingerprint,
				ua: navigator.userAgent.slice(0, 80)
			});
			if (chapterId) params.set('chapter', chapterId);

			pdfDoc = await pdfjsLib.getDocument({
				url: `/api/drm/serve-pdf?${params.toString()}`,
				withCredentials: true
			}).promise;
			pageTotal = Number(pdfDoc.numPages || 0);
			pageNumbers = Array.from({ length: pageTotal }, (_, index) => index + 1);
			isLoading = false;

			await tick();
			await renderAllPages();
			observePages();

			const startPage = Math.min(Math.max(1, Number(initialPage || 1)), pageTotal || 1);
			if (startPage > 1) {
				canvases[startPage - 1]?.scrollIntoView({ block: 'start' });
				currentPage = startPage;
			}
		} catch (err) {
			console.error('PDF load error:', err);
			errorMessage = 'Bacaan belum bisa dibuka. Pastikan akses dan perangkat masih valid.';
			isLoading = false;
		}
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
			void renderAllPages();
		}, 200);
	}

	onMount(() => {
		void loadPdf();
		document.addEventListener('keydown', blockKeys);
		window.addEventListener('resize', handleResize);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', blockKeys);
		window.removeEventListener('resize', handleResize);
		clearTimeout(resizeTimer);
		clearTimeout(progressTimer);
		pageObserver?.disconnect();
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
			<button type="button" on:click={loadPdf}>Coba Lagi</button>
		</div>
	{:else}
		<div class="reader-toolbar">
			<span>Halaman {currentPage} / {pageTotal}</span>
		</div>

		<div class="progress-bar" aria-hidden="true">
			<div class="progress-fill" style={`width: ${progressPercent}%`}></div>
		</div>

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
		justify-content: center;
		gap: 10px;
		padding: 10px;
		background: #0f172a;
		color: #f8fafc;
		font-size: 14px;
		font-weight: 700;
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

		.canvas-wrap {
			max-height: 76vh;
			padding: 8px;
			gap: 10px;
		}
	}
</style>

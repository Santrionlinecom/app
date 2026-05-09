<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

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

	let canvas: HTMLCanvasElement | null = null;
	let canvasWrap: HTMLDivElement | null = null;
	let currentPage = Math.max(1, Number(initialPage || 1));
	let pageTotal = Number(totalPages || 0);
	let isLoading = true;
	let isRendering = false;
	let errorMessage = '';
	let pdfDoc: any = null;
	let deviceFingerprint = '';
	let resizeTimer: ReturnType<typeof setTimeout> | undefined;

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

	async function renderPage(pageNumber: number) {
		if (!pdfDoc || !canvas || isRendering) return;
		isRendering = true;
		errorMessage = '';

		try {
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

			currentPage = pageNumber;
			pageTotal = Number(pdfDoc.numPages || pageTotal || 0);
			await updateProgress();
		} catch (err) {
			console.error('PDF render error:', err);
			errorMessage = 'Halaman gagal dimuat. Coba buka ulang bacaan ini.';
		} finally {
			isRendering = false;
		}
	}

	function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
		const label = `SantriOnline - ${userName || 'Pembaca'}`;
		ctx.save();
		ctx.globalAlpha = 0.12;
		ctx.fillStyle = '#0f766e';
		ctx.font = '700 26px Arial, sans-serif';
		ctx.textAlign = 'center';

		for (let y = 100; y < height + 120; y += 180) {
			for (let x = 80; x < width + 220; x += 300) {
				ctx.save();
				ctx.translate(x, y);
				ctx.rotate((-28 * Math.PI) / 180);
				ctx.fillText(label, 0, 0);
				ctx.restore();
			}
		}
		ctx.restore();
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
			await renderPage(Math.min(Math.max(1, currentPage), pageTotal || 1));
		} catch (err) {
			console.error('PDF load error:', err);
			errorMessage = 'Bacaan belum bisa dibuka. Pastikan akses dan perangkat masih valid.';
		} finally {
			isLoading = false;
		}
	}

	function nextPage() {
		if (currentPage < pageTotal) void renderPage(currentPage + 1);
	}

	function prevPage() {
		if (currentPage > 1) void renderPage(currentPage - 1);
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
			void renderPage(currentPage);
		}, 180);
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
			<button type="button" on:click={prevPage} disabled={currentPage <= 1 || isRendering}>
				Sebelumnya
			</button>
			<span>{currentPage} / {pageTotal}</span>
			<button type="button" on:click={nextPage} disabled={currentPage >= pageTotal || isRendering}>
				Berikutnya
			</button>
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
			<canvas bind:this={canvas}></canvas>
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
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		gap: 10px;
		padding: 10px;
		background: #0f172a;
		color: #f8fafc;
		font-size: 14px;
		font-weight: 700;
	}

	.reader-toolbar button,
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

	.reader-toolbar button {
		padding: 0 14px;
	}

	.reader-toolbar button:first-child {
		justify-self: start;
	}

	.reader-toolbar button:last-child {
		justify-self: end;
	}

	.reader-toolbar button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
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
		justify-content: center;
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

		.reader-toolbar {
			grid-template-columns: 1fr;
			justify-items: stretch;
			text-align: center;
		}

		.reader-toolbar button:first-child,
		.reader-toolbar button:last-child {
			justify-self: stretch;
		}

		.canvas-wrap {
			max-height: 76vh;
			padding: 8px;
		}
	}
</style>

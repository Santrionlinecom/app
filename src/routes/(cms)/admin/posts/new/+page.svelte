<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Eye from '@lucide/svelte/icons/eye';
	import FileAudio2 from '@lucide/svelte/icons/file-audio-2';
	import ImageIcon from '@lucide/svelte/icons/image';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Save from '@lucide/svelte/icons/save';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Upload from '@lucide/svelte/icons/upload';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
	import MediaGalleryModal from '$lib/components/MediaGalleryModal.svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';

	type AiGeneratedDraft = {
		title: string;
		slug: string;
		excerpt: string;
		content: string;
		seo_keyword: string;
		meta_description: string;
		warnings?: string[];
	};

	type GeneratedArticlePayload = {
		judul: string;
		ringkasan: string;
		meta_description: string;
		focus_keyword: string;
		isi: string;
		image_prompt: string;
	};

	type GenerateArtikelResponse = {
		success?: boolean;
		data?: GeneratedArticlePayload;
		error?: string;
		detail?: string;
	};

	type GeneratedAssetResponse = {
		success?: boolean;
		url?: string;
		error?: string;
		detail?: string;
		truncated?: boolean;
	};

	let slug = $state('');
	let title = $state('');
	let content = $state('');
	let excerpt = $state('');
	let seo_keyword = $state('');
	let meta_description = $state('');
	let editingSlug = $state(false);
	let thumbnail_url = $state('');
	let schedule_date = $state('');
	let schedule_time = $state('');
	let status = $state<'draft' | 'published'>('draft');
	let fileInput: HTMLInputElement | null = null;
	let aiTopic = $state('');
	let aiAudience = $state('santri dan pembaca muslim umum');
	let aiTone = $state('edukatif, santun, profesional');
	let aiLength = $state('Sedang');
	let aiContentType = $state('Artikel edukasi');
	let aiReferenceNotes = $state('');
	let aiLoading = $state(false);
	let aiAction = $state<'complete' | 'seo' | ''>('');
	let aiError = $state('');
	let aiNotice = $state('');
	let aiGenerateStep = $state('');
	let isGeneratingThumb = $state(false);
	let isGeneratingAudio = $state(false);
	let generatedImagePrompt = $state('');
	let audioIdUrl = $state('');
	let audioArabUrl = $state('');

	const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
	const slugify = (value: string) =>
		value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '')
			.replace(/-{2,}/g, '-');

	function generateSlug() {
		slug = slugify(title);
	}

	const plainContent = $derived(stripHtml(content));
	const wordCount = $derived(plainContent ? plainContent.split(/\s+/).filter(Boolean).length : 0);
	const titleLength = $derived(title.trim().length);
	const metaLength = $derived(meta_description.trim().length);
	const hasSchedule = $derived(Boolean(schedule_date));
	const publishLabel = $derived(
		status === 'published' ? (hasSchedule ? 'Jadwalkan Publikasi' : 'Publikasikan') : 'Simpan Draft'
	);

	const seoChecks = $derived(() => {
		const keyword = seo_keyword.trim().toLowerCase();
		const firstBlock = plainContent.slice(0, 300).toLowerCase();
		return [
			{
				label: 'Judul 40-60 karakter',
				met: titleLength >= 40 && titleLength <= 60,
				help: `${titleLength}/60 karakter`
			},
			{
				label: 'Keyword ada di judul',
				met: keyword ? title.toLowerCase().includes(keyword) : false,
				help: keyword ? seo_keyword : 'Isi focus keyword'
			},
			{
				label: 'Keyword muncul di awal konten',
				met: keyword ? firstBlock.includes(keyword) : false,
				help: 'Cek 300 karakter pertama'
			},
			{
				label: 'Konten minimal 300 kata',
				met: wordCount >= 300,
				help: `${wordCount} kata`
			}
		];
	});

	const seoScore = $derived(seoChecks().filter((item) => item.met).length * 25);
	const seoTone = $derived(() => {
		if (seoScore >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
		if (seoScore >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
		return 'text-rose-700 bg-rose-50 border-rose-200';
	});
	const seoBarClass = $derived(() => {
		if (seoScore >= 75) return 'bg-emerald-600';
		if (seoScore >= 50) return 'bg-amber-500';
		return 'bg-rose-500';
	});

	function applyAiDraft(draft: AiGeneratedDraft) {
		if (draft.title) title = draft.title;
		if (draft.slug) slug = slugify(draft.slug);
		else if (!editingSlug && draft.title) slug = slugify(draft.title);
		if (draft.content) content = draft.content;
		if (draft.excerpt) excerpt = draft.excerpt;
		if (draft.seo_keyword) seo_keyword = draft.seo_keyword;
		if (draft.meta_description) meta_description = draft.meta_description;
	}

	const readAiError = (data: { error?: string; detail?: string }) =>
		[data.error, data.detail].filter(Boolean).join(' ') || 'Gagal memproses konten AI.';

	const extractFirstArabicText = (html: string) => {
		const plain = stripHtml(html);
		const matches = plain.match(/[\u0600-\u06FF][\u0600-\u06FF\s\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED،؛؟ـ]{8,}/g);
		return matches?.[0]?.replace(/\s+/g, ' ').trim().slice(0, 200) || '';
	};

	async function parseAssetResponse(res: Response) {
		const data = (await res.json().catch(() => ({}))) as GeneratedAssetResponse;
		if (!res.ok || !data.success) {
			throw new Error(readAiError(data));
		}
		return data;
	}

	async function generateLengkap() {
		const topic = aiTopic.trim() || title.trim() || seo_keyword.trim();
		aiError = '';
		aiNotice = '';
		aiGenerateStep = '';
		audioIdUrl = '';
		audioArabUrl = '';
		generatedImagePrompt = '';

		if (!topic) {
			aiError = 'Isi topik, judul, atau focus keyword sebelum generate lengkap.';
			return;
		}

		aiLoading = true;
		aiAction = 'complete';
		aiGenerateStep = 'Membuat artikel...';
		try {
			const generationId =
				typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now());
			const artikelRes = await fetch('/api/admin/generate-artikel', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					topik: topic,
					jenis: aiContentType,
					panjang: aiLength,
					target: aiAudience,
					gaya: aiTone,
					catatan: aiReferenceNotes,
					post_id: generationId
				})
			});
			const artikelData = (await artikelRes.json().catch(() => ({}))) as GenerateArtikelResponse;

			if (!artikelRes.ok || !artikelData.success || !artikelData.data) {
				throw new Error(readAiError(artikelData));
			}

			const article = artikelData.data;
			title = article.judul;
			if (!editingSlug) slug = slugify(article.judul);
			content = article.isi;
			excerpt = article.ringkasan;
			meta_description = article.meta_description;
			seo_keyword = article.focus_keyword;
			generatedImagePrompt = article.image_prompt;

			const assetWarnings: string[] = [];

			aiGenerateStep = 'Membuat thumbnail...';
			isGeneratingThumb = true;
			try {
				const thumbRes = await fetch('/api/admin/generate-thumbnail', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						image_prompt: article.image_prompt,
						post_id: generationId
					})
				});
				const thumbData = await parseAssetResponse(thumbRes);
				if (thumbData.url) thumbnail_url = thumbData.url;
			} catch (err: any) {
				assetWarnings.push(`Thumbnail belum dibuat: ${err?.message || 'gagal memproses gambar'}.`);
			} finally {
				isGeneratingThumb = false;
			}

			const arabText = extractFirstArabicText(article.isi);
			if (arabText) {
				aiGenerateStep = 'Membuat audio Arab...';
				isGeneratingAudio = true;
				try {
					const ttsArRes = await fetch('/api/admin/generate-tts-ar', {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({
							teks_arab: arabText,
							post_id: generationId
						})
					});
					const ttsArData = await parseAssetResponse(ttsArRes);
					if (ttsArData.url) audioArabUrl = ttsArData.url;
				} catch (err: any) {
					assetWarnings.push(`Audio Arab belum dibuat: ${err?.message || 'gagal memproses audio'}.`);
				} finally {
					isGeneratingAudio = false;
				}
			}

			aiGenerateStep = 'Membuat narasi Indonesia...';
			isGeneratingAudio = true;
			try {
				const ttsIdRes = await fetch('/api/admin/generate-tts-id', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						teks: stripHtml(article.isi),
						post_id: generationId
					})
				});
				const ttsIdData = await parseAssetResponse(ttsIdRes);
				if (ttsIdData.url) audioIdUrl = ttsIdData.url;
				if (ttsIdData.truncated) {
					assetWarnings.push('Narasi Indonesia dibuat dari cuplikan awal artikel.');
				}
			} catch (err: any) {
				assetWarnings.push(`Narasi Indonesia belum dibuat: ${err?.message || 'gagal memproses audio'}.`);
			} finally {
				isGeneratingAudio = false;
			}

			aiGenerateStep = 'Selesai';
			aiNotice = assetWarnings.length
				? `Artikel berhasil dibuat. ${assetWarnings.join(' ')}`
				: 'Artikel, thumbnail, dan audio berhasil dibuat.';
		} catch (err: any) {
			aiError = err?.message || 'Gagal generate konten AI.';
		} finally {
			aiLoading = false;
			aiAction = '';
			isGeneratingThumb = false;
			isGeneratingAudio = false;
			setTimeout(() => {
				if (!aiLoading) aiGenerateStep = '';
			}, 3000);
		}
	}

	async function optimizeSeoWithAi() {
		const keyword = seo_keyword.trim() || aiTopic.trim() || title.trim();
		aiError = '';
		aiNotice = '';

		if (!title.trim() || !plainContent.trim()) {
			aiError = 'Generate atau isi judul dan konten dulu sebelum optimasi SEO.';
			return;
		}

		aiLoading = true;
		aiAction = 'seo';
		try {
			const failedChecks = seoChecks()
				.filter((item) => !item.met)
				.map((item) => `${item.label}: ${item.help}`);

			const res = await fetch('/api/admin/posts/ai-generate', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					mode: 'optimize_seo',
					topic: aiTopic || title,
					keyword,
					currentTitle: title,
					currentSlug: slug,
					currentContent: content,
					currentExcerpt: excerpt,
					currentMetaDescription: meta_description,
					currentSeoScore: seoScore,
					failedChecks
				})
			});
			const data = (await res.json().catch(() => ({}))) as {
				ok?: boolean;
				draft?: AiGeneratedDraft;
				error?: string;
				detail?: string;
			};

			if (!res.ok || !data.ok || !data.draft) {
				throw new Error(readAiError(data));
			}

			applyAiDraft(data.draft);
			aiNotice = 'Optimasi SEO diterapkan. Skor akan terhitung ulang otomatis di panel SEO.';
		} catch (err: any) {
			aiError = err?.message || 'Gagal optimasi SEO.';
		} finally {
			aiLoading = false;
			aiAction = '';
		}
	}

	async function onPickFeatured(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		const form = new FormData();
		form.append('file', file);
		try {
			const res = await fetch('/api/upload', { method: 'POST', body: form });
			if (!res.ok) throw new Error('Upload gagal');
			const { url } = await res.json();
			thumbnail_url = url;
		} catch (err) {
			console.error('Upload featured image error:', err);
			alert('Gagal mengunggah gambar. Pastikan layanan unggah media aktif.');
		} finally {
			target.value = '';
		}
	}
</script>

<svelte:head>
	<title>Tulis Post Baru - Admin Santri Online</title>
</svelte:head>

<div class="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
	<div class="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<a href="/admin/posts" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-600">
				<ArrowLeft class="h-4 w-4" />
				Kembali ke daftar post
			</a>
			<h1 class="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Tulis post baru</h1>
			<p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
				Susun artikel, optimasi SEO, pilih thumbnail, lalu simpan sebagai draft atau publikasikan.
			</p>
		</div>
		<div class={`inline-flex w-fit items-center gap-3 rounded-lg border px-4 py-3 ${seoTone()}`}>
			<span class="text-sm font-semibold">SEO {seoScore}/100</span>
			<div class="h-2 w-24 overflow-hidden rounded-full bg-white/80">
				<div class={`h-full rounded-full ${seoBarClass()}`} style={`width: ${seoScore}%`}></div>
			</div>
		</div>
	</div>

	<form method="POST" use:enhance>
		<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
			<div class="space-y-5">
				<section class="space-y-4">
					<div>
						<label for="title" class="text-sm font-semibold text-slate-800">Judul artikel</label>
						<input
							type="text"
							id="title"
							name="title"
							bind:value={title}
							oninput={() => {
								if (!editingSlug) generateSlug();
							}}
							placeholder="Contoh: Panduan Belajar Kitab Kuning untuk Santri Pemula"
							class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-2xl font-semibold leading-tight text-slate-950 shadow-sm outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
							required
						/>
					</div>

					<div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
						<div class="flex flex-wrap items-center gap-2 text-sm text-slate-600">
							<span class="font-semibold text-slate-500">Permalink</span>
							{#if !editingSlug}
								<span class="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-700">
									/blog/{slug || 'judul-post'}
								</span>
								<button type="button" class="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600" onclick={() => (editingSlug = true)}>
									Sunting
								</button>
							{:else}
								<input type="text" class="input input-sm input-bordered w-full max-w-xs" bind:value={slug} />
								<button type="button" class="btn btn-xs btn-primary" onclick={() => (editingSlug = false)}>OK</button>
								<button type="button" class="btn btn-xs btn-ghost" onclick={() => { editingSlug = false; generateSlug(); }}>
									Batal
								</button>
							{/if}
						</div>
					</div>
				</section>

				<section class="space-y-2">
					<div class="flex items-center justify-between gap-3">
						<p class="text-sm font-semibold text-slate-800">Isi artikel</p>
						<span class="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">{wordCount} kata</span>
					</div>
					<div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
						<RichTextEditor bind:value={content} />
					</div>
					<input type="hidden" name="content" value={content} />
				</section>

				<section class="grid gap-4 md:grid-cols-2">
					<div>
						<label class="text-sm font-semibold text-slate-800" for="excerpt">Ringkasan</label>
						<textarea
							id="excerpt"
							name="excerpt"
							bind:value={excerpt}
							class="mt-2 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
							placeholder="Ringkasan pendek untuk daftar artikel dan preview sosial."
						></textarea>
					</div>
					<div>
						<label class="text-sm font-semibold text-slate-800" for="meta_description">Meta description</label>
						<textarea
							id="meta_description"
							name="meta_description"
							bind:value={meta_description}
							class="mt-2 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
							placeholder="Deskripsi 140-160 karakter untuk hasil pencarian."
						></textarea>
						<p class={`mt-2 text-xs font-semibold ${metaLength > 160 ? 'text-rose-600' : 'text-slate-500'}`}>
							{metaLength}/160 karakter
						</p>
					</div>
				</section>

				<input type="hidden" id="slug" name="slug" bind:value={slug} />
			</div>

			<aside class="space-y-4 lg:sticky lg:top-24 lg:self-start">
				<section class="overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 shadow-sm">
					<div class="flex items-start justify-between gap-3">
						<div>
							<div class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-600">
								<Sparkles class="h-3.5 w-3.5" />
								Asisten Konten AI
							</div>
							<h2 class="mt-3 text-base font-semibold text-slate-950">Generate lengkap</h2>
							<p class="mt-1 text-xs leading-5 text-slate-600">
								Hasil AI mengisi artikel, thumbnail, dan audio. Verifikasi ulang dalil, rujukan, dan istilah sebelum publikasi.
							</p>
						</div>
					</div>

					<div class="mt-4 space-y-3">
						<div>
							<label class="text-xs font-semibold uppercase tracking-wide text-slate-500" for="ai_topic">Topik</label>
							<input
								id="ai_topic"
								type="text"
								bind:value={aiTopic}
								class="input input-bordered mt-2 w-full bg-white"
								placeholder="Contoh: adab menuntut ilmu bagi santri"
							/>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="text-xs font-semibold uppercase tracking-wide text-slate-500" for="ai_content_type">Jenis</label>
								<select id="ai_content_type" bind:value={aiContentType} class="select select-bordered mt-2 w-full bg-white">
									<option value="Artikel edukasi">Artikel edukasi</option>
									<option value="Opini">Opini</option>
									<option value="Berita">Berita</option>
									<option value="Panduan">Panduan</option>
								</select>
							</div>
							<div>
								<label class="text-xs font-semibold uppercase tracking-wide text-slate-500" for="ai_length">Panjang</label>
								<select id="ai_length" bind:value={aiLength} class="select select-bordered mt-2 w-full bg-white">
									<option value="Pendek">Pendek</option>
									<option value="Sedang">Sedang</option>
									<option value="Panjang">Panjang</option>
								</select>
							</div>
						</div>

						<div>
							<label class="text-xs font-semibold uppercase tracking-wide text-slate-500" for="ai_audience">Target pembaca</label>
							<input
								id="ai_audience"
								type="text"
								bind:value={aiAudience}
								class="input input-bordered mt-2 w-full bg-white"
							/>
						</div>

						<div>
							<label class="text-xs font-semibold uppercase tracking-wide text-slate-500" for="ai_tone">Gaya bahasa</label>
							<input id="ai_tone" type="text" bind:value={aiTone} class="input input-bordered mt-2 w-full bg-white" />
						</div>

						<div>
							<label class="text-xs font-semibold uppercase tracking-wide text-slate-500" for="ai_reference_notes">Catatan rujukan</label>
							<textarea
								id="ai_reference_notes"
								bind:value={aiReferenceNotes}
								class="textarea textarea-bordered mt-2 min-h-24 w-full bg-white text-sm"
								placeholder="Opsional: kitab, tokoh, data, atau batasan yang wajib dipakai."
							></textarea>
						</div>

						<button type="button" class="btn btn-primary w-full gap-2" onclick={generateLengkap} disabled={aiLoading}>
							{#if aiLoading && aiAction === 'complete'}
								<LoaderCircle class="h-4 w-4 animate-spin" />
								{aiGenerateStep || 'Memproses...'}
							{:else}
								<WandSparkles class="h-4 w-4" />
								Generate Lengkap
							{/if}
						</button>

						{#if aiLoading && aiAction === 'complete'}
							<div class="space-y-2 border-t border-emerald-100 pt-3">
								<div class={`flex items-center gap-2 text-xs font-semibold ${aiGenerateStep.includes('artikel') ? 'text-emerald-600' : 'text-slate-500'}`}>
									<WandSparkles class="h-3.5 w-3.5" />
									Menulis artikel
								</div>
								<div class={`flex items-center gap-2 text-xs font-semibold ${isGeneratingThumb || aiGenerateStep.includes('thumbnail') ? 'text-emerald-600' : 'text-slate-500'}`}>
									<ImagePlus class="h-3.5 w-3.5" />
									Membuat thumbnail
								</div>
								<div class={`flex items-center gap-2 text-xs font-semibold ${isGeneratingAudio || aiGenerateStep.includes('audio') || aiGenerateStep.includes('narasi') ? 'text-emerald-600' : 'text-slate-500'}`}>
									<FileAudio2 class="h-3.5 w-3.5" />
									Membuat audio
								</div>
							</div>
						{/if}

						{#if audioIdUrl || audioArabUrl || generatedImagePrompt}
							<div class="space-y-2 border-t border-emerald-100 pt-3">
								<p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Aset AI</p>
								{#if audioIdUrl}
									<a href={audioIdUrl} target="_blank" rel="noreferrer" class="flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-600">
										<Volume2 class="h-3.5 w-3.5" />
										Narasi Indonesia
									</a>
								{/if}
								{#if audioArabUrl}
									<a href={audioArabUrl} target="_blank" rel="noreferrer" class="flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-600">
										<FileAudio2 class="h-3.5 w-3.5" />
										Audio bacaan Arab
									</a>
								{/if}
								{#if generatedImagePrompt}
									<p class="break-words text-xs leading-5 text-slate-500">{generatedImagePrompt}</p>
								{/if}
							</div>
						{/if}

						<button
							type="button"
							class="btn btn-outline w-full gap-2 border-emerald-200 bg-white text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50"
							onclick={optimizeSeoWithAi}
							disabled={aiLoading || !title.trim() || !plainContent.trim()}
						>
							{#if aiLoading && aiAction === 'seo'}
								<LoaderCircle class="h-4 w-4 animate-spin" />
								Optimasi SEO...
							{:else}
								<CheckCircle2 class="h-4 w-4" />
								Optimasi SEO 100%
							{/if}
						</button>

						{#if aiError}
							<p class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
								{aiError}
							</p>
						{/if}
						{#if aiNotice}
							<p class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600">
								{aiNotice}
							</p>
						{/if}
					</div>
				</section>

				<section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
					<h2 class="text-sm font-semibold text-slate-950">Publikasi</h2>
					<div class="mt-4 space-y-4">
						<div>
							<label class="text-xs font-semibold uppercase tracking-wide text-slate-500" for="status">Status</label>
							<select id="status" name="status" bind:value={status} class="select select-bordered mt-2 w-full">
								<option value="draft">Draft</option>
								<option value="published">Published</option>
							</select>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="text-xs font-semibold uppercase tracking-wide text-slate-500" for="schedule_date">Tanggal</label>
								<input id="schedule_date" name="schedule_date" type="date" class="input input-bordered mt-2 w-full" bind:value={schedule_date} />
							</div>
							<div>
								<label class="text-xs font-semibold uppercase tracking-wide text-slate-500" for="schedule_time">Jam</label>
								<input id="schedule_time" name="schedule_time" type="time" class="input input-bordered mt-2 w-full" bind:value={schedule_time} step="60" />
							</div>
						</div>

						<div class="flex flex-col gap-2">
							<button type="submit" class="btn btn-primary w-full gap-2">
								<Save class="h-4 w-4" />
								{publishLabel}
							</button>
							<a href="/admin/posts" class="btn btn-ghost w-full">Batal</a>
						</div>
					</div>
				</section>

				<section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
					<div class="flex items-center justify-between gap-3">
						<h2 class="text-sm font-semibold text-slate-950">Thumbnail</h2>
						<ImageIcon class="h-4 w-4 text-slate-400" />
					</div>

					<div class="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
						{#if thumbnail_url}
							<img src={thumbnail_url} alt="Thumbnail artikel" class="aspect-video w-full object-cover" />
						{:else}
							<div class="flex aspect-video items-center justify-center px-4 text-center text-sm text-slate-400">
								Belum ada thumbnail
							</div>
						{/if}
					</div>

					<div class="mt-3 grid grid-cols-2 gap-2">
						<MediaGalleryModal onSelect={(url: string) => (thumbnail_url = url)}>
							<svelte:fragment slot="trigger" let:open>
								<button type="button" class="btn btn-sm btn-outline" onclick={open}>
									<ImageIcon class="h-4 w-4" />
									Galeri
								</button>
							</svelte:fragment>
						</MediaGalleryModal>
						<button type="button" class="btn btn-sm btn-outline" onclick={() => fileInput?.click()}>
							<Upload class="h-4 w-4" />
							Upload
						</button>
					</div>

					{#if thumbnail_url}
						<div class="mt-2 grid grid-cols-2 gap-2">
							<button type="button" class="btn btn-sm btn-ghost" onclick={() => window.open(thumbnail_url, '_blank')}>
								<Eye class="h-4 w-4" />
								Buka
							</button>
							<button type="button" class="btn btn-sm btn-error btn-outline" onclick={() => (thumbnail_url = '')}>
								<Trash2 class="h-4 w-4" />
								Hapus
							</button>
						</div>
					{/if}

					<input type="file" accept="image/*" class="hidden" bind:this={fileInput} onchange={onPickFeatured} />
					<input type="hidden" name="thumbnail_url" value={thumbnail_url} />
				</section>

				<section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
					<h2 class="text-sm font-semibold text-slate-950">SEO</h2>
					<div class="mt-4">
						<label class="text-xs font-semibold uppercase tracking-wide text-slate-500" for="seo_keyword">Focus keyword</label>
						<input
							type="text"
							id="seo_keyword"
							name="seo_keyword"
							bind:value={seo_keyword}
							class="input input-bordered mt-2 w-full"
							placeholder="contoh: belajar kitab kuning"
						/>
					</div>

					<div class="mt-4 rounded-lg border px-4 py-3 {seoTone()}">
						<div class="flex items-center justify-between gap-3">
							<span class="text-sm font-semibold">Skor SEO</span>
							<span class="text-lg font-bold">{seoScore}</span>
						</div>
						<div class="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
							<div class={`h-full rounded-full ${seoBarClass()}`} style={`width: ${seoScore}%`}></div>
						</div>
					</div>

					<div class="mt-4 space-y-2">
						{#each seoChecks() as check}
							<div class="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
								{#if check.met}
									<CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
								{:else}
									<CircleAlert class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
								{/if}
								<div class="min-w-0">
									<p class="text-sm font-semibold text-slate-800">{check.label}</p>
									<p class="mt-0.5 text-xs text-slate-500">{check.help}</p>
								</div>
							</div>
						{/each}
					</div>
				</section>
			</aside>
		</div>
	</form>
</div>

<script lang="ts">
	let activeTab = $state<'tanya' | 'upload'>('tanya');

	let pertanyaan = $state('');
	let jawaban = $state('');
	let referensi = $state<{ judul_kitab: string; halaman?: string | number; jilid?: string | number }[]>([]);
	let chatLoading = $state(false);
	let chatError = $state('');

	let uploadForm = $state({ judul: '', halaman: '', jilid: '', text: '' });
	let uploadLoading = $state(false);
	let uploadMessage = $state('');
	let uploadError = $state('');
	let uploadHistory = $state<
		{ id: string; judul: string; halaman: string; jilid: string | null; createdAt: string | null }[]
	>([]);

	const switchTab = (tab: 'tanya' | 'upload') => {
		activeTab = tab;
		chatError = '';
		uploadError = '';
		uploadMessage = '';
	};

const loadHistory = async () => {
	try {
		const res = await fetch('/api/kitab/upload');
		const result = await res.json();
		if (!res.ok || !result.ok) return;
		uploadHistory = result.items ?? [];
	} catch (err) {
		console.error('Gagal memuat riwayat upload', err);
	}
};

$effect(() => {
	if (activeTab === 'upload') {
		void loadHistory();
	}
});

const handleTanya = async () => {
		chatLoading = true;
		chatError = '';
		jawaban = '';
		referensi = [];
		try {
			const res = await fetch('/api/kitab/tanya', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ pertanyaan })
			});
			const result = await res.json();
			if (!res.ok || !result.ok) {
				throw new Error(result?.error || 'Gagal mendapatkan jawaban');
			}
			jawaban = result.jawaban;
			referensi = result.referensi ?? [];
		} catch (err: any) {
			chatError = err?.message || 'Terjadi kesalahan';
		} finally {
			chatLoading = false;
		}
	};

	const handleUpload = async () => {
		uploadLoading = true;
		uploadError = '';
		uploadMessage = '';
		try {
			const res = await fetch('/api/kitab/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					text: uploadForm.text,
					judul: uploadForm.judul,
					halaman: uploadForm.halaman,
					jilid: uploadForm.jilid || undefined
				})
			});
			const result = await res.json();
			if (!res.ok || !result.ok) {
				throw new Error(result?.error || 'Gagal menyimpan dokumen');
			}
			uploadMessage = 'Berhasil menyimpan potongan kitab.';
			uploadForm = { judul: '', halaman: '', jilid: '', text: '' };
			void loadHistory();
		} catch (err: any) {
			uploadError = err?.message || 'Terjadi kesalahan';
		} finally {
			uploadLoading = false;
		}
	};
</script>

<svelte:head>
	<title>Tanya Kitab</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10 space-y-6">
	<div class="rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 shadow-xl">
		<p class="text-xs uppercase tracking-[0.25em] text-white/80">RAG • Vectorize + AI</p>
		<h1 class="text-3xl font-bold mt-2">Tanya Kitab</h1>
		<p class="text-sm text-white/90 mt-1">
			Ajukan pertanyaan seputar kitab. Jawaban dihasilkan dengan retrieval + AI dan menyertakan referensi halaman.
		</p>
	</div>

	<div class="flex gap-3">
		<button
			class={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'tanya' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
			onclick={() => switchTab('tanya')}
		>
			💬 Tanya Jawab
		</button>
		<button
			class={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'upload' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
			onclick={() => switchTab('upload')}
		>
			⬆️ Upload Data
		</button>
	</div>

	{#if activeTab === 'tanya'}
		<div class="rounded-2xl border bg-white p-6 shadow space-y-4">
			<label class="block text-sm font-semibold text-slate-700">
				<span class="mb-1 block">Pertanyaan</span>
				<textarea
					class="textarea textarea-bordered w-full min-h-[140px]"
					bind:value={pertanyaan}
					placeholder="Contoh: Bagaimana adab wudhu menurut kitab X?"
				></textarea>
			</label>
			<div class="flex items-center gap-3">
				<button class="btn btn-primary" onclick={handleTanya} disabled={chatLoading}>
					{chatLoading ? 'Meminta jawaban...' : 'Tanyakan'}
				</button>
				{#if chatError}
					<span class="text-sm text-red-600">{chatError}</span>
				{/if}
			</div>

			{#if jawaban}
				<div class="mt-4 rounded-xl border bg-slate-50 p-4 space-y-3">
					<div class="flex items-center gap-2 text-slate-800">
						<span class="text-lg">🤖</span>
						<p class="font-semibold">Jawaban</p>
					</div>
					<p class="text-slate-800 leading-relaxed whitespace-pre-wrap">{jawaban}</p>

					{#if referensi.length}
						<div class="pt-2">
							<p class="text-sm font-semibold text-slate-700">Referensi</p>
							<div class="mt-2 grid gap-2 sm:grid-cols-2">
								{#each referensi as ref}
									<div class="rounded-lg border border-emerald-100 bg-white px-3 py-2 shadow-sm">
										<p class="text-sm font-semibold text-emerald-700">{ref.judul_kitab}</p>
										<p class="text-xs text-slate-600">
											Hal: {ref.halaman || '-'} {ref.jilid ? `• Jilid ${ref.jilid}` : ''}
										</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
	<div class="rounded-2xl border bg-white p-6 shadow space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<label class="block text-sm font-semibold text-slate-700 mb-1">
					Judul Kitab
					<input
						type="text"
						class="input input-bordered w-full mt-1"
						bind:value={uploadForm.judul}
						placeholder="Misal: Fathul Qarib"
					/>
				</label>
				<div class="grid grid-cols-2 gap-3">
					<label class="block text-sm font-semibold text-slate-700 mb-1">
						Halaman
						<input
							type="text"
							class="input input-bordered w-full mt-1"
							bind:value={uploadForm.halaman}
							placeholder="cth: 12"
						/>
					</label>
					<label class="block text-sm font-semibold text-slate-700 mb-1">
						Jilid (opsional)
						<input
							type="text"
							class="input input-bordered w-full mt-1"
							bind:value={uploadForm.jilid}
							placeholder="cth: 1"
						/>
					</label>
				</div>
			</div>

			<label class="block text-sm font-semibold text-slate-700 mb-1">
				Isi Kitab
				<textarea
					class="textarea textarea-bordered w-full min-h-[200px] mt-1"
					bind:value={uploadForm.text}
					placeholder="Tempel potongan kitab di sini..."
				></textarea>
			</label>

			<div class="flex items-center gap-3">
				<button class="btn btn-primary" onclick={handleUpload} disabled={uploadLoading}>
					{uploadLoading ? 'Menyimpan...' : 'Simpan ke Index'}
				</button>
				{#if uploadMessage}
					<span class="text-sm text-emerald-600">{uploadMessage}</span>
				{/if}
				{#if uploadError}
					<span class="text-sm text-red-600">{uploadError}</span>
				{/if}
			</div>
		</div>

		<div class="rounded-2xl border bg-white p-6 shadow space-y-3">
			<div class="flex items-center justify-between">
				<p class="text-lg font-semibold text-slate-800">Riwayat Upload</p>
				<button class="btn btn-sm" onclick={loadHistory}>↻ Muat Ulang</button>
			</div>
			{#if uploadHistory.length === 0}
				<p class="text-sm text-slate-500">Belum ada data yang di-upload.</p>
			{:else}
				<div class="grid gap-3 md:grid-cols-2">
					{#each uploadHistory as item}
						<div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
							<p class="text-sm font-semibold text-slate-800">{item.judul}</p>
							<p class="text-xs text-slate-600">
								Hal: {item.halaman || '-'} {item.jilid ? `• Jilid ${item.jilid}` : ''}
							</p>
							{#if item.createdAt}
								<p class="text-[11px] text-slate-500 mt-1">
									{new Date(item.createdAt as string).toLocaleString('id-ID')}
								</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

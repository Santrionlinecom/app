<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let mediaUrl: string | null = null;

	const dispatch = createEventDispatcher<{
		uploaded: { url: string };
		clear: void;
		uploading: { isUploading: boolean };
	}>();
	let fileInput: HTMLInputElement;
	let isUploading = false;
	let errorMessage = '';

	const setUploading = (value: boolean) => {
		isUploading = value;
		dispatch('uploading', { isUploading: value });
	};

	const handleFile = async (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		errorMessage = '';
		setUploading(true);
		const formData = new FormData();
		formData.set('file', file);

		try {
			const response = await fetch('/api/sosmed/upload', { method: 'POST', body: formData });
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'Upload foto gagal.');
			dispatch('uploaded', { url: payload.url });
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Upload foto gagal.';
		} finally {
			setUploading(false);
			input.value = '';
		}
	};
</script>

<div class="space-y-3">
	<input
		bind:this={fileInput}
		type="file"
		accept="image/jpeg,image/png,image/webp"
		class="hidden"
		on:change={handleFile}
	/>

	{#if mediaUrl}
		<div class="relative overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50">
			<img src={mediaUrl} alt="Preview foto postingan" class="aspect-[4/3] w-full object-cover" />
			<button
				type="button"
				class="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow"
				on:click={() => dispatch('clear')}
			>
				Hapus
			</button>
		</div>
	{/if}

	<div class="flex items-center gap-3">
		<button
			type="button"
			class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-70"
			disabled={isUploading}
			on:click={() => fileInput?.click()}
		>
			<span>Foto</span>
			<span class="text-xs text-emerald-600">{isUploading ? 'Mengupload...' : 'JPG/PNG/WEBP'}</span>
		</button>
		<span class="text-xs text-slate-500">Maksimal 5MB</span>
	</div>

	{#if errorMessage}
		<p class="text-sm font-semibold text-rose-600">{errorMessage}</p>
	{/if}
</div>

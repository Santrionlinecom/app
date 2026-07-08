<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ReportReason } from '$lib/types/sosmed';

	export let postId: string;
	export let open = false;

	const dispatch = createEventDispatcher<{ close: void; reported: void }>();
	let reason: ReportReason = 'tidak_sopan';
	let isSubmitting = false;
	let errorMessage = '';

	const reasons: Array<{ value: ReportReason; label: string }> = [
		{ value: 'spam', label: 'Spam' },
		{ value: 'tidak_sopan', label: 'Tidak sopan' },
		{ value: 'hoaks', label: 'Hoaks' },
		{ value: 'lainnya', label: 'Lainnya' }
	];

	const submit = async () => {
		isSubmitting = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/sosmed/posts/${postId}/report`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reason })
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'Laporan gagal dikirim.');
			dispatch('reported');
			dispatch('close');
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Laporan gagal dikirim.';
		} finally {
			isSubmitting = false;
		}
	};
</script>

{#if open}
	<div class="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4">
		<div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
			<h3 class="text-lg font-bold text-slate-950">Laporkan konten</h3>
			<p class="mt-1 text-sm leading-6 text-slate-500">Laporan akan masuk ke admin lembaga untuk ditinjau manual.</p>

			<div class="mt-4 space-y-2">
				{#each reasons as item}
					<label class="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
						<input type="radio" bind:group={reason} value={item.value} class="radio radio-sm radio-success" />
						<span>{item.label}</span>
					</label>
				{/each}
			</div>

			{#if errorMessage}
				<p class="mt-3 text-sm font-semibold text-rose-600">{errorMessage}</p>
			{/if}

			<div class="mt-5 flex justify-end gap-2">
				<button type="button" class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600" on:click={() => dispatch('close')}>
					Batal
				</button>
				<button
					type="button"
					class="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
					disabled={isSubmitting}
					on:click={submit}
				>
					{isSubmitting ? 'Mengirim...' : 'Kirim laporan'}
				</button>
			</div>
		</div>
	</div>
{/if}

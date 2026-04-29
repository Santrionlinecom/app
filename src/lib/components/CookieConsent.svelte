<script lang="ts">
	import { onMount } from 'svelte';

	type ConsentValue = {
		necessary: true;
		analytics: boolean;
		updatedAt: string;
	};

	const STORAGE_KEY = 'santrionline_cookie_consent_v1';
	const CONSENT_EVENT = 'santrionline:cookie-consent';

	let visible = false;
	let showPreferences = false;
	let analyticsEnabled = false;

	const readConsent = (): ConsentValue | null => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) return null;
			const parsed = JSON.parse(stored) as Partial<ConsentValue>;
			if (parsed.necessary !== true || typeof parsed.analytics !== 'boolean') return null;
			return {
				necessary: true,
				analytics: parsed.analytics,
				updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString()
			};
		} catch {
			return null;
		}
	};

	const saveConsent = (analytics: boolean) => {
		const consent: ConsentValue = {
			necessary: true,
			analytics,
			updatedAt: new Date().toISOString()
		};

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
		} catch {
			// If storage is unavailable, keep the current page usable.
		}

		window.dispatchEvent(
			new CustomEvent<ConsentValue>(CONSENT_EVENT, {
				detail: consent
			})
		);
		analyticsEnabled = analytics;
		visible = false;
		showPreferences = false;
	};

	onMount(() => {
		const consent = readConsent();
		if (!consent) {
			visible = true;
			return;
		}

		analyticsEnabled = consent.analytics;
	});
</script>

{#if visible}
	<div class="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6">
		<div class="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-emerald-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
			<div class="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
				<div class="space-y-3">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.9">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 3l7 3v5c0 4.5-2.8 8.5-7 10-4.2-1.5-7-5.5-7-10V6l7-3z" />
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-5" />
							</svg>
						</div>
						<div>
							<p class="text-base font-semibold text-slate-950">Privasi dan Cookie</p>
							<p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">SantriOnline</p>
						</div>
					</div>

					<p class="max-w-3xl text-sm leading-6 text-slate-600">
						Kami memakai cookie penting agar website berjalan baik. Dengan izin Anda, kami juga memakai analytics ringan dan privacy-friendly untuk memahami kunjungan tanpa iklan pelacak.
					</p>

					{#if showPreferences}
						<div class="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<div class="flex items-start justify-between gap-4">
								<div>
									<p class="text-sm font-semibold text-slate-900">Necessary</p>
									<p class="mt-1 text-xs leading-5 text-slate-600">Wajib untuk keamanan, sesi, dan fungsi dasar website.</p>
								</div>
								<span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Selalu aktif</span>
							</div>

							<label class="flex cursor-pointer items-start justify-between gap-4">
								<div>
									<p class="text-sm font-semibold text-slate-900">Analytics</p>
									<p class="mt-1 text-xs leading-5 text-slate-600">Membantu kami melihat statistik kunjungan, heatmap, dan rekaman sesi untuk perbaikan pengalaman.</p>
								</div>
								<input type="checkbox" class="toggle toggle-success mt-1" bind:checked={analyticsEnabled} />
							</label>
						</div>
					{/if}
				</div>

				<div class="flex flex-col gap-2 sm:min-w-56">
					<button type="button" class="btn bg-emerald-600 text-white hover:bg-emerald-700" on:click={() => saveConsent(true)}>
						Terima Analytics
					</button>
					<button type="button" class="btn btn-outline border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50" on:click={() => saveConsent(false)}>
						Tolak Analytics
					</button>
					{#if showPreferences}
						<button type="button" class="btn btn-ghost text-slate-700" on:click={() => saveConsent(analyticsEnabled)}>
							Simpan Pilihan
						</button>
					{:else}
						<button type="button" class="btn btn-ghost text-slate-700" on:click={() => (showPreferences = true)}>
							Atur Pilihan
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

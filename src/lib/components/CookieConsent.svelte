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
	<div class="fixed inset-x-0 bottom-0 z-[100] px-3 pb-3 sm:left-auto sm:right-0 sm:w-[25rem] sm:px-4 sm:pb-4">
		<div class="mx-auto max-w-3xl overflow-hidden rounded-xl border border-so-border bg-so-surface shadow-card sm:max-w-none">
			<div class="grid gap-3 p-3 sm:p-4">
				<div class="space-y-2.5">
					<div class="flex items-center gap-2.5">
						<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-so-green text-white">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.9">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 3l7 3v5c0 4.5-2.8 8.5-7 10-4.2-1.5-7-5.5-7-10V6l7-3z" />
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-5" />
							</svg>
						</div>
						<div>
							<p class="text-sm font-semibold text-so-ink">Privasi dan Cookie</p>
							<p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-so-green-2">SantriOnline</p>
						</div>
					</div>

					<p class="max-w-2xl text-xs leading-5 text-so-muted">
						Kami memakai cookie penting agar website berjalan baik. Dengan izin Anda, kami juga memakai analytics ringan dan privacy-friendly untuk memahami kunjungan tanpa iklan pelacak.
					</p>

					{#if showPreferences}
						<div class="grid gap-2.5 rounded-xl border border-so-border bg-so-cream p-3">
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-xs font-semibold text-so-ink">Necessary</p>
									<p class="mt-1 text-[11px] leading-4 text-so-muted">Wajib untuk keamanan, sesi, dan fungsi dasar website.</p>
								</div>
								<span class="rounded-full bg-so-gold-2/40 px-2.5 py-0.5 text-[11px] font-semibold text-so-green">Selalu aktif</span>
							</div>

							<label class="flex cursor-pointer items-start justify-between gap-3">
								<div>
									<p class="text-xs font-semibold text-so-ink">Analytics</p>
									<p class="mt-1 text-[11px] leading-4 text-so-muted">Membantu kami melihat statistik kunjungan, heatmap, dan rekaman sesi untuk perbaikan pengalaman.</p>
								</div>
								<input type="checkbox" class="toggle toggle-success toggle-sm mt-1" bind:checked={analyticsEnabled} />
							</label>
						</div>
					{/if}
				</div>

				<div class="grid grid-cols-2 gap-1.5">
					<button type="button" class="btn btn-sm min-h-9 bg-so-green text-xs text-white hover:bg-so-green-3" on:click={() => saveConsent(true)}>
						Terima Analytics
					</button>
					<button type="button" class="btn btn-outline btn-sm min-h-9 border-so-border text-xs text-so-green hover:border-so-green/40 hover:bg-so-cream" on:click={() => saveConsent(false)}>
						Tolak Analytics
					</button>
					{#if showPreferences}
						<button type="button" class="btn btn-ghost btn-sm col-span-2 min-h-9 text-xs text-so-muted" on:click={() => saveConsent(analyticsEnabled)}>
							Simpan Pilihan
						</button>
					{:else}
						<button type="button" class="btn btn-ghost btn-sm col-span-2 min-h-9 text-xs text-so-muted" on:click={() => (showPreferences = true)}>
							Atur Pilihan
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

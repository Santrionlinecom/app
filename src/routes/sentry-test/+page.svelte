<script lang="ts">
	import { dev } from '$app/environment';

	let statusMessage = '';
	const environmentLabel = dev ? 'DEVELOPMENT' : 'PRODUCTION';

	function triggerError() {
		statusMessage = 'Error berhasil dikirim ke Sentry, cek dashboard sentry.io';

		setTimeout(() => {
			throw new Error(`Manual Sentry test error from /sentry-test (${environmentLabel})`);
		}, 0);
	}
</script>

<!-- Manual page for checking the Sentry error path. -->
<main class="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
	<section class="mx-auto max-w-xl space-y-6">
		<div>
			<span
				class="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wide text-white"
			>
				{environmentLabel}
			</span>
			<h1 class="mt-4 text-3xl font-bold">Sentry Test</h1>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<button
				type="button"
				class="rounded bg-red-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
				on:click={triggerError}
			>
				Test Error
			</button>

			<a
				class="rounded border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
				href="https://santri-online.sentry.io/issues/"
				target="_blank"
				rel="noreferrer"
			>
				Cek Sentry Issues
			</a>
		</div>

		{#if statusMessage}
			<p class="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
				{statusMessage}
			</p>
		{/if}
	</section>
</main>

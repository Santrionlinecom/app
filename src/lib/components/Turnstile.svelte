<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	type TurnstileTheme = 'auto' | 'light' | 'dark';
	type TurnstileSize = 'normal' | 'compact' | 'flexible';

	type TurnstileRenderOptions = {
		sitekey: string;
		theme: TurnstileTheme;
		size: TurnstileSize;
		action?: string;
		cData?: string;
		callback: (token: string) => void;
		'expired-callback': () => void;
		'error-callback': () => void;
	};

	type TurnstileApi = {
		render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
		remove?: (widgetId: string) => void;
		reset?: (widgetId: string) => void;
	};

	type TurnstileWindow = Window &
		typeof globalThis & {
			turnstile?: TurnstileApi;
			__turnstileScriptPromise?: Promise<void>;
		};

	export let siteKey = '';
	export let name = 'cf-turnstile-response';
	export let theme: TurnstileTheme = 'auto';
	export let size: TurnstileSize = 'normal';
	export let action: string | undefined = undefined;
	export let cData: string | undefined = undefined;
	export let resetAfterSubmitMs = 1000;

	let className = '';
	export { className as class };

	let container: HTMLDivElement;
	let widgetId: string | null = null;
	let token = '';
	let errorMessage = '';
	let formElement: HTMLFormElement | null = null;
	let submitHandler: (() => void) | null = null;

	const getTurnstileWindow = () => window as TurnstileWindow;

	const loadTurnstileScript = () => {
		const turnstileWindow = getTurnstileWindow();
		if (turnstileWindow.turnstile) return Promise.resolve();
		if (turnstileWindow.__turnstileScriptPromise) return turnstileWindow.__turnstileScriptPromise;

		turnstileWindow.__turnstileScriptPromise = new Promise<void>((resolve, reject) => {
			const existingScript = document.querySelector<HTMLScriptElement>(
				'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
			);

			if (existingScript) {
				existingScript.addEventListener('load', () => resolve(), { once: true });
				existingScript.addEventListener('error', () => reject(new Error('Turnstile script failed')), {
					once: true
				});
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			script.async = true;
			script.defer = true;
			script.addEventListener('load', () => resolve(), { once: true });
			script.addEventListener('error', () => reject(new Error('Turnstile script failed')), {
				once: true
			});
			document.head.appendChild(script);
		});

		return turnstileWindow.__turnstileScriptPromise;
	};

	const resetWidget = () => {
		const turnstileWindow = getTurnstileWindow();
		if (!widgetId || !turnstileWindow.turnstile?.reset) return;
		token = '';
		turnstileWindow.turnstile.reset(widgetId);
	};

	onMount(async () => {
		if (!siteKey || !container) return;

		try {
			await loadTurnstileScript();
			const turnstileWindow = getTurnstileWindow();
			if (!turnstileWindow.turnstile || widgetId) return;

			widgetId = turnstileWindow.turnstile.render(container, {
				sitekey: siteKey,
				theme,
				size,
				action,
				cData,
				callback: (value: string) => {
					token = value;
					errorMessage = '';
				},
				'expired-callback': () => {
					token = '';
				},
				'error-callback': () => {
					token = '';
					errorMessage = 'Verifikasi keamanan gagal. Silakan coba lagi.';
				}
			});

			formElement = container.closest('form');
			if (formElement) {
				submitHandler = () => {
					window.setTimeout(resetWidget, resetAfterSubmitMs);
				};
				formElement.addEventListener('submit', submitHandler);
			}
		} catch {
			errorMessage = 'Verifikasi keamanan gagal. Silakan coba lagi.';
		}
	});

	onDestroy(() => {
		if (typeof window === 'undefined') return;
		const turnstileWindow = getTurnstileWindow();
		if (formElement && submitHandler) {
			formElement.removeEventListener('submit', submitHandler);
		}
		if (widgetId && turnstileWindow.turnstile?.remove) {
			turnstileWindow.turnstile.remove(widgetId);
		}
	});
</script>

<div class={className}>
	{#if siteKey}
		<input type="hidden" {name} value={token} />
		<div class="min-h-[65px]">
			<div bind:this={container}></div>
		</div>
		{#if errorMessage}
			<p class="mt-2 text-sm text-rose-600">{errorMessage}</p>
		{/if}
	{:else}
		<div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
			Verifikasi keamanan belum dikonfigurasi.
		</div>
	{/if}
</div>

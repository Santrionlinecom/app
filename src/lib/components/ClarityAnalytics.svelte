<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { onDestroy, onMount } from 'svelte';

	type ConsentValue = {
		necessary: true;
		analytics: boolean;
		updatedAt: string;
	};

	type ClarityFunction = ((...args: unknown[]) => void) & {
		q?: unknown[][];
	};

	type ClarityWindow = Window &
		typeof globalThis & {
			clarity?: ClarityFunction;
		};

	const STORAGE_KEY = 'santrionline_cookie_consent_v1';
	const CONSENT_EVENT = 'santrionline:cookie-consent';
	const SCRIPT_ID = 'santrionline-clarity-analytics';

	const projectId = env.PUBLIC_CLARITY_PROJECT_ID?.trim() ?? '';
	const enabled = Boolean(projectId);

	let consentListener: ((event: Event) => void) | null = null;

	const hasAnalyticsConsent = () => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) return false;
			const consent = JSON.parse(stored) as Partial<ConsentValue>;
			return consent.necessary === true && consent.analytics === true;
		} catch {
			return false;
		}
	};

	const getClarityWindow = () => window as ClarityWindow;

	const removeScript = () => {
		document.getElementById(SCRIPT_ID)?.remove();
		getClarityWindow().clarity = undefined;
	};

	const ensureClarityQueue = () => {
		const clarityWindow = getClarityWindow();
		if (clarityWindow.clarity) return;

		const clarity: ClarityFunction = (...args: unknown[]) => {
			clarity.q = clarity.q ?? [];
			clarity.q.push(args);
		};
		clarityWindow.clarity = clarity;
	};

	const loadScript = () => {
		if (!enabled || !hasAnalyticsConsent()) {
			removeScript();
			return;
		}
		if (document.getElementById(SCRIPT_ID)) return;

		ensureClarityQueue();
		const script = document.createElement('script');
		script.id = SCRIPT_ID;
		script.async = true;
		script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`;

		const firstScript = document.getElementsByTagName('script')[0];
		if (firstScript?.parentNode) {
			firstScript.parentNode.insertBefore(script, firstScript);
		} else {
			document.head.appendChild(script);
		}
	};

	onMount(() => {
		if (!enabled) return;

		loadScript();
		consentListener = () => loadScript();
		window.addEventListener(CONSENT_EVENT, consentListener);
	});

	onDestroy(() => {
		if (consentListener) {
			window.removeEventListener(CONSENT_EVENT, consentListener);
		}
	});
</script>

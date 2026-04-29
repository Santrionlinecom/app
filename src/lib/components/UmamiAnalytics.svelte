<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { onDestroy, onMount } from 'svelte';

	type ConsentValue = {
		necessary: true;
		analytics: boolean;
		updatedAt: string;
	};

	const STORAGE_KEY = 'santrionline_cookie_consent_v1';
	const CONSENT_EVENT = 'santrionline:cookie-consent';
	const SCRIPT_ID = 'santrionline-umami-analytics';

	const websiteId = env.PUBLIC_UMAMI_WEBSITE_ID?.trim() ?? '';
	const scriptUrl = env.PUBLIC_UMAMI_SCRIPT_URL?.trim() ?? '';
	const enabled = Boolean(websiteId && scriptUrl);

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

	const removeScript = () => {
		document.getElementById(SCRIPT_ID)?.remove();
	};

	const loadScript = () => {
		if (!enabled || !hasAnalyticsConsent()) {
			removeScript();
			return;
		}
		if (document.getElementById(SCRIPT_ID)) return;

		const script = document.createElement('script');
		script.id = SCRIPT_ID;
		script.defer = true;
		script.src = scriptUrl;
		script.dataset.websiteId = websiteId;
		document.head.appendChild(script);
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

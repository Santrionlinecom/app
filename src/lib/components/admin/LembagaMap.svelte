<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	type LeafletMap = {
		remove: () => void;
	};

	type LeafletLayer = {
		addTo: (map: LeafletMap) => LeafletLayer;
		removeFrom: (map: LeafletMap) => void;
	};

	type LeafletRuntime = {
		map: (
			element: HTMLElement,
			options: { center: [number, number]; zoom: number; scrollWheelZoom: boolean }
		) => LeafletMap;
		tileLayer: (url: string, options: { maxZoom: number; attribution: string }) => { addTo: (map: LeafletMap) => void };
		circleMarker: (
			latlng: [number, number],
			options: {
				radius: number;
				color: string;
				weight: number;
				opacity: number;
				fillColor: string;
				fillOpacity: number;
			}
		) => { bindPopup: (html: string) => LeafletLayer };
	};

	type LembagaMapItem = {
		id: string;
		nama: string;
		tipe: string;
		kota: string | null;
		provinsi: string | null;
		latitude: number | null;
		longitude: number | null;
		status: string;
	};

	type LembagaMapResponse = {
		lembaga: LembagaMapItem[];
		stats: {
			total: number;
			aktif: number;
			pending: number;
		};
	};

	let mapElement: HTMLDivElement;
	let map: LeafletMap | null = null;
	let markerLayers: LeafletLayer[] = [];
	let loading = true;
	let errorMessage = '';

	const normalizeStatus = (status: string | null | undefined) =>
		(status ?? '').trim().replace(/[-\s]+/g, '_').toLowerCase();

	const markerColor = (status: string) => {
		const normalized = normalizeStatus(status);
		if (normalized === 'active' || normalized === 'aktif') return '#16a34a';
		if (normalized === 'pending') return '#d97706';
		return '#dc2626';
	};

	const statusLabel = (status: string) => {
		const normalized = normalizeStatus(status);
		if (normalized === 'active' || normalized === 'aktif') return 'Aktif';
		if (normalized === 'pending') return 'Pending';
		return status || 'Nonaktif';
	};

	const escapeHtml = (value: string | null | undefined) =>
		(value ?? '-')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');

	const popupHtml = (item: LembagaMapItem) => `
		<div class="min-w-[180px]">
			<p class="font-semibold text-slate-900">${escapeHtml(item.nama)}</p>
			<p class="mt-1 text-xs text-slate-500">${escapeHtml(item.tipe)}</p>
			<p class="mt-2 text-sm text-slate-700">${escapeHtml(item.kota)}</p>
			<p class="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(statusLabel(item.status))}</p>
		</div>
	`;

	const addMarkers = (L: LeafletRuntime, items: LembagaMapItem[]) => {
		if (!map) return;
		for (const layer of markerLayers) {
			layer.removeFrom(map);
		}
		markerLayers = [];

		for (const item of items) {
			const lat = Number(item.latitude);
			const lng = Number(item.longitude);
			if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

			const color = markerColor(item.status);
			const marker = L.circleMarker([lat, lng], {
				radius: 8,
				color,
				weight: 2,
				opacity: 1,
				fillColor: color,
				fillOpacity: 0.82
			}).bindPopup(popupHtml(item));
			marker.addTo(map);
			markerLayers.push(marker);
		}
	};

	onMount(async () => {
		try {
			const [leafletModule] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]);
			const L = leafletModule as unknown as LeafletRuntime;
			map = L.map(mapElement, {
				center: [-2.5, 118.0],
				zoom: 5,
				scrollWheelZoom: false
			});

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; OpenStreetMap contributors'
			}).addTo(map);

			const response = await fetch('/api/admin/lembaga-map');
			if (!response.ok) throw new Error('Gagal memuat data peta lembaga');
			const data = (await response.json()) as LembagaMapResponse;
			addMarkers(L, data.lembaga ?? []);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Gagal memuat peta lembaga';
		} finally {
			loading = false;
		}
	});

	onDestroy(() => {
		if (map) {
			map.remove();
			map = null;
		}
		markerLayers = [];
	});
</script>

{#if loading}
	<div class="h-[500px] w-full animate-pulse rounded-2xl bg-slate-100"></div>
{:else if errorMessage}
	<div class="flex h-[500px] w-full items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 px-6 text-center text-sm font-medium text-red-700">
		{errorMessage}
	</div>
{/if}

<div class:hidden={loading || errorMessage} bind:this={mapElement} class="h-[500px] w-full overflow-hidden rounded-2xl border border-slate-200"></div>

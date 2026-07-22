<script lang="ts">
	import { onMount } from 'svelte';

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

	export let lembaga: LembagaMapItem[] = [];

	let mapElement: HTMLDivElement;
	let map: import('leaflet').Map | null = null;
	let markerLayer: import('leaflet').LayerGroup | null = null;
	let leaflet: typeof import('leaflet') | null = null;
	let loading = true;
	let mapError = false;
	let markerCount = 0;

	const normalizeStatus = (status: string | null | undefined) =>
		(status ?? '').trim().replace(/[-\s]+/g, '_').toLowerCase();

	const markerColor = (status: string) => {
		const normalized = normalizeStatus(status);
		if (normalized === 'active' || normalized === 'aktif') return '#059669';
		if (normalized === 'pending') return '#d97706';
		return '#dc2626';
	};

	const statusLabel = (status: string) => {
		const normalized = normalizeStatus(status);
		if (normalized === 'active' || normalized === 'aktif') return 'Aktif';
		if (normalized === 'pending') return 'Menunggu verifikasi';
		return status?.trim() || 'Nonaktif';
	};

	const isValidCoordinate = (lat: number, lng: number) =>
		Number.isFinite(lat) &&
		Number.isFinite(lng) &&
		!(lat === 0 && lng === 0) &&
		lat >= -11.5 &&
		lat <= 6.5 &&
		lng >= 94.5 &&
		lng <= 141.5;

	const appendText = (
		parent: HTMLElement,
		tag: keyof HTMLElementTagNameMap,
		text: string,
		className: string
	) => {
		const element = document.createElement(tag);
		element.textContent = text;
		element.className = className;
		parent.appendChild(element);
		return element;
	};

	const buildPopup = (item: LembagaMapItem, lat: number, lng: number) => {
		const root = document.createElement('div');
		root.className = 'min-w-[200px] max-w-[260px] space-y-1.5';

		appendText(root, 'p', item.nama, 'font-bold text-slate-900 leading-snug');
		if (item.tipe) appendText(root, 'p', item.tipe, 'text-xs font-medium text-emerald-700');

		const locationLabel = [item.kota, item.provinsi].filter(Boolean).join(', ');
		if (locationLabel) appendText(root, 'p', locationLabel, 'text-xs text-slate-500');

		const status = appendText(root, 'p', statusLabel(item.status), 'text-xs font-semibold uppercase tracking-wide');
		const color = markerColor(item.status);
		status.style.color = color;

		const link = document.createElement('a');
		link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
		link.className = 'mt-2 inline-flex text-xs font-bold text-emerald-700 hover:underline';
		link.textContent = 'Buka di Google Maps →';
		root.appendChild(link);

		return root;
	};

	const refreshMarkers = () => {
		if (!map || !markerLayer || !leaflet) return;
		markerLayer.clearLayers();

		const coordinates: [number, number][] = [];

		for (const item of lembaga) {
			const lat = Number(item.latitude);
			const lng = Number(item.longitude);
			if (!isValidCoordinate(lat, lng)) continue;

			const coordinate: [number, number] = [lat, lng];
			coordinates.push(coordinate);

			const color = markerColor(item.status);
			const marker = leaflet.circleMarker(coordinate, {
				radius: 10,
				color: '#ffffff',
				weight: 3,
				opacity: 1,
				fillColor: color,
				fillOpacity: 0.95
			});

			const tooltip = document.createElement('span');
			tooltip.textContent = item.nama;
			marker.bindTooltip(tooltip, {
				direction: 'top',
				offset: [0, -10],
				opacity: 0.95,
				className: 'lembaga-map-tooltip'
			});
			marker.bindPopup(buildPopup(item, lat, lng), { maxWidth: 300, className: 'lembaga-map-popup' });
			markerLayer.addLayer(marker);
		}

		markerCount = coordinates.length;

		if (coordinates.length === 1) {
			map.setView(coordinates[0], 12);
		} else if (coordinates.length > 1) {
			map.fitBounds(leaflet.latLngBounds(coordinates), { padding: [48, 48], maxZoom: 12 });
		} else {
			map.setView([-2.5, 118], 5);
		}

		requestAnimationFrame(() => {
			map?.invalidateSize();
			// Second pass after layout settles (rounded containers, fonts, etc.)
			setTimeout(() => map?.invalidateSize(), 120);
		});
	};

	$: {
		lembaga;
		if (map && markerLayer && leaflet) refreshMarkers();
	}

	onMount(() => {
		let destroyed = false;

		const initialize = async () => {
			try {
				const [leafletModule] = await Promise.all([
					import('leaflet'),
					import('leaflet/dist/leaflet.css')
				]);
				if (destroyed || !mapElement) return;

				leaflet = leafletModule;
				map = leaflet
					.map(mapElement, {
						zoomControl: true,
						scrollWheelZoom: false,
						attributionControl: true
					})
					.setView([-2.5, 118], 5);

				leaflet
					.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
						attribution: '&copy; OpenStreetMap contributors',
						maxZoom: 19
					})
					.addTo(map);

				markerLayer = leaflet.layerGroup().addTo(map);
				refreshMarkers();
				loading = false;

				// Ensure tiles/markers paint after container is fully laid out
				requestAnimationFrame(() => map?.invalidateSize());
			} catch (error) {
				console.error('Lembaga map initialization failed:', error);
				if (!destroyed) {
					mapError = true;
					loading = false;
				}
			}
		};

		void initialize();

		return () => {
			destroyed = true;
			markerLayer = null;
			map?.remove();
			map = null;
			leaflet = null;
		};
	});
</script>

<div
	class="relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-inner"
	style="height: min(70vh, 560px); min-height: 420px;"
>
	<div
		bind:this={mapElement}
		class="h-full w-full"
		role="img"
		aria-label="Peta sebaran lembaga berdasarkan koordinat"
	></div>

	{#if loading}
		<div class="absolute inset-0 z-[500] grid place-items-center bg-white/90 backdrop-blur-[1px]">
			<div class="text-center">
				<div
					class="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"
				></div>
				<p class="mt-3 text-sm font-semibold text-slate-600">Memuat peta lembaga…</p>
			</div>
		</div>
	{:else if mapError}
		<div class="absolute inset-0 z-[500] grid place-items-center bg-rose-50 p-6 text-center">
			<div>
				<p class="text-sm font-bold text-rose-800">Peta belum dapat dimuat</p>
				<p class="mt-1 text-xs leading-5 text-rose-700">
					Silakan muat ulang halaman beberapa saat lagi.
				</p>
			</div>
		</div>
	{:else if markerCount === 0}
		<div
			class="absolute inset-x-4 bottom-4 z-[500] rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:left-4 sm:right-auto sm:max-w-sm"
		>
			<p class="text-sm font-bold text-slate-900">Belum ada titik lembaga</p>
			<p class="mt-1 text-xs leading-5 text-slate-600">
				Titik hanya muncul untuk lembaga dengan koordinat valid. Lengkapi data di daftar di bawah.
			</p>
		</div>
	{/if}

	{#if !loading && !mapError}
		<div
			class="pointer-events-none absolute left-3 top-3 z-[500] rounded-xl border border-white/70 bg-white/95 px-3 py-2 shadow-md backdrop-blur"
		>
			<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Titik tampil</p>
			<p class="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{markerCount}</p>
		</div>

		<div
			class="pointer-events-none absolute bottom-3 right-3 z-[500] rounded-xl border border-white/70 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur"
		>
			<p class="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Status</p>
			<ul class="space-y-1.5 text-xs font-medium text-slate-700">
				<li class="flex items-center gap-2">
					<span class="inline-block h-3 w-3 rounded-full border-2 border-white bg-emerald-600 shadow"></span>
					Aktif
				</li>
				<li class="flex items-center gap-2">
					<span class="inline-block h-3 w-3 rounded-full border-2 border-white bg-amber-600 shadow"></span>
					Pending
				</li>
				<li class="flex items-center gap-2">
					<span class="inline-block h-3 w-3 rounded-full border-2 border-white bg-red-600 shadow"></span>
					Lainnya
				</li>
			</ul>
		</div>
	{/if}
</div>

<style>
	:global(.lembaga-map-tooltip) {
		border: none !important;
		border-radius: 0.5rem !important;
		box-shadow: 0 8px 20px rgba(15, 23, 42, 0.14) !important;
		font-weight: 600 !important;
		padding: 0.35rem 0.55rem !important;
	}

	:global(.lembaga-map-popup .leaflet-popup-content-wrapper) {
		border-radius: 0.9rem;
		box-shadow: 0 12px 28px rgba(15, 23, 42, 0.16);
		padding: 0.15rem 0.1rem;
	}

	:global(.lembaga-map-popup .leaflet-popup-content) {
		margin: 0.75rem 0.9rem;
	}
</style>

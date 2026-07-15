<script lang="ts">
	import { onMount } from 'svelte';

	type ProgressLocation = {
		orgId: string;
		orgName: string;
		orgType: string;
		city: string | null;
		province: string | null;
		latitude: number;
		longitude: number;
		studentCount: number;
		approvedAyah: number;
		averagePercentage: number;
	};

	export let locations: ProgressLocation[] = [];
	export let settingsHref: string | null = null;
	export let loadError = false;

	let mapElement: HTMLDivElement;
	let map: import('leaflet').Map | null = null;
	let markerLayer: import('leaflet').LayerGroup | null = null;
	let leaflet: typeof import('leaflet') | null = null;
	let loading = true;
	let mapError = false;

	const progressColor = (percentage: number) => {
		if (percentage >= 75) return '#16a34a';
		if (percentage >= 40) return '#d97706';
		return '#2563eb';
	};

	const appendText = (parent: HTMLElement, tag: keyof HTMLElementTagNameMap, text: string, className: string) => {
		const element = document.createElement(tag);
		element.textContent = text;
		element.className = className;
		parent.appendChild(element);
		return element;
	};

	const buildPopup = (point: ProgressLocation) => {
		const root = document.createElement('div');
		root.className = 'min-w-[200px] space-y-1.5';
		appendText(root, 'p', point.orgName, 'font-bold text-slate-900');

		const locationLabel = [point.city, point.province].filter(Boolean).join(', ');
		if (locationLabel) appendText(root, 'p', locationLabel, 'text-xs text-slate-500');
		appendText(root, 'p', `${point.studentCount} santri terdaftar`, 'text-xs font-semibold text-slate-700');
		appendText(root, 'p', `Rata-rata progress ${point.averagePercentage}%`, 'text-xs text-slate-600');
		appendText(root, 'p', `${point.approvedAyah.toLocaleString('id-ID')} ayat disetujui`, 'text-xs text-slate-500');

		const link = document.createElement('a');
		link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${point.latitude},${point.longitude}`)}`;
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

		const validLocations = locations.filter(
			(point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
		);
		const coordinates: [number, number][] = [];

		for (const point of validLocations) {
			const coordinate: [number, number] = [point.latitude, point.longitude];
			coordinates.push(coordinate);
			const marker = leaflet.circleMarker(coordinate, {
				radius: Math.min(18, 8 + Math.log2(Math.max(1, point.studentCount)) * 2),
				color: '#ffffff',
				weight: 3,
				fillColor: progressColor(point.averagePercentage),
				fillOpacity: 0.92
			});
			const tooltip = document.createElement('span');
			tooltip.textContent = point.orgName;
			marker.bindTooltip(tooltip, { direction: 'top', offset: [0, -8] });
			marker.bindPopup(buildPopup(point), { maxWidth: 280 });
			markerLayer.addLayer(marker);
		}

		if (coordinates.length === 1) {
			map.setView(coordinates[0], 14);
		} else if (coordinates.length > 1) {
			map.fitBounds(leaflet.latLngBounds(coordinates), { padding: [36, 36], maxZoom: 14 });
		} else {
			map.setView([-2.5, 118], 5);
		}
		requestAnimationFrame(() => map?.invalidateSize());
	};

	$: {
		locations;
		if (map && markerLayer && leaflet) refreshMarkers();
	}

	onMount(() => {
		let destroyed = false;

		const initialize = async () => {
			try {
				const [leafletModule] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]);
				if (destroyed) return;

				leaflet = leafletModule;
				map = leaflet.map(mapElement, { zoomControl: true, scrollWheelZoom: false }).setView([-2.5, 118], 5);
				leaflet
					.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
						attribution: '&copy; OpenStreetMap contributors',
						maxZoom: 19
					})
					.addTo(map);
				markerLayer = leaflet.layerGroup().addTo(map);
				refreshMarkers();
				loading = false;
			} catch (error) {
				console.error('Student progress map initialization failed:', error);
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

<div class="relative mt-6 h-72 min-w-0 overflow-hidden rounded-2xl border border-so-border bg-so-cream shadow-inner sm:h-80">
	<div bind:this={mapElement} class="h-full w-full" aria-label="Peta sebaran progress santri berdasarkan lokasi lembaga"></div>

	{#if loading}
		<div class="absolute inset-0 grid place-items-center bg-white/90">
			<div class="text-center">
				<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-so-green border-t-transparent"></div>
				<p class="mt-3 text-sm font-semibold text-so-muted">Memuat peta lembaga…</p>
			</div>
		</div>
	{:else if loadError || mapError}
		<div class="absolute inset-0 grid place-items-center bg-rose-50 p-6 text-center">
			<div>
				<p class="text-sm font-bold text-rose-800">Peta belum dapat dimuat</p>
				<p class="mt-1 text-xs leading-5 text-rose-700">Silakan muat ulang halaman beberapa saat lagi.</p>
			</div>
		</div>
	{:else if locations.length === 0}
		<div class="absolute inset-x-4 bottom-4 rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:left-auto sm:max-w-sm">
			<p class="text-sm font-bold text-slate-900">Lokasi lembaga belum ditentukan</p>
			<p class="mt-1 text-xs leading-5 text-slate-600">Lengkapi titik koordinat lembaga agar sebaran progress dapat tampil presisi.</p>
			{#if settingsHref}
				<a class="mt-3 inline-flex text-xs font-bold text-so-green hover:underline" href={settingsHref}>Lengkapi lokasi lembaga →</a>
			{:else}
				<p class="mt-3 text-xs font-semibold text-so-muted">Hubungi admin lembaga untuk melengkapi titik lokasi.</p>
			{/if}
		</div>
	{/if}
</div>

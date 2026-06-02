<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

	export let latitude: number | null = null;
	export let longitude: number | null = null;
	export let kota = '';
	export let provinsi = '';

	type LeafletMap = {
		on: (event: 'click', handler: (event: { latlng: { lat: number; lng: number } }) => void) => void;
		remove: () => void;
		setView: (latlng: [number, number], zoom: number) => void;
		invalidateSize: () => void;
	};

	type LeafletLayer = {
		addTo: (map: LeafletMap) => LeafletLayer;
		removeFrom: (map: LeafletMap) => void;
		setLatLng: (latlng: [number, number]) => void;
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
				fillColor: string;
				fillOpacity: number;
			}
		) => LeafletLayer;
	};

	type GeocodeResponse = {
		results?: Array<{
			display_name: string;
			lat: string;
			lon: string;
		}>;
	};

	const dispatch = createEventDispatcher<{
		change: { latitude: number | null; longitude: number | null };
	}>();

	let mapElement: HTMLDivElement;
	let L: LeafletRuntime | null = null;
	let map: LeafletMap | null = null;
	let marker: LeafletLayer | null = null;
	let latitudeValue = latitude == null ? '' : `${latitude}`;
	let longitudeValue = longitude == null ? '' : `${longitude}`;
	let loading = false;
	let errorMessage = '';

	const parseCoordinate = (value: string) => {
		const trimmed = value.trim();
		if (!trimmed) return null;
		const parsed = Number.parseFloat(trimmed);
		return Number.isFinite(parsed) ? parsed : null;
	};

	$: currentLatitude = parseCoordinate(latitudeValue);
	$: currentLongitude = parseCoordinate(longitudeValue);
	$: hasCoordinates = currentLatitude !== null && currentLongitude !== null;

	const emitChange = (lat = parseCoordinate(latitudeValue), lng = parseCoordinate(longitudeValue)) => {
		dispatch('change', {
			latitude: lat,
			longitude: lng
		});
	};

	const updateMap = (lat = parseCoordinate(latitudeValue), lng = parseCoordinate(longitudeValue)) => {
		if (!L || !map || lat === null || lng === null) return;
		const latlng: [number, number] = [lat, lng];
		map.setView(latlng, 13);
		if (marker) {
			marker.setLatLng(latlng);
		} else {
			marker = L.circleMarker(latlng, {
				radius: 8,
				color: '#16a34a',
				weight: 2,
				fillColor: '#16a34a',
				fillOpacity: 0.85
			}).addTo(map);
		}
		setTimeout(() => map?.invalidateSize(), 0);
	};

	const setCoordinates = (lat: number | null, lng: number | null) => {
		latitudeValue = lat == null ? '' : lat.toFixed(6);
		longitudeValue = lng == null ? '' : lng.toFixed(6);
		emitChange(lat, lng);
		updateMap(lat, lng);
	};

	const handleManualInput = () => {
		errorMessage = '';
		const lat = parseCoordinate(latitudeValue);
		const lng = parseCoordinate(longitudeValue);
		emitChange(lat, lng);
		updateMap(lat, lng);
	};

	const detectCoordinates = async () => {
		const query = [kota, provinsi].map((item) => item.trim()).filter(Boolean).join(', ');
		if (!query) {
			errorMessage = 'Isi kota dan provinsi terlebih dahulu.';
			return;
		}

		loading = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
			const data = (await response.json().catch(() => ({}))) as GeocodeResponse;
			const first = data.results?.[0];
			const lat = first ? Number.parseFloat(first.lat) : NaN;
			const lng = first ? Number.parseFloat(first.lon) : NaN;
			if (!first || !Number.isFinite(lat) || !Number.isFinite(lng)) {
				errorMessage = 'Koordinat tidak ditemukan. Coba lengkapi alamat/kota.';
				return;
			}
			setCoordinates(lat, lng);
		} catch {
			errorMessage = 'Gagal mendeteksi koordinat.';
		} finally {
			loading = false;
		}
	};

	onMount(async () => {
		const [leafletModule] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]);
		L = leafletModule as unknown as LeafletRuntime;
		map = L.map(mapElement, {
			center: hasCoordinates && currentLatitude !== null && currentLongitude !== null ? [currentLatitude, currentLongitude] : [-2.5, 118.0],
			zoom: hasCoordinates ? 13 : 5,
			scrollWheelZoom: false
		});
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; OpenStreetMap contributors'
		}).addTo(map);
		map.on('click', (event) => {
			setCoordinates(event.latlng.lat, event.latlng.lng);
		});
		updateMap();
	});

	onDestroy(() => {
		if (map) {
			map.remove();
			map = null;
		}
		marker = null;
	});
</script>

<div class="space-y-3">
	<div class="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
		<label class="form-control">
			<span class="label-text text-xs font-semibold text-slate-600">Latitude</span>
			<input
				class="input input-bordered"
				name="latitude"
				type="number"
				step="0.000001"
				bind:value={latitudeValue}
				on:input={handleManualInput}
				placeholder="-7.979700"
			/>
		</label>
		<label class="form-control">
			<span class="label-text text-xs font-semibold text-slate-600">Longitude</span>
			<input
				class="input input-bordered"
				name="longitude"
				type="number"
				step="0.000001"
				bind:value={longitudeValue}
				on:input={handleManualInput}
				placeholder="112.630400"
			/>
		</label>
		<div class="flex items-end">
			<button class="btn btn-primary w-full" type="button" on:click={detectCoordinates} disabled={loading}>
				{loading ? 'Mendeteksi...' : 'Deteksi Otomatis'}
			</button>
		</div>
	</div>

	{#if errorMessage}
		<div class="alert alert-error py-2 text-sm">
			<span>{errorMessage}</span>
		</div>
	{/if}

	<div class:hidden={!hasCoordinates} bind:this={mapElement} class="h-[200px] w-full overflow-hidden rounded-xl border border-slate-200"></div>
</div>

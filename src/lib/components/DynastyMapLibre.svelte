<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import type { Map as MapLibreMap } from 'maplibre-gl';
	import { dynastyGeoJSON } from '$lib/data/dynastyGeoJSON';

	export let activeDynastyKey: string | null = null;
	export let onSelectDynasty: (key: string) => void = () => {};

	let mapContainer: HTMLDivElement;
	let map: MapLibreMap | undefined;

	const updateDynastyPaint = () => {
		if (!map || !map.isStyleLoaded()) return;

		dynastyGeoJSON.forEach(({ dynastyKey }) => {
			if (!map?.getLayer(`fill-${dynastyKey}`) || !map.getLayer(`border-${dynastyKey}`)) return;

			const isActive = activeDynastyKey === dynastyKey;

			map.setPaintProperty(`fill-${dynastyKey}`, 'fill-opacity', isActive ? 0.55 : 0.15);
			map.setPaintProperty(`border-${dynastyKey}`, 'line-width', isActive ? 2.5 : 1);
			map.setPaintProperty(`border-${dynastyKey}`, 'line-opacity', isActive ? 0.95 : 0.65);
		});
	};

	onMount(() => {
		if (!browser) return;

		let disposed = false;

		const initMap = async () => {
			const maplibregl = await import('maplibre-gl');
			if (disposed) return;

			map = new maplibregl.Map({
				container: mapContainer,
				style: {
					version: 8,
					sources: {
						'ohm-tiles': {
							type: 'raster',
							tiles: ['https://tile.openhistoricalmap.org/map/{z}/{x}/{y}.png'],
							tileSize: 256,
							attribution: '© OpenHistoricalMap contributors'
						}
					},
					layers: [
						{
							id: 'ohm-layer',
							type: 'raster',
							source: 'ohm-tiles',
							minzoom: 0,
							maxzoom: 18
						}
					]
				},
				center: [42, 30],
				zoom: 3,
				minZoom: 2,
				maxZoom: 10
			});

			map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
			map.addControl(new maplibregl.ScaleControl({ maxWidth: 140, unit: 'metric' }), 'bottom-left');

			map.on('load', () => {
				if (!map) return;

				dynastyGeoJSON.forEach(({ dynastyKey, color, geojson }) => {
					if (!map || map.getSource(`dynasty-${dynastyKey}`)) return;

					map.addSource(`dynasty-${dynastyKey}`, {
						type: 'geojson',
						data: geojson
					});

					map.addLayer({
						id: `fill-${dynastyKey}`,
						type: 'fill',
						source: `dynasty-${dynastyKey}`,
						paint: {
							'fill-color': color,
							'fill-opacity': activeDynastyKey === dynastyKey ? 0.55 : 0.15
						}
					});

					map.addLayer({
						id: `border-${dynastyKey}`,
						type: 'line',
						source: `dynasty-${dynastyKey}`,
						paint: {
							'line-color': color,
							'line-width': activeDynastyKey === dynastyKey ? 2.5 : 1,
							'line-opacity': activeDynastyKey === dynastyKey ? 0.95 : 0.65
						}
					});

					map.on('click', `fill-${dynastyKey}`, () => {
						onSelectDynasty(dynastyKey);
					});

					map.on('mouseenter', `fill-${dynastyKey}`, () => {
						if (!map) return;
						map.getCanvas().style.cursor = 'pointer';
					});

					map.on('mouseleave', `fill-${dynastyKey}`, () => {
						if (!map) return;
						map.getCanvas().style.cursor = '';
					});
				});

				updateDynastyPaint();
			});
		};

		void initMap();

		return () => {
			disposed = true;
			map?.remove();
			map = undefined;
		};
	});

	$: activeDynastyKey, updateDynastyPaint();
</script>

{#if browser}
	<div bind:this={mapContainer} class="h-full w-full rounded-xl"></div>
{/if}

import type { Feature, MultiPolygon, Position } from 'geojson';
import { islamicDynasties, type DynastyRegionKey } from './dinasti';

type RegionRing = Position[];

export type DynastyGeoJsonProperties = {
	dynastyKey: string;
	name: string;
	regions: DynastyRegionKey[];
};

export type DynastyGeoJsonEntry = {
	dynastyKey: string;
	color: string;
	geojson: Feature<MultiPolygon, DynastyGeoJsonProperties>;
};

const closeRing = (points: Position[]): RegionRing => {
	const first = points[0];
	const last = points[points.length - 1];

	if (!first || !last) return points;
	if (first[0] === last[0] && first[1] === last[1]) return points;

	return [...points, first];
};

const regionPolygons: Record<DynastyRegionKey, RegionRing> = {
	andalus: closeRing([
		[-9.6, 36.0],
		[-9.0, 41.8],
		[-1.5, 43.4],
		[3.2, 41.7],
		[2.7, 36.0],
		[-3.6, 35.2]
	]),
	maghribAqsa: closeRing([
		[-13.2, 27.0],
		[-10.5, 35.7],
		[-1.0, 35.8],
		[-1.0, 29.2],
		[-6.2, 25.2]
	]),
	maghribTengah: closeRing([
		[-2.2, 27.0],
		[-0.5, 36.2],
		[9.6, 36.9],
		[10.8, 30.5],
		[4.5, 24.0]
	]),
	ifriqiyah: closeRing([
		[8.0, 30.0],
		[9.8, 37.2],
		[19.5, 33.5],
		[18.0, 24.0],
		[11.0, 22.2]
	]),
	sicilia: closeRing([
		[12.1, 36.5],
		[15.8, 36.6],
		[15.5, 38.5],
		[12.3, 38.3]
	]),
	mesir: closeRing([
		[24.0, 22.0],
		[35.1, 22.0],
		[35.0, 31.7],
		[25.0, 31.7]
	]),
	syam: closeRing([
		[34.0, 29.0],
		[39.6, 29.4],
		[39.0, 37.4],
		[34.1, 37.1]
	]),
	hijaz: closeRing([
		[36.0, 18.0],
		[43.4, 18.2],
		[43.0, 28.4],
		[36.2, 28.2]
	]),
	yaman: closeRing([
		[41.8, 12.2],
		[54.2, 12.0],
		[54.0, 18.8],
		[42.0, 18.8]
	]),
	jazirah: closeRing([
		[38.0, 35.0],
		[45.8, 35.1],
		[45.3, 39.2],
		[38.4, 39.0]
	]),
	irak: closeRing([
		[39.0, 29.0],
		[48.8, 29.2],
		[49.2, 35.8],
		[39.6, 35.6]
	]),
	anatolia: closeRing([
		[26.0, 36.0],
		[45.0, 36.0],
		[44.2, 42.3],
		[26.2, 42.0]
	]),
	balkan: closeRing([
		[19.0, 39.2],
		[30.5, 39.6],
		[30.0, 46.2],
		[19.2, 46.0]
	]),
	persia: closeRing([
		[44.0, 25.0],
		[63.8, 25.0],
		[64.2, 40.2],
		[44.2, 40.0]
	]),
	khurasan: closeRing([
		[58.0, 31.0],
		[75.2, 31.2],
		[75.0, 42.0],
		[58.2, 41.7]
	]),
	transoxiana: closeRing([
		[58.0, 38.0],
		[75.6, 38.2],
		[75.2, 46.0],
		[58.2, 45.7]
	]),
	afghanistan: closeRing([
		[60.0, 29.0],
		[75.0, 29.2],
		[74.8, 38.2],
		[60.2, 38.0]
	]),
	indiaUtara: closeRing([
		[70.0, 22.0],
		[89.0, 22.2],
		[88.6, 34.0],
		[70.2, 33.8]
	]),
	indiaTengah: closeRing([
		[72.0, 14.0],
		[86.0, 14.2],
		[86.2, 24.0],
		[72.2, 24.0]
	])
};

const palette = ['#f59e0b', '#22c55e', '#38bdf8', '#fb7185', '#a3e635', '#14b8a6', '#f97316', '#c084fc'];

const createEntry = ({
	dynastyKey,
	name,
	regions,
	color
}: {
	dynastyKey: string;
	name: string;
	regions: DynastyRegionKey[];
	color: string;
}): DynastyGeoJsonEntry => ({
	dynastyKey,
	color,
	geojson: {
		type: 'Feature',
		properties: {
			dynastyKey,
			name,
			regions
		},
		geometry: {
			type: 'MultiPolygon',
			coordinates: regions.map((region) => [regionPolygons[region]])
		}
	}
});

export const dynastyGeoJSON: DynastyGeoJsonEntry[] = [
	createEntry({
		dynastyKey: 'khulafaur-rasyidin',
		name: 'Khulafaur Rasyidin',
		regions: ['hijaz', 'yaman', 'syam', 'mesir', 'irak', 'persia', 'khurasan'],
		color: '#10b981'
	}),
	...islamicDynasties.map((dynasty) =>
		createEntry({
			dynastyKey: dynasty.slug,
			name: dynasty.name,
			regions: dynasty.mapRegions,
			color: palette[(dynasty.order - 1) % palette.length]
		})
	)
];

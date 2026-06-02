export type LembagaCoordinateSample = {
	kota: string;
	provinsi: string;
	latitude: number;
	longitude: number;
};

export const lembagaCoordinatesSample: LembagaCoordinateSample[] = [
	{ kota: 'Malang', provinsi: 'Jawa Timur', latitude: -7.9797, longitude: 112.6304 },
	{ kota: 'Jakarta', provinsi: 'DKI Jakarta', latitude: -6.2088, longitude: 106.8456 },
	{ kota: 'Surabaya', provinsi: 'Jawa Timur', latitude: -7.2575, longitude: 112.7521 },
	{ kota: 'Yogyakarta', provinsi: 'DI Yogyakarta', latitude: -7.7956, longitude: 110.3695 },
	{ kota: 'Bandung', provinsi: 'Jawa Barat', latitude: -6.9175, longitude: 107.6191 }
];

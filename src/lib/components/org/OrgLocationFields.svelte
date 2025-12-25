<script lang="ts">
	import { onMount } from 'svelte';
	import SearchableSelect from '$lib/components/SearchableSelect.svelte';

	type Region = { id: string; name: string };
	export let orgAddress = '';
	export let orgCity = '';

	const fallbackCountries = [
		'Indonesia',
		'Brunei Darussalam',
		'Cambodia',
		'Laos',
		'Malaysia',
		'Myanmar',
		'Philippines',
		'Singapore',
		'Thailand',
		'Timor-Leste',
		'Vietnam'
	];

	const REGION_SOURCES = [
		{
			key: 'ibnux',
			baseUrl: 'https://ibnux.github.io/data-indonesia',
			paths: {
				provinces: 'provinsi.json',
				regencies: (id: string) => `kabupaten/${id}.json`,
				districts: (id: string) => `kecamatan/${id}.json`,
				villages: (id: string) => `kelurahan/${id}.json`
			}
		},
		{
			key: 'emsifa',
			baseUrl: 'https://www.emsifa.com/api-wilayah-indonesia/api',
			paths: {
				provinces: 'provinces.json',
				regencies: (id: string) => `regencies/${id}.json`,
				districts: (id: string) => `districts/${id}.json`,
				villages: (id: string) => `villages/${id}.json`
			}
		}
	] as const;
	const MALAYSIA_BASE_URL = 'https://raw.githubusercontent.com/mazfreelance/malaysia-jajahan-api/main/v1';
	const COUNTRY_URL = 'https://countriesnow.space/api/v0.1/countries/positions';
	const CACHE_PREFIX = 'so_wilayah_';
	const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 hari

	let countries: string[] = [];
	let country = 'Indonesia';

	let provinces: Region[] = [];
	let regencies: Region[] = [];
	let districts: Region[] = [];
	let villages: Region[] = [];

	let malaysiaStates: Region[] = [];
	let malaysiaDistricts: Region[] = [];
	let malaysiaMukims: Region[] = [];
	let malaysiaDistrictsAll: Array<{ id: string; name: string; stateId: string }> = [];
	let malaysiaMukimsAll: Array<{ id: string; name: string; districtId: string }> = [];

	let provinceId = '';
	let regencyId = '';
	let districtId = '';
	let villageId = '';
	let addressDetail = '';

	let malaysiaStateId = '';
	let malaysiaDistrictId = '';
	let malaysiaMukimId = '';
	let malaysiaAddressDetail = '';

	let globalProvince = '';
	let globalCity = '';
	let globalDistrict = '';
	let globalVillage = '';
	let globalAddressDetail = '';

	let loadingCountries = false;
	let loadingProvinces = false;
	let loadingRegencies = false;
	let loadingDistricts = false;
	let loadingVillages = false;
	let loadingMalaysiaStates = false;
	let loadingMalaysiaDistricts = false;
	let loadingMalaysiaMukims = false;
	let loadError = '';

	$: countryOptions = (countries.length ? countries : fallbackCountries).map((name) => ({ value: name, label: name }));
	$: provinceOptions = provinces.map((item) => ({ value: item.id, label: item.name }));
	$: regencyOptions = regencies.map((item) => ({ value: item.id, label: item.name }));
	$: districtOptions = districts.map((item) => ({ value: item.id, label: item.name }));
	$: villageOptions = villages.map((item) => ({ value: item.id, label: item.name }));
	$: malaysiaStateOptions = malaysiaStates.map((item) => ({ value: item.id, label: item.name }));
	$: malaysiaDistrictOptions = malaysiaDistricts.map((item) => ({ value: item.id, label: item.name }));
	$: malaysiaMukimOptions = malaysiaMukims.map((item) => ({ value: item.id, label: item.name }));

	const getCache = (key: string) => {
		if (typeof window === 'undefined') return null;
		try {
			const raw = localStorage.getItem(key);
			if (!raw) return null;
			const parsed = JSON.parse(raw) as { t: number; data: unknown };
			if (!parsed?.t || Date.now() - parsed.t > CACHE_TTL) return null;
			return parsed.data;
		} catch {
			return null;
		}
	};

	const setCache = (key: string, data: unknown) => {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(key, JSON.stringify({ t: Date.now(), data }));
		} catch {
			// ignore storage failures
		}
	};

	const normalizeRegions = (rows: any[]) =>
		rows
			.map((row) => ({
				id: `${row?.id ?? ''}`.trim(),
				name: `${row?.name ?? row?.nama ?? ''}`.trim()
			}))
			.filter((row) => row.id && row.name);

	const mergeRegions = (lists: Region[][]) => {
		const seen = new Map<string, Region>();
		for (const list of lists) {
			for (const item of list) {
				if (!item?.id || !item?.name) continue;
				if (!seen.has(item.id)) {
					seen.set(item.id, item);
				}
			}
		}
		return Array.from(seen.values());
	};

	const fetchRegions = async (candidates: { key: string; url: string }[]) => {
		for (const candidate of candidates) {
			const cacheKey = `${CACHE_PREFIX}${candidate.key}`;
			const cached = getCache(cacheKey);
			if (cached) return cached as Region[];
		}

		for (const candidate of candidates) {
			try {
				const res = await fetch(candidate.url);
				if (!res.ok) continue;
				const data = await res.json();
				const rows = Array.isArray(data) ? data : [];
				const normalized = normalizeRegions(rows);
				if (!normalized.length) continue;
				setCache(`${CACHE_PREFIX}${candidate.key}`, normalized);
				return normalized as Region[];
			} catch {
				// fallback to next source
			}
		}

		throw new Error('Gagal memuat data wilayah');
	};

	const fetchRegionsMerged = async (candidates: { key: string; url: string }[]) => {
		const mergedKey = `${CACHE_PREFIX}merged:${candidates.map((c) => c.key).join('|')}`;
		const cachedMerged = getCache(mergedKey);
		if (cachedMerged) return cachedMerged as Region[];

		const results = await Promise.all(
			candidates.map(async (candidate) => {
				const cacheKey = `${CACHE_PREFIX}${candidate.key}`;
				const cached = getCache(cacheKey);
				if (cached) return cached as Region[];
				try {
					const res = await fetch(candidate.url);
					if (!res.ok) return [];
					const data = await res.json();
					const rows = Array.isArray(data) ? data : [];
					const normalized = normalizeRegions(rows);
					if (normalized.length) setCache(cacheKey, normalized);
					return normalized;
				} catch {
					return [];
				}
			})
		);

		const merged = mergeRegions(results);
		if (!merged.length) throw new Error('Gagal memuat data wilayah');
		setCache(mergedKey, merged);
		return merged;
	};

	const fetchMalaysiaData = async (cacheKey: string, path: string) => {
		const cached = getCache(`${CACHE_PREFIX}${cacheKey}`);
		if (cached) return cached as any[];
		const res = await fetch(`${MALAYSIA_BASE_URL}/${path}`);
		if (!res.ok) throw new Error('Gagal memuat data wilayah Malaysia');
		const data = (await res.json()) as any[];
		setCache(`${CACHE_PREFIX}${cacheKey}`, data);
		return data;
	};

	const normalizeMalaysiaStates = (rows: any[]) =>
		rows
			.map((row) => ({
				id: `${row?.id ?? ''}`.trim(),
				name: `${row?.name_long ?? row?.name ?? ''}`.trim()
			}))
			.filter((row) => row.id && row.name);

	const normalizeMalaysiaDistricts = (rows: any[]) =>
		rows
			.map((row) => ({
				id: `${row?.id ?? ''}`.trim(),
				name: `${row?.name ?? ''}`.trim(),
				stateId: `${row?.state_id ?? ''}`.trim()
			}))
			.filter((row) => row.id && row.name && row.stateId);

	const normalizeMalaysiaMukims = (rows: any[]) =>
		rows
			.map((row) => ({
				id: `${row?.id ?? ''}`.trim(),
				name: `${row?.name ?? ''}`.trim(),
				districtId: `${row?.district_id ?? ''}`.trim()
			}))
			.filter((row) => row.id && row.name && row.districtId);

	const getRegionCandidates = (type: 'provinces' | 'regencies' | 'districts' | 'villages', id?: string) =>
		REGION_SOURCES.map((source) => {
			const path = typeof source.paths[type] === 'function' ? source.paths[type](id || '') : source.paths[type];
			return {
				key: `${source.key}:${type}:${id || 'all'}`,
				url: `${source.baseUrl}/${path}`
			};
		});

	const loadCountries = async () => {
		if (loadingCountries) return;
		loadingCountries = true;
		loadError = '';
		try {
			const res = await fetch(COUNTRY_URL);
			if (!res.ok) throw new Error('Gagal memuat negara');
			const data = await res.json();
			const rows = Array.isArray(data?.data) ? data.data : [];
			const list = rows
				.map((item: { name?: string }) => `${item.name ?? ''}`.trim())
				.filter(Boolean)
				.sort((a: string, b: string) => a.localeCompare(b));
			countries = list.includes('Indonesia') ? list : ['Indonesia', ...list];
		} catch (err) {
			console.error(err);
			loadError = 'Gagal memuat daftar negara.';
			countries = fallbackCountries;
		} finally {
			loadingCountries = false;
		}
	};

	const loadMalaysiaStates = async () => {
		if (loadingMalaysiaStates || malaysiaStates.length) return;
		loadingMalaysiaStates = true;
		loadError = '';
		try {
			const rows = await fetchMalaysiaData('malaysia:states', 'states.json');
			malaysiaStates = normalizeMalaysiaStates(rows as any[]);
		} catch (err) {
			console.error(err);
			loadError = 'Gagal memuat daftar negeri Malaysia.';
		} finally {
			loadingMalaysiaStates = false;
		}
	};

	const loadMalaysiaDistricts = async () => {
		if (loadingMalaysiaDistricts || malaysiaDistrictsAll.length) return;
		loadingMalaysiaDistricts = true;
		loadError = '';
		try {
			const rows = await fetchMalaysiaData('malaysia:districts', 'states/district.json');
			malaysiaDistrictsAll = normalizeMalaysiaDistricts(rows as any[]);
		} catch (err) {
			console.error(err);
			loadError = 'Gagal memuat daftar daerah Malaysia.';
		} finally {
			loadingMalaysiaDistricts = false;
		}
	};

	const loadMalaysiaMukims = async () => {
		if (loadingMalaysiaMukims || malaysiaMukimsAll.length) return;
		loadingMalaysiaMukims = true;
		loadError = '';
		try {
			const rows = await fetchMalaysiaData('malaysia:mukim', 'states/mukim.json');
			malaysiaMukimsAll = normalizeMalaysiaMukims(rows as any[]);
		} catch (err) {
			console.error(err);
			loadError = 'Gagal memuat daftar mukim Malaysia.';
		} finally {
			loadingMalaysiaMukims = false;
		}
	};

	const loadProvinces = async () => {
		if (loadingProvinces) return;
		loadingProvinces = true;
		loadError = '';
		try {
			provinces = await fetchRegions(getRegionCandidates('provinces'));
		} catch (err) {
			console.error(err);
			loadError = 'Gagal memuat daftar provinsi.';
		} finally {
			loadingProvinces = false;
		}
	};

	const loadRegencies = async (id: string) => {
		if (!id || loadingRegencies) return;
		loadingRegencies = true;
		loadError = '';
		try {
			regencies = await fetchRegions(getRegionCandidates('regencies', id));
		} catch (err) {
			console.error(err);
			loadError = 'Gagal memuat daftar kabupaten/kota.';
		} finally {
			loadingRegencies = false;
		}
	};

	const loadDistricts = async (id: string) => {
		if (!id || loadingDistricts) return;
		loadingDistricts = true;
		loadError = '';
		try {
			districts = await fetchRegions(getRegionCandidates('districts', id));
		} catch (err) {
			console.error(err);
			loadError = 'Gagal memuat daftar kecamatan.';
		} finally {
			loadingDistricts = false;
		}
	};

	const loadVillages = async (id: string) => {
		if (!id || loadingVillages) return;
		loadingVillages = true;
		loadError = '';
		try {
			villages = await fetchRegionsMerged(getRegionCandidates('villages', id));
		} catch (err) {
			console.error(err);
			loadError = 'Gagal memuat daftar kelurahan/desa.';
		} finally {
			loadingVillages = false;
		}
	};

	const resetIndonesia = () => {
		provinces = [];
		regencies = [];
		districts = [];
		villages = [];
		provinceId = '';
		regencyId = '';
		districtId = '';
		villageId = '';
		addressDetail = '';
	};

	const resetMalaysia = () => {
		malaysiaStateId = '';
		malaysiaDistrictId = '';
		malaysiaMukimId = '';
		malaysiaAddressDetail = '';
	};

	const resetGlobal = () => {
		globalProvince = '';
		globalCity = '';
		globalDistrict = '';
		globalVillage = '';
		globalAddressDetail = '';
	};

	const handleCountryChange = async () => {
		loadError = '';
		if (country === 'Indonesia') {
			resetGlobal();
			resetMalaysia();
			await loadProvinces();
			return;
		}
		if (country === 'Malaysia') {
			resetGlobal();
			resetIndonesia();
			await loadMalaysiaStates();
			return;
		}
		resetIndonesia();
		resetMalaysia();
	};

	onMount(() => {
		loadCountries();
		loadProvinces();
	});

	$: selectedProvince = provinces.find((p) => p.id === provinceId);
	$: selectedRegency = regencies.find((r) => r.id === regencyId);
	$: selectedDistrict = districts.find((d) => d.id === districtId);
	$: selectedVillage = villages.find((v) => v.id === villageId);
	$: malaysiaDistricts = malaysiaDistrictsAll
		.filter((d) => d.stateId === malaysiaStateId)
		.map((d) => ({ id: d.id, name: d.name }));
	$: malaysiaMukims = malaysiaMukimsAll
		.filter((m) => m.districtId === malaysiaDistrictId)
		.map((m) => ({ id: m.id, name: m.name }));
	$: selectedMalaysiaState = malaysiaStates.find((s) => s.id === malaysiaStateId);
	$: selectedMalaysiaDistrict = malaysiaDistrictsAll.find((d) => d.id === malaysiaDistrictId);
	$: selectedMalaysiaMukim = malaysiaMukimsAll.find((m) => m.id === malaysiaMukimId);

	$: if (country === 'Indonesia') {
		const addressParts = [] as string[];
		if (addressDetail.trim()) addressParts.push(addressDetail.trim());
		if (selectedVillage?.name) addressParts.push(selectedVillage.name);
		if (selectedDistrict?.name) addressParts.push(selectedDistrict.name);
		orgAddress = addressParts.join(', ');

		const cityParts = [] as string[];
		if (selectedRegency?.name) cityParts.push(selectedRegency.name);
		if (selectedProvince?.name) cityParts.push(selectedProvince.name);
		orgCity = cityParts.join(', ');
	} else if (country === 'Malaysia') {
		const addressParts = [] as string[];
		if (malaysiaAddressDetail.trim()) addressParts.push(malaysiaAddressDetail.trim());
		if (selectedMalaysiaMukim?.name) addressParts.push(selectedMalaysiaMukim.name);
		orgAddress = addressParts.join(', ');

		const cityParts = [] as string[];
		if (selectedMalaysiaDistrict?.name) cityParts.push(selectedMalaysiaDistrict.name);
		if (selectedMalaysiaState?.name) cityParts.push(selectedMalaysiaState.name);
		orgCity = cityParts.join(', ');
	} else {
		const addressParts = [] as string[];
		if (globalAddressDetail.trim()) addressParts.push(globalAddressDetail.trim());
		if (globalVillage.trim()) addressParts.push(globalVillage.trim());
		if (globalDistrict.trim()) addressParts.push(globalDistrict.trim());
		orgAddress = addressParts.join(', ');

		const cityParts = [] as string[];
		if (globalCity.trim()) cityParts.push(globalCity.trim());
		if (globalProvince.trim()) cityParts.push(globalProvince.trim());
		if (country.trim()) cityParts.push(country.trim());
		orgCity = cityParts.join(', ');
	}
</script>

<div class="space-y-4">
	<div class="grid gap-4 md:grid-cols-2">
		<div class="form-control">
			<label class="label" for="orgCountry">
				<span class="label-text font-medium">Negara</span>
			</label>
			<SearchableSelect
				id="orgCountry"
				options={countryOptions}
				bind:value={country}
				disabled={!countryOptions.length}
				placeholder={countryOptions.length ? 'Pilih negara' : 'Memuat negara...'}
				searchPlaceholder="Cari negara..."
				on:change={handleCountryChange}
			/>
		</div>

		{#if country === 'Indonesia'}
			<div class="form-control">
				<label class="label" for="orgProvince">
					<span class="label-text font-medium">Provinsi (Indonesia)</span>
				</label>
				<SearchableSelect
					id="orgProvince"
					options={provinceOptions}
					bind:value={provinceId}
					disabled={loadingProvinces || !provinces.length}
					placeholder={loadingProvinces ? 'Memuat provinsi...' : 'Pilih provinsi'}
					searchPlaceholder="Cari provinsi..."
					on:change={() => {
						regencies = [];
						regencyId = '';
						districts = [];
						districtId = '';
						villages = [];
						villageId = '';
						loadRegencies(provinceId);
					}}
				/>
			</div>
		{:else if country === 'Malaysia'}
			<div class="form-control">
				<label class="label" for="orgMalaysiaState">
					<span class="label-text font-medium">Negeri (Malaysia)</span>
				</label>
				<SearchableSelect
					id="orgMalaysiaState"
					options={malaysiaStateOptions}
					bind:value={malaysiaStateId}
					disabled={loadingMalaysiaStates || !malaysiaStates.length}
					placeholder={loadingMalaysiaStates ? 'Memuat negeri...' : 'Pilih negeri'}
					searchPlaceholder="Cari negeri..."
					on:change={() => {
						malaysiaDistrictId = '';
						malaysiaMukimId = '';
						loadMalaysiaDistricts();
					}}
				/>
			</div>
		{/if}
	</div>

	{#if country === 'Indonesia'}
		<div class="grid gap-4 md:grid-cols-2">
			<div class="form-control">
				<label class="label" for="orgRegency">
					<span class="label-text font-medium">Kabupaten/Kota</span>
				</label>
				<SearchableSelect
					id="orgRegency"
					options={regencyOptions}
					bind:value={regencyId}
					disabled={!provinceId || loadingRegencies || !regencies.length}
					placeholder={loadingRegencies ? 'Memuat kabupaten/kota...' : 'Pilih kabupaten/kota'}
					searchPlaceholder="Cari kabupaten/kota..."
					on:change={() => {
						districts = [];
						districtId = '';
						villages = [];
						villageId = '';
						loadDistricts(regencyId);
					}}
				/>
			</div>

			<div class="form-control">
				<label class="label" for="orgDistrict">
					<span class="label-text font-medium">Kecamatan</span>
				</label>
				<SearchableSelect
					id="orgDistrict"
					options={districtOptions}
					bind:value={districtId}
					disabled={!regencyId || loadingDistricts || !districts.length}
					placeholder={loadingDistricts ? 'Memuat kecamatan...' : 'Pilih kecamatan'}
					searchPlaceholder="Cari kecamatan..."
					on:change={() => {
						villages = [];
						villageId = '';
						loadVillages(districtId);
					}}
				/>
			</div>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<div class="form-control">
				<label class="label" for="orgVillage">
					<span class="label-text font-medium">Kelurahan/Desa</span>
				</label>
				<SearchableSelect
					id="orgVillage"
					options={villageOptions}
					bind:value={villageId}
					disabled={!districtId || loadingVillages || !villages.length}
					placeholder={loadingVillages ? 'Memuat kelurahan/desa...' : 'Pilih kelurahan/desa'}
					searchPlaceholder="Cari kelurahan/desa..."
				/>
			</div>

			<div class="form-control">
				<label class="label" for="orgAddressDetail">
					<span class="label-text font-medium">Alamat Detail (opsional)</span>
				</label>
				<input
					id="orgAddressDetail"
					type="text"
					class="input input-bordered"
					placeholder="Jalan, RT/RW, patokan"
					bind:value={addressDetail}
				/>
			</div>
		</div>
	{:else if country === 'Malaysia'}
		<div class="grid gap-4 md:grid-cols-2">
			<div class="form-control">
				<label class="label" for="orgMalaysiaDistrict">
					<span class="label-text font-medium">Daerah</span>
				</label>
				<SearchableSelect
					id="orgMalaysiaDistrict"
					options={malaysiaDistrictOptions}
					bind:value={malaysiaDistrictId}
					disabled={!malaysiaStateId || loadingMalaysiaDistricts || !malaysiaDistricts.length}
					placeholder={loadingMalaysiaDistricts ? 'Memuat daerah...' : 'Pilih daerah'}
					searchPlaceholder="Cari daerah..."
					on:change={() => {
						malaysiaMukimId = '';
						loadMalaysiaMukims();
					}}
				/>
			</div>

			<div class="form-control">
				<label class="label" for="orgMalaysiaMukim">
					<span class="label-text font-medium">Mukim/Kelurahan</span>
				</label>
				<SearchableSelect
					id="orgMalaysiaMukim"
					options={malaysiaMukimOptions}
					bind:value={malaysiaMukimId}
					disabled={!malaysiaDistrictId || loadingMalaysiaMukims || !malaysiaMukims.length}
					placeholder={loadingMalaysiaMukims ? 'Memuat mukim...' : 'Pilih mukim'}
					searchPlaceholder="Cari mukim..."
				/>
			</div>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<div class="form-control">
				<label class="label" for="orgMalaysiaAddressDetail">
					<span class="label-text font-medium">Alamat Detail (opsional)</span>
				</label>
				<input
					id="orgMalaysiaAddressDetail"
					type="text"
					class="input input-bordered"
					placeholder="Jalan, blok, patokan"
					bind:value={malaysiaAddressDetail}
				/>
			</div>
			<div class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
				Gunakan Mukim sebagai acuan setara kelurahan.
			</div>
		</div>
	{:else}
		<div class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
			Untuk negara selain Indonesia, isi provinsi dan alamat secara manual.
		</div>
		<div class="grid gap-4 md:grid-cols-2">
			<div class="form-control">
				<label class="label" for="globalProvince">
					<span class="label-text font-medium">Provinsi/Negara Bagian</span>
				</label>
				<input id="globalProvince" class="input input-bordered" bind:value={globalProvince} />
			</div>
			<div class="form-control">
				<label class="label" for="globalCity">
					<span class="label-text font-medium">Kota</span>
				</label>
				<input id="globalCity" class="input input-bordered" bind:value={globalCity} />
			</div>
		</div>
		<div class="grid gap-4 md:grid-cols-2">
			<div class="form-control">
				<label class="label" for="globalDistrict">
					<span class="label-text font-medium">Kecamatan/District</span>
				</label>
				<input id="globalDistrict" class="input input-bordered" bind:value={globalDistrict} />
			</div>
			<div class="form-control">
				<label class="label" for="globalVillage">
					<span class="label-text font-medium">Kelurahan/Desa</span>
				</label>
				<input id="globalVillage" class="input input-bordered" bind:value={globalVillage} />
			</div>
		</div>
		<div class="form-control">
			<label class="label" for="globalAddress">
				<span class="label-text font-medium">Alamat Detail</span>
			</label>
			<input id="globalAddress" class="input input-bordered" bind:value={globalAddressDetail} />
		</div>
	{/if}

	{#if loadError}
		<div class="alert alert-warning text-sm">{loadError}</div>
	{/if}

	<input type="hidden" name="orgAddress" value={orgAddress} />
	<input type="hidden" name="orgCity" value={orgCity} />
</div>

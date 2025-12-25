<script lang="ts">
	import { onMount } from 'svelte';

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

	const BASE_URL = 'https://emsifa.github.io/api-wilayah-indonesia';
	const COUNTRY_URL = 'https://countriesnow.space/api/v0.1/countries/positions';
	const CACHE_PREFIX = 'so_wilayah_';
	const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 hari

	let countries: string[] = [];
	let country = 'Indonesia';

	let provinces: Region[] = [];
	let regencies: Region[] = [];
	let districts: Region[] = [];
	let villages: Region[] = [];

	let provinceId = '';
	let regencyId = '';
	let districtId = '';
	let villageId = '';
	let addressDetail = '';

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
	let loadError = '';

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

	const fetchRegions = async (path: string) => {
		const cacheKey = `${CACHE_PREFIX}${path}`;
		const cached = getCache(cacheKey);
		if (cached) return cached as Region[];
		const res = await fetch(`${BASE_URL}/${path}`);
		if (!res.ok) throw new Error('Gagal memuat data wilayah');
		const data = (await res.json()) as Region[];
		setCache(cacheKey, data);
		return data;
	};

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

	const loadProvinces = async () => {
		if (loadingProvinces) return;
		loadingProvinces = true;
		loadError = '';
		try {
			provinces = await fetchRegions('provinces.json');
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
			regencies = await fetchRegions(`regencies/${id}.json`);
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
			districts = await fetchRegions(`districts/${id}.json`);
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
			villages = await fetchRegions(`villages/${id}.json`);
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
			await loadProvinces();
			return;
		}
		resetIndonesia();
	};

	onMount(() => {
		loadCountries();
		loadProvinces();
	});

	$: selectedProvince = provinces.find((p) => p.id === provinceId);
	$: selectedRegency = regencies.find((r) => r.id === regencyId);
	$: selectedDistrict = districts.find((d) => d.id === districtId);
	$: selectedVillage = villages.find((v) => v.id === villageId);

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
			<select id="orgCountry" class="select select-bordered" bind:value={country} on:change={handleCountryChange}>
				{#if loadingCountries && !countries.length}
					<option value="">Memuat negara...</option>
				{/if}
				{#each countries.length ? countries : fallbackCountries as name}
					<option value={name}>{name}</option>
				{/each}
			</select>
		</div>

		{#if country === 'Indonesia'}
			<div class="form-control">
				<label class="label" for="orgProvince">
					<span class="label-text font-medium">Provinsi (Indonesia)</span>
				</label>
				<select
					id="orgProvince"
					class="select select-bordered"
					bind:value={provinceId}
					disabled={loadingProvinces || !provinces.length}
					on:change={() => {
						regencies = [];
						regencyId = '';
						districts = [];
						districtId = '';
						villages = [];
						villageId = '';
						loadRegencies(provinceId);
					}}
				>
					<option value="">{loadingProvinces ? 'Memuat provinsi...' : 'Pilih provinsi'}</option>
					{#each provinces as province}
						<option value={province.id}>{province.name}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>

	{#if country === 'Indonesia'}
		<div class="grid gap-4 md:grid-cols-2">
			<div class="form-control">
				<label class="label" for="orgRegency">
					<span class="label-text font-medium">Kabupaten/Kota</span>
				</label>
				<select
					id="orgRegency"
					class="select select-bordered"
					bind:value={regencyId}
					disabled={!provinceId || loadingRegencies || !regencies.length}
					on:change={() => {
						districts = [];
						districtId = '';
						villages = [];
						villageId = '';
						loadDistricts(regencyId);
					}}
				>
					<option value="">{loadingRegencies ? 'Memuat kabupaten/kota...' : 'Pilih kabupaten/kota'}</option>
					{#each regencies as regency}
						<option value={regency.id}>{regency.name}</option>
					{/each}
				</select>
			</div>

			<div class="form-control">
				<label class="label" for="orgDistrict">
					<span class="label-text font-medium">Kecamatan</span>
				</label>
				<select
					id="orgDistrict"
					class="select select-bordered"
					bind:value={districtId}
					disabled={!regencyId || loadingDistricts || !districts.length}
					on:change={() => {
						villages = [];
						villageId = '';
						loadVillages(districtId);
					}}
				>
					<option value="">{loadingDistricts ? 'Memuat kecamatan...' : 'Pilih kecamatan'}</option>
					{#each districts as district}
						<option value={district.id}>{district.name}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<div class="form-control">
				<label class="label" for="orgVillage">
					<span class="label-text font-medium">Kelurahan/Desa</span>
				</label>
				<select
					id="orgVillage"
					class="select select-bordered"
					bind:value={villageId}
					disabled={!districtId || loadingVillages || !villages.length}
				>
					<option value="">{loadingVillages ? 'Memuat kelurahan/desa...' : 'Pilih kelurahan/desa'}</option>
					{#each villages as village}
						<option value={village.id}>{village.name}</option>
					{/each}
				</select>
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

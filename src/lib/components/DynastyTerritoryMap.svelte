<script lang="ts">
	import type { DynastyRegionKey, IslamicDynasty } from '$lib/data/dinasti';

	export let dynasty: IslamicDynasty;

	type MapRegion = {
		key: DynastyRegionKey;
		name: string;
		shortName: string;
		path: string;
		labelX: number;
		labelY: number;
	};

	const mapRegions: MapRegion[] = [
		{
			key: 'andalus',
			name: 'Andalus / Iberia',
			shortName: 'Andalus',
			path: 'M88 126 C99 102 147 97 169 116 C168 142 145 162 112 157 C92 154 79 142 88 126Z',
			labelX: 126,
			labelY: 128
		},
		{
			key: 'maghribAqsa',
			name: 'Maghrib al-Aqsa / Maroko',
			shortName: 'Maroko',
			path: 'M80 206 C103 176 163 179 187 206 C175 236 130 248 92 230 C75 222 69 214 80 206Z',
			labelX: 129,
			labelY: 211
		},
		{
			key: 'maghribTengah',
			name: 'Maghrib Tengah',
			shortName: 'Maghrib',
			path: 'M176 203 C210 180 281 183 312 204 C299 235 237 252 182 232 C166 224 162 213 176 203Z',
			labelX: 239,
			labelY: 213
		},
		{
			key: 'ifriqiyah',
			name: 'Ifriqiyah / Afrika Utara tengah',
			shortName: 'Ifriqiyah',
			path: 'M300 195 C330 171 392 174 421 201 C409 230 360 251 312 234 C293 226 286 208 300 195Z',
			labelX: 358,
			labelY: 206
		},
		{
			key: 'sicilia',
			name: 'Sicilia',
			shortName: 'Sicilia',
			path: 'M357 163 C372 153 392 158 401 171 C388 181 366 181 353 171Z',
			labelX: 377,
			labelY: 166
		},
		{
			key: 'mesir',
			name: 'Mesir',
			shortName: 'Mesir',
			path: 'M421 218 C446 194 486 207 500 237 C489 276 454 300 424 283 C405 272 405 238 421 218Z',
			labelX: 455,
			labelY: 243
		},
		{
			key: 'syam',
			name: 'Syam / Levant',
			shortName: 'Syam',
			path: 'M468 158 C491 144 528 154 536 182 C523 207 496 220 473 205 C455 192 452 170 468 158Z',
			labelX: 496,
			labelY: 181
		},
		{
			key: 'hijaz',
			name: 'Hijaz',
			shortName: 'Hijaz',
			path: 'M502 231 C526 213 557 228 570 259 C562 301 536 323 507 306 C491 286 487 252 502 231Z',
			labelX: 531,
			labelY: 267
		},
		{
			key: 'yaman',
			name: 'Yaman',
			shortName: 'Yaman',
			path: 'M515 321 C543 308 587 315 604 340 C575 357 535 356 509 339Z',
			labelX: 557,
			labelY: 335
		},
		{
			key: 'jazirah',
			name: 'Jazirah / Irak utara',
			shortName: 'Jazirah',
			path: 'M520 121 C550 98 608 105 632 132 C609 156 554 161 520 145 C506 138 505 129 520 121Z',
			labelX: 571,
			labelY: 132
		},
		{
			key: 'irak',
			name: 'Irak',
			shortName: 'Irak',
			path: 'M590 165 C618 151 660 166 674 199 C663 232 625 248 592 230 C574 212 572 181 590 165Z',
			labelX: 624,
			labelY: 200
		},
		{
			key: 'anatolia',
			name: 'Anatolia',
			shortName: 'Anatolia',
			path: 'M466 106 C493 82 578 81 619 103 C595 126 524 136 466 122 C453 116 455 111 466 106Z',
			labelX: 538,
			labelY: 109
		},
		{
			key: 'balkan',
			name: 'Balkan',
			shortName: 'Balkan',
			path: 'M410 65 C430 37 486 40 511 67 C496 93 463 105 426 96 C408 88 399 77 410 65Z',
			labelX: 462,
			labelY: 74
		},
		{
			key: 'persia',
			name: 'Persia / Iran',
			shortName: 'Persia',
			path: 'M659 154 C705 128 782 147 805 196 C783 246 706 260 660 223 C638 200 636 171 659 154Z',
			labelX: 721,
			labelY: 196
		},
		{
			key: 'khurasan',
			name: 'Khurasan',
			shortName: 'Khurasan',
			path: 'M748 120 C787 100 848 115 872 154 C850 189 789 200 747 178 C724 160 723 135 748 120Z',
			labelX: 801,
			labelY: 151
		},
		{
			key: 'transoxiana',
			name: 'Transoxiana / Asia Tengah',
			shortName: 'Asia Tgh',
			path: 'M716 68 C759 45 834 51 878 84 C858 112 780 122 721 104 C696 96 695 79 716 68Z',
			labelX: 788,
			labelY: 86
		},
		{
			key: 'afghanistan',
			name: 'Afghanistan',
			shortName: 'Afghan',
			path: 'M786 220 C814 198 861 208 878 245 C863 278 819 292 790 269 C770 254 769 234 786 220Z',
			labelX: 824,
			labelY: 246
		},
		{
			key: 'indiaUtara',
			name: 'India utara',
			shortName: 'India U',
			path: 'M858 242 C887 221 929 230 942 267 C928 301 884 309 856 285 C839 271 840 254 858 242Z',
			labelX: 895,
			labelY: 267
		},
		{
			key: 'indiaTengah',
			name: 'India tengah',
			shortName: 'India T',
			path: 'M875 299 C907 281 949 296 958 334 C945 372 900 381 875 352 C860 333 860 311 875 299Z',
			labelX: 910,
			labelY: 332
		}
	];

	const regionLookup = new Map(mapRegions.map((region) => [region.key, region] as const));
	const accentPalette = ['#f59e0b', '#22c55e', '#38bdf8', '#fb7185', '#a3e635', '#14b8a6', '#f97316', '#c084fc'];

	const getAccent = (order: number) => accentPalette[(order - 1) % accentPalette.length];
	const isMapRegion = (region: MapRegion | undefined): region is MapRegion => Boolean(region);

	let accent = accentPalette[0];
	let activeRegionKeySet = new Set<DynastyRegionKey>();
	let activeRegionDetails: MapRegion[] = [];
	let ariaLabel = '';

	$: accent = getAccent(dynasty.order);
	$: activeRegionKeySet = new Set<DynastyRegionKey>(dynasty.mapRegions);
	$: activeRegionDetails = dynasty.mapRegions.map((key) => regionLookup.get(key)).filter(isMapRegion);
	$: ariaLabel = `Peta skematik wilayah ${dynasty.name}: ${activeRegionDetails
		.map((region) => region.name)
		.join(', ')}`;

	const hasRegion = (key: DynastyRegionKey) => activeRegionKeySet.has(key);
	const getRegionFill = (key: DynastyRegionKey) => (hasRegion(key) ? accent : '#d8e2ee');
	const getRegionStroke = (key: DynastyRegionKey) => (hasRegion(key) ? '#0f172a' : '#ffffff');
	const getRegionOpacity = (key: DynastyRegionKey) => (hasRegion(key) ? 0.98 : 0.36);
	const labelWidth = (label: string) => label.length * 7 + 22;
</script>

<div class="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-3 shadow-sm">
	<div class="grid gap-3 xl:grid-cols-[1.38fr,0.62fr]">
		<div class="overflow-hidden rounded-[1.25rem] border border-white/10 bg-slate-900">
			<svg viewBox="0 0 980 390" role="img" aria-label={ariaLabel} class="h-auto w-full">
				<defs>
					<linearGradient id={`sea-gradient-${dynasty.slug}`} x1="0" x2="1" y1="0" y2="1">
						<stop offset="0%" stop-color="#082f49" />
						<stop offset="48%" stop-color="#0f172a" />
						<stop offset="100%" stop-color="#111827" />
					</linearGradient>
					<radialGradient id={`glow-${dynasty.slug}`} cx="50%" cy="42%" r="65%">
						<stop offset="0%" stop-color={accent} stop-opacity="0.28" />
						<stop offset="100%" stop-color={accent} stop-opacity="0" />
					</radialGradient>
					<pattern id={`grid-${dynasty.slug}`} width="46" height="46" patternUnits="userSpaceOnUse">
						<path d="M46 0H0V46" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1" />
					</pattern>
				</defs>

				<rect width="980" height="390" fill={`url(#sea-gradient-${dynasty.slug})`} />
				<rect width="980" height="390" fill={`url(#grid-${dynasty.slug})`} />
				<ellipse cx="510" cy="198" rx="430" ry="165" fill={`url(#glow-${dynasty.slug})`} />

				<g opacity="0.28">
					<path
						d="M70 170 C170 93 333 105 441 151 C551 69 728 51 893 100"
						fill="none"
						stroke="#bae6fd"
						stroke-dasharray="8 12"
						stroke-linecap="round"
						stroke-width="2"
					/>
					<path
						d="M93 244 C248 290 384 286 505 269 C660 248 798 264 937 320"
						fill="none"
						stroke="#bae6fd"
						stroke-dasharray="5 11"
						stroke-linecap="round"
						stroke-width="1.5"
					/>
				</g>

				<g>
					{#each mapRegions as region}
						<path
							d={region.path}
							fill={getRegionFill(region.key)}
							stroke={getRegionStroke(region.key)}
							stroke-width={hasRegion(region.key) ? 2.4 : 1.1}
							opacity={getRegionOpacity(region.key)}
							class="transition-all duration-300"
						>
							<title>{region.name}</title>
						</path>
					{/each}
				</g>

				<g>
					{#each activeRegionDetails as region}
						<g class="pointer-events-none">
							<rect
								x={region.labelX - labelWidth(region.shortName) / 2}
								y={region.labelY - 13}
								width={labelWidth(region.shortName)}
								height="26"
								rx="13"
								fill="#020617"
								opacity="0.82"
							/>
							<circle cx={region.labelX - labelWidth(region.shortName) / 2 + 13} cy={region.labelY} r="4" fill={accent} />
							<text
								x={region.labelX + 8}
								y={region.labelY + 1}
								fill="#f8fafc"
								font-size="13"
								font-weight="700"
								text-anchor="middle"
								dominant-baseline="middle"
							>
								{region.shortName}
							</text>
						</g>
					{/each}
				</g>

				<text x="42" y="45" fill="#e0f2fe" font-size="13" font-weight="700" opacity="0.82">
					Peta skematik dunia Islam
				</text>
				<text x="42" y="66" fill="#bae6fd" font-size="11" opacity="0.68">
					Sorotan warna menunjukkan wilayah inti atau fase puncak kekuasaan.
				</text>
			</svg>
		</div>

		<div class="rounded-[1.25rem] border border-white/10 bg-white/95 p-4 text-slate-800">
			<div class="flex items-center gap-3">
				<span class="h-3 w-3 rounded-full" style={`background-color: ${accent}`}></span>
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Peta Wilayah</p>
			</div>
			<p class="mt-3 text-sm leading-7 text-slate-700">
				Peta ini bersifat skematik, bukan batas politik presisi modern. Sorotan mengikuti wilayah inti
				yang diringkas untuk dinasti ini.
			</p>
			<p class="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Wilayah disorot</p>
			<div class="mt-3 flex flex-wrap gap-2">
				{#each activeRegionDetails as region}
					<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
						{region.name}
					</span>
				{/each}
			</div>
			<p class="mt-4 text-xs leading-6 text-slate-500">Ringkasan data: {dynasty.regions}.</p>
		</div>
	</div>
</div>

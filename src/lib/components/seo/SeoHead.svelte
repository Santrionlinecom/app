<script lang="ts">
	export let title = 'SantriOnline - Platform Ekosistem Pesantren Digital';
	export let description =
		'Belajar Islam, akses kitab turats, hafalan Al-Quran, dan manajemen pesantren dalam satu platform digital berbasis Ahlus Sunnah wal Jamaah.';
	export let keywords = 'santri online, pesantren digital, kitab kuning, hafalan quran, belajar islam';
	export let ogImage = 'https://app.santrionline.com/santrionline.png';
	export let canonical = 'https://app.santrionline.com';
	export let type: 'website' | 'article' = 'website';
	export let publishedAt = '';
	export let modifiedAt = '';
	export let noindex = false;
	/** Bahasa isi halaman (BCP-47). Dipakai hreflang dan meta content-language. */
	export let language = 'id-ID';
	/** Wilayah sasaran ISO-3166. Sinyal GEO untuk mesin pencari. */
	export let region = 'ID';
	/** Rubrik artikel; mengisi article:section agar tidak selalu generik. */
	export let articleSection = 'Dakwah Islam';

	const siteName = 'SantriOnline';
	const baseUrl = 'https://app.santrionline.com';
	const toAbsoluteUrl = (value: string) => {
		if (!value) return baseUrl;
		try {
			return new URL(value, baseUrl).toString();
		} catch {
			return baseUrl;
		}
	};

	$: fullTitle = title.includes('SantriOnline') ? title : `${title} - ${siteName}`;
	$: canonicalUrl = toAbsoluteUrl(canonical);
	$: imageUrl = toAbsoluteUrl(ogImage);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content={keywords} />
	<meta name="author" content="SantriOnline" />
	<meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- GEO: bahasa dan wilayah sasaran dinyatakan tegas, tidak ditebak mesin. -->
	<meta name="language" content={language} />
	<meta name="geo.region" content={region} />
	<meta name="geo.placename" content="Indonesia" />
	<link rel="alternate" hreflang={language} href={canonicalUrl} />
	<link rel="alternate" hreflang="x-default" href={canonicalUrl} />

	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:locale" content="id_ID" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />

	{#if type === 'article' && publishedAt}
		<meta property="article:published_time" content={publishedAt} />
		{#if modifiedAt}
			<meta property="article:modified_time" content={modifiedAt} />
		{/if}
		<meta property="article:author" content="SantriOnline" />
		<meta property="article:section" content={articleSection} />
	{/if}

	<meta name="theme-color" content="#1D9E75" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-title" content="SantriOnline" />
</svelte:head>

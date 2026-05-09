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
		<meta property="article:section" content="Dakwah Islam" />
	{/if}

	<meta name="theme-color" content="#1D9E75" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-title" content="SantriOnline" />
</svelte:head>

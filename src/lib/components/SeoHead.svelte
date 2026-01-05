<script lang="ts">
	export let title: string;
	export let description: string | null = null;
	export let canonicalUrl: string;
	export let imageUrl: string;
	export let datePublished: string;
	export let dateModified: string;
	export let authorName: string;
	export let authorUrl: string | null = null;
	export let siteName = 'Santri Online';
	export let publisherName = 'Santri Online';
	export let publisherLogoUrl = '/icons/icon-192.png';
	export let keywords: string | null = null;

	const toAbsoluteUrl = (value: string, base?: string) => {
		if (!value) return value;
		if (value.startsWith('http://') || value.startsWith('https://')) return value;
		if (!base) return value;
		try {
			return new URL(value, base).toString();
		} catch {
			return value;
		}
	};

	$: canonical = toAbsoluteUrl(canonicalUrl);
	$: absoluteImage = toAbsoluteUrl(imageUrl, canonical);
	$: absolutePublisherLogo = toAbsoluteUrl(publisherLogoUrl, canonical);
	$: safeDescription = description?.trim() || title;
	$: jsonLd = ({
		'@context': 'https://schema.org',
		'@type': 'NewsArticle',
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': canonical
		},
		headline: title,
		image: [absoluteImage],
		datePublished,
		dateModified,
		author: authorUrl
			? { '@type': 'Person', name: authorName, url: authorUrl }
			: { '@type': 'Person', name: authorName },
		publisher: {
			'@type': 'Organization',
			name: publisherName,
			logo: {
				'@type': 'ImageObject',
				url: absolutePublisherLogo
			}
		},
		description: safeDescription
	});
</script>

<svelte:head>
  <title>{title}</title>
  <link rel="canonical" href={canonical} />
  <meta name="description" content={safeDescription} />
  <meta property="og:type" content="article" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={safeDescription} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={absoluteImage} />
  {#if siteName}
    <meta property="og:site_name" content={siteName} />
  {/if}
  <meta property="article:published_time" content={datePublished} />
  <meta property="article:modified_time" content={dateModified} />
  <meta property="article:author" content={authorName} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={safeDescription} />
  <meta name="twitter:image" content={absoluteImage} />
  {#if keywords}
    <meta name="keywords" content={keywords} />
  {/if}
  <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
</svelte:head>

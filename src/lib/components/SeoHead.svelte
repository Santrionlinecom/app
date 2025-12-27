<script lang="ts">
  type SeoHeadProps = {
    title: string;
    description?: string | null;
    canonicalUrl: string;
    imageUrl: string;
    datePublished: string;
    dateModified: string;
    authorName: string;
    authorUrl?: string | null;
    siteName?: string;
    publisherName?: string;
    publisherLogoUrl?: string;
    keywords?: string | null;
  };

  let {
    title,
    description = null,
    canonicalUrl,
    imageUrl,
    datePublished,
    dateModified,
    authorName,
    authorUrl = null,
    siteName = 'Santri Online',
    publisherName = 'Santri Online',
    publisherLogoUrl = '/pwa-192x192.png',
    keywords = null
  } = $props() as SeoHeadProps;

  let canonical = '';
  let absoluteImage = '';
  let absolutePublisherLogo = '';
  let safeDescription = '';
  let jsonLd: Record<string, unknown> = {};

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
  $: jsonLd = {
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
  };
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

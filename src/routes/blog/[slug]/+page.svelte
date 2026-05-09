<script lang="ts">
  import type { PageData } from './$types';
  import Breadcrumb from '$lib/components/seo/Breadcrumb.svelte';
  import InternalLinks from '$lib/components/seo/InternalLinks.svelte';
  import SchemaOrg from '$lib/components/seo/SchemaOrg.svelte';
  import SeoHead from '$lib/components/seo/SeoHead.svelte';

  export let data: PageData;

  const formatDateTime = (ts: number | null | undefined) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  };

  $: breadcrumbs = [
    { name: 'Beranda', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: data.post.title, url: `/blog/${data.post.slug}` }
  ];

  $: articleSchemaData = {
    ...data.post,
    url: data.seo.canonicalUrl,
    image: data.seo.imageUrl,
    datePublished: data.seo.datePublished,
    dateModified: data.seo.dateModified,
    keywords: data.seo.keywords
  };
</script>

<SeoHead
  title={data.seo.title}
  description={data.seo.description}
  canonical={data.seo.canonicalUrl}
  ogImage={data.seo.imageUrl}
  type="article"
  publishedAt={data.seo.datePublished}
  modifiedAt={data.seo.dateModified}
  keywords={data.seo.keywords ?? ''}
/>

<SchemaOrg type="article" data={articleSchemaData} />
<SchemaOrg type="breadcrumb" data={{ breadcrumbs }} />

<article class="container mx-auto p-4 max-w-3xl">
  <Breadcrumb items={breadcrumbs} />
  
  <h1 class="text-4xl font-bold mb-4">{data.post.title}</h1>
  <p class="text-xs text-base-content/60 mb-2">
    {formatDateTime(data.post.scheduled_at ?? data.post.created_at)}
  </p>
  {#if data.post.thumbnail_url}
    <img src={data.post.thumbnail_url} alt={`Thumbnail ${data.post.title}`} class="w-full rounded-lg border border-base-300 mb-6" loading="lazy" />
  {/if}
  
  <div class="prose prose-lg max-w-none prose-slate prose-headings:text-slate-900 prose-p:text-slate-700 prose-img:rounded-xl">
    {@html data.post.content}
  </div>
</article>

<div class="container mx-auto max-w-3xl px-4">
  <InternalLinks currentSlug={data.post.slug} relatedPosts={data.relatedPosts} />
</div>

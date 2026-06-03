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

<article class="mx-auto w-full max-w-full px-4 py-6 sm:px-6 lg:px-8">
  <div class="mx-auto w-full max-w-3xl">
    <Breadcrumb items={breadcrumbs} />
    
    <header class="mb-8 mt-6">
      <h1 class="break-words text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
        {data.post.title}
      </h1>
      <p class="mt-4 text-sm text-slate-500 sm:text-base">
        {formatDateTime(data.post.scheduled_at ?? data.post.created_at)}
      </p>
    </header>

    {#if data.post.thumbnail_url}
      <figure class="mb-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <img 
          src={data.post.thumbnail_url} 
          alt={`Thumbnail ${data.post.title}`} 
          class="h-auto w-full object-cover" 
          loading="lazy" 
        />
      </figure>
    {/if}
    
    <div class="prose prose-lg mx-auto w-full max-w-full min-w-0 break-words prose-slate prose-headings:break-words prose-headings:font-bold prose-headings:leading-tight prose-headings:text-slate-900 prose-h1:text-3xl prose-h1:sm:text-4xl prose-h2:text-2xl prose-h2:sm:text-3xl prose-h3:text-xl prose-h3:sm:text-2xl prose-p:text-base prose-p:leading-relaxed prose-p:text-slate-700 sm:prose-p:text-lg sm:prose-p:leading-8 prose-a:break-words prose-a:text-emerald-700 prose-a:no-underline hover:prose-a:text-emerald-800 hover:prose-a:underline prose-strong:font-semibold prose-strong:text-slate-900 prose-img:mx-auto prose-img:rounded-xl prose-img:shadow-md prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:py-2 prose-blockquote:pl-4 prose-blockquote:pr-4 prose-blockquote:not-italic prose-blockquote:text-slate-700 prose-ul:list-disc prose-ol:list-decimal prose-li:text-slate-700 prose-li:marker:text-emerald-600">
      {@html data.post.content}
    </div>
  </div>

  {#if data.post.is_auto_generated && (data.post.source_name || data.post.source_url)}
    <div class="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900 sm:text-base">
      <span class="font-semibold text-amber-950">Dirangkum dari:</span>
      {#if data.post.source_url}
        <a
          href={data.post.source_url}
          target="_blank"
          rel="nofollow noopener noreferrer"
          class="ml-1 break-words text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800 hover:decoration-emerald-500"
        >
          {data.post.source_name || data.post.source_url}
        </a>
      {:else}
        <span class="ml-1">{data.post.source_name}</span>
      {/if}
    </div>
  {/if}
</article>

<div class="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
  <InternalLinks currentSlug={data.post.slug} relatedPosts={data.relatedPosts} />
</div>

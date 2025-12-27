<script lang="ts">
  import SeoHead from '$lib/components/SeoHead.svelte';
  let { data } = $props();

  const formatDateTime = (ts: number | null | undefined) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  };
</script>

<SeoHead
  title={data.seo.title}
  description={data.seo.description}
  canonicalUrl={data.seo.canonicalUrl}
  imageUrl={data.seo.imageUrl}
  datePublished={data.seo.datePublished}
  dateModified={data.seo.dateModified}
  authorName={data.seo.authorName}
  authorUrl={data.seo.authorUrl}
  siteName={data.seo.siteName}
  publisherName={data.seo.publisherName}
  publisherLogoUrl={data.seo.publisherLogoUrl}
  keywords={data.seo.keywords}
/>

<article class="container mx-auto p-4 max-w-3xl">
  <a href="/blog" class="btn btn-sm btn-ghost mb-4">← Back to Blog</a>
  
  <h1 class="text-4xl font-bold mb-4">{data.post.title}</h1>
  <p class="text-xs text-base-content/60 mb-2">
    {formatDateTime(data.post.scheduled_at ?? data.post.created_at)}
  </p>
  {#if data.post.thumbnail_url}
    <img src={data.post.thumbnail_url} alt={`Thumbnail ${data.post.title}`} class="w-full rounded-lg border border-base-300 mb-6" loading="lazy" />
  {/if}
  
  <div class="prose max-w-none">
    {@html data.post.content}
  </div>
</article>

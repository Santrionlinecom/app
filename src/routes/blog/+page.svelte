<script lang="ts">
  let { data } = $props();

  let items = [];
  let page = 1;
  let limit = 10;
  let totalPages = 1;

  $: items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.posts)
      ? data.posts
      : [];
  $: page = Number(data.page ?? 1);
  $: limit = Number(data.limit ?? 10);
  $: totalPages = Math.max(1, Math.ceil((Number(data.totalCount ?? items.length) || 0) / (limit || 1)));

  const formatDateTime = (ts: number | null | undefined) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  };
</script>

<div class="container mx-auto p-4 max-w-4xl">
  <h1 class="text-4xl font-bold mb-8">Blog</h1>

  <div class="space-y-6">
    {#each items as post}
      <article class="card bg-base-200">
        {#if post.thumbnail_url}
          <img src={post.thumbnail_url} alt={`Thumbnail ${post.title}`} class="w-full h-56 object-cover rounded-t" loading="lazy" />
        {/if}
        <div class="card-body">
          <h2 class="card-title">
            <a href={`/blog/${post.slug}`} class="hover:underline">{post.title}</a>
          </h2>
          <p class="text-xs text-base-content/60">
            {formatDateTime(post.scheduled_at ?? post.created_at)}
          </p>
          {#if post.excerpt}
            <p class="text-base-content/70">{post.excerpt}</p>
          {/if}
          <div class="card-actions justify-end">
            <a href={`/blog/${post.slug}`} class="btn btn-sm btn-primary">Read More</a>
          </div>
        </div>
      </article>
    {/each}
  </div>

  <div class="mt-8 flex flex-col items-center gap-2">
    <div class="join">
      <a
        class="btn btn-sm join-item"
        class:btn-disabled={page <= 1}
        href={`?page=${page - 1}`}
        aria-disabled={page <= 1}
        tabindex={page <= 1 ? -1 : 0}
      >
        Prev
      </a>
      <a
        class="btn btn-sm join-item"
        class:btn-disabled={page >= totalPages}
        href={`?page=${page + 1}`}
        aria-disabled={page >= totalPages}
        tabindex={page >= totalPages ? -1 : 0}
      >
        Next
      </a>
    </div>
    <p class="text-sm text-base-content/70">Halaman {page} dari {totalPages}</p>
  </div>
</div>

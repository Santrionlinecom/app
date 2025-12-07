<script lang="ts">
  let { data } = $props();
</script>

<article class="container mx-auto p-4 max-w-3xl">
  <a href="/blog" class="btn btn-sm btn-ghost mb-4">← Back to Blog</a>
  
  <h1 class="text-4xl font-bold mb-4">{data.post.title}</h1>
  
  <div class="prose max-w-none">
    {@html data.post.content}
  </div>
</article>

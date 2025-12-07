<script lang="ts">
  let { data } = $props();
</script>

<div class="container mx-auto p-4 max-w-4xl">
  <h1 class="text-4xl font-bold mb-8">Blog</h1>

  <div class="space-y-6">
    {#each data.posts as post}
      <article class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">
            <a href="/blog/{post.slug}" class="hover:underline">{post.title}</a>
          </h2>
          {#if post.excerpt}
            <p class="text-base-content/70">{post.excerpt}</p>
          {/if}
          <div class="card-actions justify-end">
            <a href="/blog/{post.slug}" class="btn btn-sm btn-primary">Read More</a>
          </div>
        </div>
      </article>
    {/each}
  </div>
</div>

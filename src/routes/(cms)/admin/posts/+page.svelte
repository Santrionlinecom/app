<script lang="ts">
  import { enhance } from '$app/forms';
  
  let { data } = $props();
  let query = $state('');
  let statusFilter = $state<'all' | 'draft' | 'published'>('all');

  const filtered = $derived(() => {
    const q = query.trim().toLowerCase();
    return (data.posts || [])
      .filter((p: any) => (statusFilter === 'all' ? true : p.status === statusFilter))
      .filter((p: any) => !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  });
</script>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Posts</h1>
    <a href="/admin/posts/new" class="btn btn-primary">New Post</a>
  </div>

  {#if data.error}
    <div class="alert alert-error mb-4">
      <span>{data.error}</span>
    </div>
  {/if}

  <div class="flex flex-wrap gap-2 items-center mb-4">
    <input type="text" class="input input-bordered w-full sm:w-72" placeholder="Cari judul atau slug..." bind:value={query} />
    <select class="select select-bordered w-full sm:w-48" bind:value={statusFilter}>
      <option value="all">Semua status</option>
      <option value="draft">Draft</option>
      <option value="published">Published</option>
    </select>
  </div>

  <div class="overflow-x-auto">
    <table class="table w-full">
      <thead>
        <tr>
          <th>Title</th>
          <th>Slug</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filtered() as post}
          <tr>
            <td>{post.title}</td>
            <td>{post.slug}</td>
            <td>
              <span class="badge {post.status === 'published' ? 'badge-success' : 'badge-warning'}">
                {post.status}
              </span>
            </td>
            <td>
              <a href={`/admin/posts/${post.id}/edit`} class="btn btn-sm btn-ghost">Edit</a>
              <form method="POST" action="?/toggle" use:enhance class="inline">
                <input type="hidden" name="id" value={post.id} />
                <input type="hidden" name="next" value={post.status === 'published' ? 'draft' : 'published'} />
                <button type="submit" class="btn btn-sm {post.status === 'published' ? 'btn-warning' : 'btn-success'}">
                  {post.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
              </form>
              <form method="POST" action="?/delete" use:enhance class="inline">
                <input type="hidden" name="id" value={post.id} />
                <button type="submit" class="btn btn-sm btn-error" onclick={(e) => { if (!confirm('Delete this post?')) e.preventDefault(); }}>Delete</button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

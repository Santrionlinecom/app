<script lang="ts">
  import { enhance } from '$app/forms';
  
  let { data } = $props();
</script>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Posts</h1>
    <a href="/admin/posts/new" class="btn btn-primary">New Post</a>
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
        {#each data.posts as post}
          <tr>
            <td>{post.title}</td>
            <td>{post.slug}</td>
            <td>
              <span class="badge {post.status === 'published' ? 'badge-success' : 'badge-warning'}">
                {post.status}
              </span>
            </td>
            <td>
              <a href="/admin/posts/{post.id}/edit" class="btn btn-sm btn-ghost">Edit</a>
              <form method="POST" action="?/delete" use:enhance class="inline">
                <input type="hidden" name="id" value={post.id} />
                <button type="submit" class="btn btn-sm btn-error" onclick="return confirm('Delete this post?')">Delete</button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

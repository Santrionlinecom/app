<script lang="ts">
  import { enhance } from '$app/forms';
  
  let { data } = $props();
</script>

<div class="container mx-auto p-4 max-w-4xl">
  <h1 class="text-3xl font-bold mb-6">Edit Post</h1>

  <form method="POST" use:enhance class="space-y-4">
    <div class="form-control">
      <label class="label" for="title">
        <span class="label-text">Title</span>
      </label>
      <input type="text" id="title" name="title" value={data.post.title} class="input input-bordered" required />
    </div>

    <div class="form-control">
      <label class="label" for="slug">
        <span class="label-text">Slug</span>
      </label>
      <input type="text" id="slug" name="slug" value={data.post.slug} class="input input-bordered" required />
    </div>

    <div class="form-control">
      <label class="label" for="excerpt">
        <span class="label-text">Excerpt</span>
      </label>
      <textarea id="excerpt" name="excerpt" class="textarea textarea-bordered" rows="2">{data.post.excerpt || ''}</textarea>
    </div>

    <div class="form-control">
      <label class="label" for="content">
        <span class="label-text">Content</span>
      </label>
      <textarea id="content" name="content" class="textarea textarea-bordered" rows="15" required>{data.post.content}</textarea>
    </div>

    <div class="form-control">
      <label class="label" for="status">
        <span class="label-text">Status</span>
      </label>
      <select id="status" name="status" class="select select-bordered">
        <option value="draft" selected={data.post.status === 'draft'}>Draft</option>
        <option value="published" selected={data.post.status === 'published'}>Published</option>
      </select>
    </div>

    <div class="flex gap-2">
      <button type="submit" class="btn btn-primary">Update Post</button>
      <a href="/admin/posts" class="btn btn-ghost">Cancel</a>
    </div>
  </form>
</div>

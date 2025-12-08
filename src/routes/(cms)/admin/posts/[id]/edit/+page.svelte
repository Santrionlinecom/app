<script lang="ts">
  import { enhance } from '$app/forms';
  import WysiwygEditor from '$lib/components/editor/WysiwygEditor.svelte';
  
  let { data } = $props();
  let title = $state(data.post.title);
  let slug = $state(data.post.slug);
  let content = $state(data.post.content);
  let excerpt = $state(data.post.excerpt || '');
  let seo_keyword = $state(data.post.seo_keyword || '');
  let meta_description = $state(data.post.meta_description || '');

  // SEO Score Logic
  const seoChecks = $derived(() => {
    const checks = {
      titleLength: title.length >= 40 && title.length <= 60,
      keywordInTitle: seo_keyword ? title.toLowerCase().includes(seo_keyword.toLowerCase()) : false,
      keywordInFirstPara: false,
      contentLength: false
    };

    if (seo_keyword && content) {
      const firstPara = content.replace(/<[^>]*>/g, '').substring(0, 300);
      checks.keywordInFirstPara = firstPara.toLowerCase().includes(seo_keyword.toLowerCase());
    }

    const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
    checks.contentLength = wordCount >= 300;

    return checks;
  });

  const seoScore = $derived(() => {
    const checks = seoChecks();
    let score = 0;
    if (checks.titleLength) score += 25;
    if (checks.keywordInTitle) score += 25;
    if (checks.keywordInFirstPara) score += 25;
    if (checks.contentLength) score += 25;
    return score;
  });

  const scoreColor = $derived(() => {
    const score = seoScore();
    if (score >= 75) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-error';
  });
</script>

<div class="container mx-auto p-4 max-w-7xl">
  <h1 class="text-3xl font-bold mb-6">Edit Post</h1>

  <form method="POST" use:enhance>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column (70%) -->
      <div class="lg:col-span-2 space-y-4">
        <div class="form-control">
          <label class="label" for="title">
            <span class="label-text">Title</span>
          </label>
          <input type="text" id="title" name="title" bind:value={title} class="input input-bordered" required />
        </div>

        <div class="form-control">
          <label class="label" for="slug">
            <span class="label-text">Slug</span>
          </label>
          <input type="text" id="slug" name="slug" bind:value={slug} class="input input-bordered" required />
        </div>

        <div class="form-control">
          <div class="label">
            <span class="label-text">Content</span>
          </div>
          <WysiwygEditor bind:content={content} />
          <input type="hidden" name="content" value={content} />
        </div>

        <div class="form-control">
          <label class="label" for="excerpt">
            <span class="label-text">Excerpt</span>
          </label>
          <textarea id="excerpt" name="excerpt" bind:value={excerpt} class="textarea textarea-bordered" rows="2"></textarea>
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
      </div>

      <!-- Right Column (30%) - SEO Panel -->
      <div class="space-y-4">
        <div class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">SEO Settings</h2>
            
            <div class="form-control">
              <label class="label" for="seo_keyword">
                <span class="label-text text-sm">Focus Keyword</span>
              </label>
              <input type="text" id="seo_keyword" name="seo_keyword" bind:value={seo_keyword} class="input input-bordered input-sm" />
            </div>

            <div class="form-control">
              <label class="label" for="meta_description">
                <span class="label-text text-sm">Meta Description</span>
              </label>
              <textarea id="meta_description" name="meta_description" bind:value={meta_description} class="textarea textarea-bordered textarea-sm" rows="3"></textarea>
              <div class="label">
                <span class="label-text-alt">{meta_description.length}/160 characters</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">SEO Score</h2>
            
            <div class="text-center mb-4">
              <div class="text-5xl font-bold {scoreColor()}">{seoScore()}</div>
              <div class="text-sm opacity-70">out of 100</div>
            </div>

            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <span class="{seoChecks().titleLength ? 'text-success' : 'text-error'}">
                  {seoChecks().titleLength ? '✓' : '✗'}
                </span>
                <span>Title length (40-60 chars)</span>
              </div>

              <div class="flex items-center gap-2">
                <span class="{seoChecks().keywordInTitle ? 'text-success' : 'text-error'}">
                  {seoChecks().keywordInTitle ? '✓' : '✗'}
                </span>
                <span>Keyword in title</span>
              </div>

              <div class="flex items-center gap-2">
                <span class="{seoChecks().keywordInFirstPara ? 'text-success' : 'text-error'}">
                  {seoChecks().keywordInFirstPara ? '✓' : '✗'}
                </span>
                <span>Keyword in first paragraph</span>
              </div>

              <div class="flex items-center gap-2">
                <span class="{seoChecks().contentLength ? 'text-success' : 'text-error'}">
                  {seoChecks().contentLength ? '✓' : '✗'}
                </span>
                <span>Content 300+ words</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</div>

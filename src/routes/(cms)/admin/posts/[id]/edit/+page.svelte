<script lang="ts">
  import { enhance } from '$app/forms';
  import RichTextEditor from '$lib/components/RichTextEditor.svelte';
  
  let { data } = $props();
  let title = $state(data.post.title);
  let slug = $state(data.post.slug);
  let content = $state(data.post.content);
  let excerpt = $state(data.post.excerpt || '');
  let seo_keyword = $state(data.post.seo_keyword || '');
  let meta_description = $state(data.post.meta_description || '');
  let thumbnail_url = $state(data.post.thumbnail_url || '');
  let fileInput: HTMLInputElement | null = null;
  let editingSlug = $state(false);
  let schedule_date = $state(data.post.scheduled_at ? new Date(data.post.scheduled_at).toISOString().slice(0, 10) : '');
  let schedule_time = $state(
    data.post.scheduled_at
      ? new Date(data.post.scheduled_at).toISOString().slice(11, 16)
      : ''
  );

  const generateSlug = () => {
    slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

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

  const onPickFeatured = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload gagal');
      const { url } = await res.json();
      thumbnail_url = url;
    } catch (err) {
      console.error('Upload featured image error:', err);
      alert('Gagal mengunggah gambar. Pastikan storage R2 aktif.');
    } finally {
      if (target) target.value = '';
    }
  };
</script>

<div class="container mx-auto p-4 max-w-7xl">
  <h1 class="text-3xl font-bold mb-6">Edit Post</h1>

  <form method="POST" use:enhance>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column (70%) -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Title besar + Permalink -->
        <div class="space-y-2">
          <input
            type="text"
            id="title"
            name="title"
            bind:value={title}
            oninput={() => { if (!editingSlug) generateSlug(); }}
            placeholder="Tambah judul"
            class="w-full text-3xl font-semibold border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />

          <div class="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
            <span class="opacity-80">Permalink:</span>
            {#if !editingSlug}
              <span class="bg-gray-100 px-2 py-1 rounded border border-gray-300">/posts/{slug || 'judul-post'}</span>
              <button type="button" class="btn btn-xs" onclick={() => editingSlug = true}>Sunting</button>
            {:else}
              <div class="flex items-center gap-2">
                <input type="text" class="input input-sm input-bordered" bind:value={slug} />
                <button type="button" class="btn btn-xs btn-primary" onclick={() => editingSlug = false}>OK</button>
                <button type="button" class="btn btn-xs btn-ghost" onclick={() => { editingSlug = false; generateSlug(); }}>Batal</button>
              </div>
            {/if}
          </div>
        </div>

        <div class="form-control">
          <div class="label">
            <span class="label-text">Content</span>
          </div>
          <RichTextEditor bind:value={content} />
          <input type="hidden" name="content" value={content} />
        </div>

        <div class="form-control">
          <label class="label" for="excerpt">
            <span class="label-text">Excerpt</span>
          </label>
          <textarea id="excerpt" name="excerpt" bind:value={excerpt} class="textarea textarea-bordered" rows="2"></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label" for="schedule_date">
              <span class="label-text">Jadwalkan Tanggal</span>
            </label>
            <input
              id="schedule_date"
              name="schedule_date"
              type="date"
              class="input input-bordered"
              bind:value={schedule_date}
            />
          </div>
          <div class="form-control">
            <label class="label" for="schedule_time">
              <span class="label-text">Jam</span>
            </label>
            <input
              id="schedule_time"
              name="schedule_time"
              type="time"
              class="input input-bordered"
              bind:value={schedule_time}
              step="60"
            />
          </div>
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

        <input type="hidden" name="slug" bind:value={slug} />

        <div class="flex flex-col sm:flex-row gap-2">
          <button type="submit" class="btn btn-primary w-full sm:w-auto">Update Post</button>
          <a href="/admin/posts" class="btn btn-ghost w-full sm:w-auto">Cancel</a>
        </div>
      </div>

      <!-- Right Column (30%) - SEO Panel -->
      <div class="space-y-4">
        <div class="card bg-base-200">
          <div class="card-body gap-3">
            <div class="flex items-center justify-between">
              <h2 class="card-title text-lg">Featured Image</h2>
              <button type="button" class="btn btn-xs" onclick={() => fileInput?.click()}>Upload</button>
            </div>

            {#if thumbnail_url}
              <div class="space-y-2">
                <img src={thumbnail_url} alt="Featured thumbnail" class="w-full rounded border border-base-300" />
                <div class="flex gap-2">
                  <button type="button" class="btn btn-xs btn-ghost" onclick={() => window.open(thumbnail_url, '_blank')}>Buka</button>
                  <button type="button" class="btn btn-xs btn-error" onclick={() => (thumbnail_url = '')}>Hapus</button>
                </div>
              </div>
            {:else}
              <div class="rounded border border-dashed border-base-300 p-4 text-sm opacity-70">
                Belum ada gambar. Klik Upload untuk memilih gambar.
              </div>
            {/if}

            <input type="file" accept="image/*" class="hidden" bind:this={fileInput} onchange={onPickFeatured} />
            <input type="hidden" name="thumbnail_url" value={thumbnail_url} />
          </div>
        </div>

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

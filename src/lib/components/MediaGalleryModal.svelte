<script lang="ts">
  export type MediaItem = {
    id: string;
    filename: string;
    url: string;
    mime_type: string | null;
    size: number | null;
    created_at: number;
  };

  export let title = 'Pilih gambar dari galeri';
  export let limit = 60;
  export let onSelect: (url: string, item: MediaItem) => void = () => {};

  let isOpen = $state(false);
  let items = $state<MediaItem[]>([]);
  let loading = $state(false);
  let error = $state('');
  let initialized = $state(false);

  const open = async () => {
    isOpen = true;
    if (!initialized) {
      await load();
    }
  };

  const close = () => {
    isOpen = false;
  };

  const load = async () => {
    if (typeof fetch === 'undefined') return;
    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/media?limit=${limit}`);
      if (!res.ok) throw new Error('Gagal memuat galeri');
      const data = await res.json();
      items = data.items ?? [];
      initialized = true;
    } catch (err) {
      console.error('Load media gallery error:', err);
      error = 'Gagal memuat galeri media.';
    } finally {
      loading = false;
    }
  };

  const handleSelect = (item: MediaItem) => {
    onSelect?.(item.url, item);
    close();
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
</script>

<slot name="trigger" {open} />

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-black/40" onclick={close}></div>
    <div class="relative bg-base-100 w-full max-w-4xl max-h-[85vh] rounded-lg shadow-xl border border-base-300 overflow-hidden flex flex-col">
      <div class="flex items-center justify-between px-4 py-3 border-b border-base-300">
        <div>
          <h3 class="text-lg font-semibold">{title}</h3>
          <p class="text-xs text-base-content/60">Pilih gambar yang sudah pernah diupload</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-sm" onclick={load}>Refresh</button>
          <button type="button" class="btn btn-sm btn-ghost" onclick={close}>Tutup</button>
        </div>
      </div>

      <div class="p-4 overflow-y-auto flex-1">
        {#if loading}
          <div class="text-center text-sm text-base-content/70 py-12">Memuat galeri...</div>
        {:else if error}
          <div class="alert alert-error text-sm">
            <span>{error}</span>
          </div>
        {:else if !items.length}
          <div class="text-center text-sm text-base-content/70 py-12">
            Belum ada media tersimpan. Upload dulu lewat tombol upload.
          </div>
        {:else}
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {#each items as item}
              <button
                type="button"
                class="group border border-base-300 rounded-lg overflow-hidden hover:border-primary transition-colors text-left"
                onclick={() => handleSelect(item)}
              >
                <div class="aspect-video bg-base-200 overflow-hidden">
                  <img src={item.url} alt={item.filename} class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" loading="lazy" />
                </div>
                <div class="p-2 space-y-1">
                  <p class="text-xs font-medium truncate">{item.filename}</p>
                  <p class="text-[11px] text-base-content/60">{formatDate(item.created_at)}</p>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

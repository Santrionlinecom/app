<script lang="ts">
  import type { Editor } from '@tiptap/core';

  let { editor, disabled = false }: { editor: Editor | null; disabled?: boolean } = $props();

  // Aksi tombol akan langsung memanggil chain() agar aman

  function addLink() {
    if (!editor) return;
    const url = prompt('Masukkan URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }
</script>

<div class="flex flex-wrap items-center gap-1 bg-gray-100 border-b border-gray-300 p-2">
  <!-- Bold -->
  <button type="button" class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200"
    aria-label="Bold"
    class:opacity-50={!editor || disabled}
    disabled={disabled}
    onclick={() => editor?.chain().focus().toggleBold().run()}
    title="Bold (Ctrl+B)">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 fill-current">
      <path d="M7 4h6a4 4 0 0 1 0 8H7V4zm0 10h7a4 4 0 1 1 0 8H7v-8z"/>
    </svg>
  </button>

  <!-- Italic -->
  <button type="button" class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200"
    aria-label="Italic"
    class:opacity-50={!editor || disabled}
    disabled={disabled}
    onclick={() => editor?.chain().focus().toggleItalic().run()}
    title="Italic (Ctrl+I)">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 fill-current">
      <path d="M10 4h10v2h-4.586l-4.828 12H16v2H6v-2h4.586l4.828-12H10z"/>
    </svg>
  </button>

  <div class="w-px h-6 bg-gray-300 mx-1"></div>

  <!-- Bullet List -->
  <button type="button" class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200"
    aria-label="Bulleted List"
    class:opacity-50={!editor || disabled}
    disabled={disabled}
    onclick={() => editor?.chain().focus().toggleBulletList().run()}
    title="Bullet List">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 fill-current">
      <path d="M7 5h14v2H7V5zm0 6h14v2H7v-2zm0 6h14v2H7v-2zM3 5h2v2H3V5zm0 6h2v2H3v-2zm0 6h2v2H3v-2z"/>
    </svg>
  </button>

  <!-- Ordered List -->
  <button type="button" class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200"
    aria-label="Ordered List"
    class:opacity-50={!editor || disabled}
    disabled={disabled}
    onclick={() => editor?.chain().focus().toggleOrderedList().run()}
    title="Ordered List">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 fill-current">
      <path d="M7 5h14v2H7V5zm0 6h14v2H7v-2zm0 6h14v2H7v-2zM3 6h2V4H2v1h1v1zm0 7h2v-1H4v-1H3v2zm2 4H3v1h1v1H3v1h2v-3z"/>
    </svg>
  </button>

  <!-- Blockquote -->
  <button type="button" class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200"
    aria-label="Blockquote"
    class:opacity-50={!editor || disabled}
    disabled={disabled}
    onclick={() => editor?.chain().focus().toggleBlockquote().run()}
    title="Blockquote">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 fill-current">
      <path d="M4 5h16v2H4zM6 9h10v2H6zm0 4h8v2H6zm0 4h6v2H6z"/>
    </svg>
  </button>

  <!-- Link -->
  <button type="button" class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200"
    aria-label="Link"
    class:opacity-50={!editor || disabled}
    disabled={disabled}
    onclick={addLink}
    title="Insert Link">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 fill-current">
      <path d="M3.9 12a5 5 0 0 1 5-5h3v2h-3a3 3 0 1 0 0 6h3v2h-3a5 5 0 0 1-5-5zm7-1h3a3 3 0 1 1 0 6h-3v-2h3a1 1 0 0 0 0-2h-3v-2zm0 0V9h3a5 5 0 1 1 0 10h-3v-2h3a3 3 0 1 0 0-6h-3z"/>
    </svg>
  </button>
</div>

<style>
  /* Tidak ada style tambahan; semua pakai Tailwind */
  :global(.is-active) {
    background-color: #e5e7eb; /* gray-200 */
  }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>

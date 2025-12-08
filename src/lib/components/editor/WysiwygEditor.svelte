<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Link from '@tiptap/extension-link';
  import Placeholder from '@tiptap/extension-placeholder';
  import EditorToolbar from './EditorToolbar.svelte';

  let { content = $bindable('') } = $props();

  let editor: Editor | null = $state(null);
  let editorElement: HTMLElement | null = $state(null);
  let mode = $state<'visual' | 'text'>('visual');

  onMount(() => {
    editor = new Editor({
      element: editorElement!,
      extensions: [
        StarterKit,
        Link.configure({ openOnClick: false }),
        Placeholder.configure({ placeholder: 'Tulis konten di sini…' })
      ],
      content,
      editorProps: {
        attributes: {
          class: 'prose max-w-none p-4 focus:outline-none min-h-[400px]'
        }
      },
      onUpdate: ({ editor }) => {
        content = editor.getHTML();
      }
    });
  });

  onDestroy(() => {
    editor?.destroy();
  });

  // Sinkronisasi external change -> editor
  $effect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  });

  function setMode(newMode: 'visual' | 'text') {
    if (newMode === mode) return;
    if (newMode === 'visual' && editor) {
      // ketika balik ke visual, update editor dengan konten terbaru jika berbeda
      if (content !== editor.getHTML()) {
        editor.commands.setContent(content);
      }
    }
    mode = newMode;
  }
</script>

<div class="border border-gray-300 bg-white rounded">
  <!-- Header: Tabs Visual/Text -->
  <div class="flex items-center justify-between border-b border-gray-300 bg-gray-100 px-3">
    {#if editor}
      <EditorToolbar {editor} disabled={mode === 'text'} />
    {/if}

    <div class="flex items-center gap-1 text-sm">
      <button type="button" class="px-3 py-2 rounded-t border-x border-t border-gray-300 bg-white"
        class:bg-white={mode === 'visual'} class:bg-gray-100={mode !== 'visual'}
        onclick={() => setMode('visual')}>Visual</button>
      <button type="button" class="px-3 py-2 rounded-t border-x border-t border-gray-300 bg-gray-100"
        class:bg-white={mode === 'text'} class:bg-gray-100={mode !== 'text'}
        onclick={() => setMode('text')}>Text</button>
    </div>
  </div>

  <!-- Body -->
  <!-- Editor area selalu ter-mount agar state Visual tidak hilang saat pindah ke Text -->
  <div
    bind:this={editorElement}
    class="min-h-[400px] {mode === 'text' ? 'hidden' : ''}"
  ></div>

  <!-- Textarea untuk mode Text, terhubung ke konten yang sama -->
  <textarea
    class="w-full min-h-[400px] p-4 font-mono text-sm outline-none {mode === 'visual' ? 'hidden' : ''}"
    bind:value={content}
    spellcheck="false"
  ></textarea>
</div>

<!-- Penjelasan singkat:
Komponen ini adalah editor WYSIWYG berbasis Tiptap. Prop $bindable `content`
akan selalu sinkron dengan isi editor. Terdapat toolbar (EditorToolbar) dan
switcher Visual/Text di kanan atas. Mode Text menampilkan textarea mentah
yang terhubung ke konten HTML yang sama. -->

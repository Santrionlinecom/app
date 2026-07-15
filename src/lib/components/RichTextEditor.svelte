<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import LinkExtension from '@tiptap/extension-link';
  import UnderlineExtension from '@tiptap/extension-underline';
  import TextAlignExtension from '@tiptap/extension-text-align';
  import ImageExtension from '@tiptap/extension-image';
  import AlignCenter from '@lucide/svelte/icons/align-center';
  import AlignLeft from '@lucide/svelte/icons/align-left';
  import AlignRight from '@lucide/svelte/icons/align-right';
  import Bold from '@lucide/svelte/icons/bold';
  import ImagePlus from '@lucide/svelte/icons/image-plus';
  import Images from '@lucide/svelte/icons/images';
  import Italic from '@lucide/svelte/icons/italic';
  import Link2 from '@lucide/svelte/icons/link-2';
  import List from '@lucide/svelte/icons/list';
  import ListOrdered from '@lucide/svelte/icons/list-ordered';
  import Minus from '@lucide/svelte/icons/minus';
  import Quote from '@lucide/svelte/icons/quote';
  import Redo2 from '@lucide/svelte/icons/redo-2';
  import Strikethrough from '@lucide/svelte/icons/strikethrough';
  import Underline from '@lucide/svelte/icons/underline';
  import Undo2 from '@lucide/svelte/icons/undo-2';
  import MediaGalleryModal from '$lib/components/MediaGalleryModal.svelte';

  // Prop bindable: value (HTML string)
  let { value = $bindable('') } = $props();

  let editor: Editor | null = $state(null);
  let editorElement: HTMLElement | null = $state(null);
  let mode: 'visual' | 'text' = $state('visual');
  let textContent = $state(value);

  onMount(() => {
    editor = new Editor({
      element: editorElement!,
      extensions: [
        StarterKit,
        LinkExtension.configure({ openOnClick: false }),
        UnderlineExtension,
        TextAlignExtension.configure({ types: ['heading', 'paragraph'] }),
        ImageExtension
      ],
      content: value,
      editorProps: {
        attributes: {
          class:
            'prose prose-base max-w-none min-h-[420px] p-4 text-slate-900 focus:outline-none sm:min-h-[500px] sm:p-6 sm:prose-lg [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold'
        }
      },
      onUpdate: ({ editor }) => {
        value = editor.getHTML();
        textContent = value;
      }
    });
  });

  onDestroy(() => {
    editor?.destroy();
  });

  function switchMode(newMode: 'visual' | 'text') {
    if (newMode === mode) return;
    if (newMode === 'text') {
      textContent = editor?.getHTML() || '';
      value = textContent;
    } else if (newMode === 'visual' && editor) {
      if (textContent !== editor.getHTML()) {
        editor.commands.setContent(textContent);
      }
      value = textContent;
    }
    mode = newMode;
  }

  function handleTextChange(e: Event) {
    const newVal = (e.target as HTMLTextAreaElement).value;
    textContent = newVal;
    value = newVal;
  }

  function addLink() {
    const url = prompt('Masukkan URL:');
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  }

  // Upload gambar lalu sisipkan ke editor
  let fileInput: HTMLInputElement | null = $state(null);
  async function onPickImage(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload gagal');
      const { url } = await res.json();
      if (url) editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err) {
      console.error('Upload image error:', err);
      alert('Gagal mengunggah gambar. Pastikan layanan unggah media aktif.');
    } finally {
      // reset agar bisa memilih file yang sama lagi jika perlu
      if (target) target.value = '';
    }
  }

  // Sync perubahan eksternal ke editor
  $effect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
      textContent = value;
    }
  });

  const insertImageFromGallery = (url: string) => {
    if (!url) return;
    editor?.chain().focus().setImage({ src: url }).run();
  };

  const toolbarButtonClass =
    'inline-flex h-11 w-full min-w-0 items-center justify-center rounded border border-transparent text-slate-700 transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9';
  const modeTabClass =
    'min-h-10 border border-b-0 px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500';
</script>

<!-- Editor klasik ala WordPress -->
<div class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
  <div data-editor-mode-tabs class="flex items-end justify-end gap-1 border-b border-slate-300 bg-slate-100 px-2 pt-2">
    <button type="button" class={`${modeTabClass} ${mode === 'visual' ? '-mb-px border-slate-300 bg-white text-slate-900' : 'border-transparent bg-transparent text-slate-500 hover:text-slate-800'}`} aria-pressed={mode === 'visual'} onclick={() => switchMode('visual')}>Visual</button>
    <button type="button" class={`${modeTabClass} ${mode === 'text' ? '-mb-px border-slate-300 bg-white text-slate-900' : 'border-transparent bg-transparent text-slate-500 hover:text-slate-800'}`} aria-pressed={mode === 'text'} onclick={() => switchMode('text')}>Teks</button>
  </div>

  {#if mode === 'visual'}
    <div data-editor-toolbar aria-label="Toolbar format artikel" class="border-b border-slate-300 bg-[#f6f7f7] p-2">
      <div data-toolbar-group="primary" class="grid min-w-0 grid-cols-6 gap-1 sm:flex sm:flex-wrap" style="grid-template-columns: repeat(6, minmax(0, 1fr));">
        <button type="button" class={toolbarButtonClass} class:editor-tool-active={editor?.isActive('bold')} title="Tebal (Ctrl+B)" aria-label="Tebal" aria-pressed={editor?.isActive('bold') ?? false} onclick={() => editor?.chain().focus().toggleBold().run()}><Bold class="h-5 w-5" strokeWidth={2.25} /></button>
        <button type="button" class={toolbarButtonClass} class:editor-tool-active={editor?.isActive('italic')} title="Miring (Ctrl+I)" aria-label="Miring" aria-pressed={editor?.isActive('italic') ?? false} onclick={() => editor?.chain().focus().toggleItalic().run()}><Italic class="h-5 w-5" /></button>
        <button type="button" class={toolbarButtonClass} class:editor-tool-active={editor?.isActive('underline')} title="Garis bawah (Ctrl+U)" aria-label="Garis bawah" aria-pressed={editor?.isActive('underline') ?? false} onclick={() => editor?.chain().focus().toggleUnderline().run()}><Underline class="h-5 w-5" /></button>
        <button type="button" class={toolbarButtonClass} class:editor-tool-active={editor?.isActive('strike')} title="Coret" aria-label="Coret" aria-pressed={editor?.isActive('strike') ?? false} onclick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough class="h-5 w-5" /></button>
        <button type="button" class={toolbarButtonClass} class:editor-tool-active={editor?.isActive('heading', { level: 1 })} title="Judul 1" aria-label="Judul 1" aria-pressed={editor?.isActive('heading', { level: 1 }) ?? false} onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}><span class="text-sm font-bold leading-none">H1</span></button>
        <button type="button" class={toolbarButtonClass} class:editor-tool-active={editor?.isActive('heading', { level: 2 })} title="Judul 2" aria-label="Judul 2" aria-pressed={editor?.isActive('heading', { level: 2 }) ?? false} onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><span class="text-sm font-bold leading-none">H2</span></button>
      </div>

      <div data-toolbar-group="secondary" class="mt-2 grid min-w-0 grid-cols-6 gap-1 border-t border-slate-300 pt-2 sm:flex sm:flex-wrap" style="grid-template-columns: repeat(6, minmax(0, 1fr));">
        <button type="button" class={toolbarButtonClass} class:editor-tool-active={editor?.isActive({ textAlign: 'left' })} title="Rata kiri" aria-label="Rata kiri" onclick={() => editor?.chain().focus().setTextAlign('left').run()}><AlignLeft class="h-5 w-5" /></button>
        <button type="button" class={toolbarButtonClass} class:editor-tool-active={editor?.isActive({ textAlign: 'center' })} title="Rata tengah" aria-label="Rata tengah" onclick={() => editor?.chain().focus().setTextAlign('center').run()}><AlignCenter class="h-5 w-5" /></button>
        <button type="button" class={toolbarButtonClass} class:editor-tool-active={editor?.isActive({ textAlign: 'right' })} title="Rata kanan" aria-label="Rata kanan" onclick={() => editor?.chain().focus().setTextAlign('right').run()}><AlignRight class="h-5 w-5" /></button>
        <button type="button" class={toolbarButtonClass} class:editor-tool-active={editor?.isActive('bulletList')} title="Daftar poin" aria-label="Daftar poin" aria-pressed={editor?.isActive('bulletList') ?? false} onclick={() => editor?.chain().focus().toggleBulletList().run()}><List class="h-5 w-5" /></button>
        <button type="button" class={toolbarButtonClass} class:editor-tool-active={editor?.isActive('orderedList')} title="Daftar nomor" aria-label="Daftar nomor" aria-pressed={editor?.isActive('orderedList') ?? false} onclick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered class="h-5 w-5" /></button>
        <button type="button" class={toolbarButtonClass} class:editor-tool-active={editor?.isActive('blockquote')} title="Kutipan" aria-label="Kutipan" aria-pressed={editor?.isActive('blockquote') ?? false} onclick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote class="h-5 w-5" /></button>
        <button type="button" class={toolbarButtonClass} title="Garis pemisah" aria-label="Garis pemisah" onclick={() => editor?.chain().focus().setHorizontalRule().run()}><Minus class="h-5 w-5" /></button>
        <button type="button" class={toolbarButtonClass} class:editor-tool-active={editor?.isActive('link')} title="Sisipkan tautan" aria-label="Sisipkan tautan" onclick={addLink}><Link2 class="h-5 w-5" /></button>
        <button type="button" class={toolbarButtonClass} title="Unggah gambar" aria-label="Unggah gambar" onclick={() => fileInput?.click()}><ImagePlus class="h-5 w-5" /></button>
        <input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={onPickImage} />
        <MediaGalleryModal onSelect={(url: string) => insertImageFromGallery(url)}>
          <svelte:fragment slot="trigger" let:open>
            <button type="button" class={toolbarButtonClass} onclick={open} title="Pilih gambar dari galeri" aria-label="Pilih gambar dari galeri"><Images class="h-5 w-5" /></button>
          </svelte:fragment>
        </MediaGalleryModal>
        <button type="button" class={toolbarButtonClass} title="Urungkan (Ctrl+Z)" aria-label="Urungkan" onclick={() => editor?.chain().focus().undo().run()}><Undo2 class="h-5 w-5" /></button>
        <button type="button" class={toolbarButtonClass} title="Ulangi (Ctrl+Y)" aria-label="Ulangi" onclick={() => editor?.chain().focus().redo().run()}><Redo2 class="h-5 w-5" /></button>
      </div>
    </div>
  {/if}

  <div class="bg-white">
    <div bind:this={editorElement} class={mode === 'text' ? 'hidden' : ''}></div>
    <textarea class={`min-h-[420px] w-full resize-y p-4 font-mono text-sm leading-6 text-slate-900 outline-none sm:min-h-[500px] sm:p-6 ${mode === 'visual' ? 'hidden' : ''}`} value={textContent} oninput={handleTextChange} spellcheck="false" aria-label="Sumber HTML artikel"></textarea>
  </div>
</div>

<style>
  .editor-tool-active {
    border-color: rgb(148 163 184);
    background: white;
    color: rgb(5 150 105);
    box-shadow: inset 0 1px 2px rgb(15 23 42 / 0.08);
  }
</style>

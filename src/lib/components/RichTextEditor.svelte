<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Link from '@tiptap/extension-link';
  import Underline from '@tiptap/extension-underline';
  import TextAlign from '@tiptap/extension-text-align';

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
        Link.configure({ openOnClick: false }),
        Underline,
        TextAlign.configure({ types: ['heading', 'paragraph'] })
      ],
      content: value,
      editorProps: {
        attributes: {
          class:
            'prose prose-lg max-w-none p-6 focus:outline-none min-h-[500px] [&_h1]:font-bold [&_h1]:text-3xl [&_h2]:font-bold [&_h2]:text-2xl'
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

  // Sync perubahan eksternal ke editor
  $effect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
      textContent = value;
    }
  });
</script>

<!-- Container Editor ala "kertas" -->
<div class="border border-base-300 rounded-lg bg-base-100 overflow-hidden shadow-sm">
  <!-- Toolbar / Ribbon -->
  <div class="bg-base-200 border-b border-base-300 px-2 py-1 flex items-center justify-between gap-2 flex-wrap">
    <!-- Left: tombol format -->
    <div class="flex items-center gap-1 flex-wrap">
      <!-- Bold -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        class:btn-active={editor?.isActive('bold')}
        disabled={mode === 'text'}
        title="Bold (Ctrl+B)"
        aria-label="Bold"
        onclick={() => editor?.chain().focus().toggleBold().run()}
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3v14h5.5a4.5 4.5 0 001.363-8.762A4.5 4.5 0 0010.5 3H5zm3 2h2.5a2.5 2.5 0 010 5H8V5zm0 7h3.5a2.5 2.5 0 010 5H8v-5z"/></svg>
      </button>

      <!-- Italic -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        class:btn-active={editor?.isActive('italic')}
        disabled={mode === 'text'}
        title="Italic (Ctrl+I)"
        aria-label="Italic"
        onclick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8 3h8v2h-3l-3 10h3v2H5v-2h3l3-10H8V3z"/></svg>
      </button>

      <!-- Underline -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        class:btn-active={editor?.isActive('underline')}
        disabled={mode === 'text'}
        title="Underline (Ctrl+U)"
        aria-label="Underline"
        onclick={() => editor?.chain().focus().toggleUnderline().run()}
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3v6a5 5 0 1010 0V3h-2v6a3 3 0 11-6 0V3H5zm-2 14h14v2H3v-2z"/></svg>
      </button>

      <!-- Strike -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        class:btn-active={editor?.isActive('strike')}
        disabled={mode === 'text'}
        title="Strikethrough"
        aria-label="Strike"
        onclick={() => editor?.chain().focus().toggleStrike().run()}
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 9h14v2H3V9zm7 7c-3.314 0-6-1.343-6-3h3c0 .552 1.343 1 3 1s3-.448 3-1c0-.586-.883-1.082-2.236-1.373L7.5 10.9c-2.52-.57-4.5-1.84-4.5-3.4C3 5.12 5.91 3 10 3c3.866 0 7 1.79 7 4h-3c0-.828-1.79-2-4-2S6 6.172 6 7c0 .594.934 1.108 2.367 1.385l2.264.443C14.71 9.42 17 10.76 17 13c0 2.21-3.134 3-7 3z"/></svg>
      </button>

      <div class="divider divider-horizontal mx-0"></div>

      <!-- H1 -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        class:btn-active={editor?.isActive('heading', { level: 1 })}
        disabled={mode === 'text'}
        title="Heading 1"
        aria-label="Heading 1"
        onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <span class="font-bold">H1</span>
      </button>

      <!-- H2 -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        class:btn-active={editor?.isActive('heading', { level: 2 })}
        disabled={mode === 'text'}
        title="Heading 2"
        aria-label="Heading 2"
        onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <span class="font-bold">H2</span>
      </button>

      <div class="divider divider-horizontal mx-0"></div>

      <!-- Align Left -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        class:btn-active={editor?.isActive({ textAlign: 'left' })}
        disabled={mode === 'text'}
        title="Align Left"
        aria-label="Align Left"
        onclick={() => editor?.chain().focus().setTextAlign('left').run()}
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4h14v2H3V4zm0 4h10v2H3V8zm0 4h14v2H3v-2zm0 4h10v2H3v-2z"/></svg>
      </button>

      <!-- Align Center -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        class:btn-active={editor?.isActive({ textAlign: 'center' })}
        disabled={mode === 'text'}
        title="Align Center"
        aria-label="Align Center"
        onclick={() => editor?.chain().focus().setTextAlign('center').run()}
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4h14v2H3V4zm2 4h10v2H5V8zm-2 4h14v2H3v-2zm2 4h10v2H5v-2z"/></svg>
      </button>

      <!-- Align Right -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        class:btn-active={editor?.isActive({ textAlign: 'right' })}
        disabled={mode === 'text'}
        title="Align Right"
        aria-label="Align Right"
        onclick={() => editor?.chain().focus().setTextAlign('right').run()}
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4h14v2H3V4zm4 4h10v2H7V8zM3 12h14v2H3v-2zm4 4h10v2H7v-2z"/></svg>
      </button>

      <div class="divider divider-horizontal mx-0"></div>

      <!-- Bullet List -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        class:btn-active={editor?.isActive('bulletList')}
        disabled={mode === 'text'}
        title="Bullet List"
        aria-label="Bullet List"
        onclick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 5h10v2H7V5zM3 5h2v2H3V5zm4 5h10v2H7v-2zM3 10h2v2H3v-2zm4 5h10v2H7v-2zM3 15h2v2H3v-2z"/></svg>
      </button>

      <!-- Ordered List -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        class:btn-active={editor?.isActive('orderedList')}
        disabled={mode === 'text'}
        title="Ordered List"
        aria-label="Ordered List"
        onclick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 5h10v2H7V5zM3 4h2v4H3V7h1V6H3V4zm4 6h10v2H7v-2zM3 10h2v2H3v1h1v1H3v1h2v-4H3zm4 5h10v2H7v-2zM4 16h1v1H4v1h2v-3H4v1z"/></svg>
      </button>

      <!-- Blockquote -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        class:btn-active={editor?.isActive('blockquote')}
        disabled={mode === 'text'}
        title="Blockquote"
        aria-label="Blockquote"
        onclick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M4 5h12v2H4V5zm2 4h8v2H6V9zm0 4h6v2H6v-2z"/></svg>
      </button>

      <!-- Horizontal Rule -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        disabled={mode === 'text'}
        title="Horizontal Rule"
        aria-label="Horizontal Rule"
        onclick={() => editor?.chain().focus().setHorizontalRule().run()}
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 10h14v2H3v-2z"/></svg>
      </button>

      <!-- Link -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        disabled={mode === 'text'}
        title="Insert Link"
        aria-label="Insert Link"
        onclick={addLink}
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7.5 10a2.5 2.5 0 012.5-2.5h3V6h-3a4 4 0 100 8h3v-1.5h-3A2.5 2.5 0 017.5 10zm5-1.5h-3V10h3A2.5 2.5 0 0115.5 12.5 2.5 2.5 0 0113 15h-3v1.5h3a4 4 0 100-8z"/></svg>
      </button>

      <div class="divider divider-horizontal mx-0"></div>

      <!-- Undo -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        disabled={mode === 'text'}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        onclick={() => editor?.chain().focus().undo().run()}
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 7V3L1 9l6 6v-4h4a5 5 0 110-10H8v2h3a3 3 0 110 6H7z"/></svg>
      </button>

      <!-- Redo -->
      <button
        type="button"
        class="btn btn-sm btn-ghost"
        disabled={mode === 'text'}
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
        onclick={() => editor?.chain().focus().redo().run()}
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13 7V3l6 6-6 6v-4H9a5 5 0 110-10h3v2H9a3 3 0 100 6h4V7z"/></svg>
      </button>
    </div>

    <!-- Right: Mode Tabs -->
    <div class="flex items-end self-end gap-1 text-sm">
      <button
        type="button"
        class="px-3 py-2 rounded-t border-x border-t border-base-300"
        class:bg-base-100={mode === 'visual'}
        class:bg-base-200={mode !== 'visual'}
        onclick={() => switchMode('visual')}
      >Visual</button>
      <button
        type="button"
        class="px-3 py-2 rounded-t border-x border-t border-base-300"
        class:bg-base-100={mode === 'text'}
        class:bg-base-200={mode !== 'text'}
        onclick={() => switchMode('text')}
      >Text</button>
    </div>
  </div>

  <!-- Area Editor -->
  <div class="bg-white">
    <!-- Keep mounted; toggle visibility only -->
    <div bind:this={editorElement} class="{mode === 'text' ? 'hidden' : ''}"></div>
    <textarea
      class="w-full min-h-[500px] p-6 font-mono text-sm outline-none {mode === 'visual' ? 'hidden' : ''}"
      value={textContent}
      oninput={handleTextChange}
      spellcheck="false"
    ></textarea>
  </div>
</div>

<!-- Catatan: Komponen ini meniru nuansa ribbon ala Microsoft Word/Classic WP Editor, 
     dengan tombol format dasar, alignment, heading, list, quote, HR, undo/redo,
     serta tab Visual/Text. Prop bindable `value` menyimpan HTML editor. -->

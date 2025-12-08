<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Link from '@tiptap/extension-link';

  let { value = $bindable('') } = $props();
  
  let editor: Editor | null = $state(null);
  let editorElement: HTMLElement | null = $state(null);
  let mode = $state<'visual' | 'text'>('visual');
  let textContent = $state(value);

  onMount(() => {
    editor = new Editor({
      element: editorElement!,
      extensions: [
        StarterKit,
        Link.configure({ openOnClick: false })
      ],
      content: value,
      editorProps: {
        attributes: {
          class: 'prose prose-lg max-w-none p-6 focus:outline-none min-h-[400px] [&_h1]:font-bold [&_h1]:text-3xl [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mt-5 [&_h2]:mb-3 [&_h3]:font-bold [&_h3]:text-xl [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:ml-6 [&_ul]:mb-4 [&_ul]:list-disc [&_ol]:ml-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_blockquote]:border-l-4 [&_blockquote]:border-base-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline'
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
    if (newMode === 'text' && mode === 'visual') {
      // Switching from Visual to Text: Get HTML from editor
      textContent = editor?.getHTML() || '';
      value = textContent;
    } else if (newMode === 'visual' && mode === 'text') {
      // Switching from Text to Visual: Update editor with text content
      if (editor && textContent !== editor.getHTML()) {
        editor.commands.setContent(textContent);
      }
      value = textContent;
    }
    mode = newMode;
  }

  function handleTextChange(e: Event) {
    const newContent = (e.target as HTMLTextAreaElement).value;
    textContent = newContent;
    value = newContent;
  }

  function addLink() {
    const url = prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }

  // Sync external value changes to editor
  $effect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
      textContent = value;
    }
  });
</script>

<div class="border border-base-300 rounded-lg bg-base-100 overflow-hidden shadow-sm">
  <!-- Toolbar -->
  <div class="bg-base-200 border-b border-base-300 p-2 flex items-center justify-between gap-2 flex-wrap">
    <div class="flex gap-1 flex-wrap">
      <button 
        type="button" 
        class="btn btn-sm btn-ghost {editor?.isActive('bold') ? 'btn-active' : ''}" 
        onclick={() => editor?.chain().focus().toggleBold().run()} 
        disabled={mode === 'text'}
        title="Bold (Ctrl+B)"
        aria-label="Bold"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3v14h5.5a4.5 4.5 0 001.363-8.762A4.5 4.5 0 0010.5 3H5zm3 2h2.5a2.5 2.5 0 010 5H8V5zm0 7h3.5a2.5 2.5 0 010 5H8v-5z"/></svg>
      </button>
      
      <button 
        type="button" 
        class="btn btn-sm btn-ghost {editor?.isActive('italic') ? 'btn-active' : ''}" 
        onclick={() => editor?.chain().focus().toggleItalic().run()} 
        disabled={mode === 'text'}
        title="Italic (Ctrl+I)"
        aria-label="Italic"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8 3h8v2h-3l-3 10h3v2H5v-2h3l3-10H8V3z"/></svg>
      </button>

      <div class="divider divider-horizontal mx-0"></div>

      <button 
        type="button" 
        class="btn btn-sm btn-ghost {editor?.isActive('heading', { level: 2 }) ? 'btn-active' : ''}" 
        onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} 
        disabled={mode === 'text'}
        title="Heading 2"
        aria-label="Heading 2"
      >
        <span class="font-bold">H2</span>
      </button>

      <button 
        type="button" 
        class="btn btn-sm btn-ghost {editor?.isActive('heading', { level: 3 }) ? 'btn-active' : ''}" 
        onclick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} 
        disabled={mode === 'text'}
        title="Heading 3"
        aria-label="Heading 3"
      >
        <span class="font-bold">H3</span>
      </button>

      <div class="divider divider-horizontal mx-0"></div>

      <button 
        type="button" 
        class="btn btn-sm btn-ghost {editor?.isActive('bulletList') ? 'btn-active' : ''}" 
        onclick={() => editor?.chain().focus().toggleBulletList().run()} 
        disabled={mode === 'text'}
        title="Bullet List"
        aria-label="Bullet List"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/></svg>
      </button>

      <button 
        type="button" 
        class="btn btn-sm btn-ghost {editor?.isActive('orderedList') ? 'btn-active' : ''}" 
        onclick={() => editor?.chain().focus().toggleOrderedList().run()} 
        disabled={mode === 'text'}
        title="Numbered List"
        aria-label="Numbered List"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4h1v1H3V4zm0 3h1v1H3V7zm0 3h1v1H3v-1zm3-6h11v2H6V4zm0 3h11v2H6V7zm0 3h11v2H6v-2z"/></svg>
      </button>

      <button 
        type="button" 
        class="btn btn-sm btn-ghost {editor?.isActive('blockquote') ? 'btn-active' : ''}" 
        onclick={() => editor?.chain().focus().toggleBlockquote().run()} 
        disabled={mode === 'text'}
        title="Blockquote"
        aria-label="Blockquote"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
      </button>

      <button 
        type="button" 
        class="btn btn-sm btn-ghost {editor?.isActive('link') ? 'btn-active' : ''}" 
        onclick={addLink} 
        disabled={mode === 'text'}
        title="Insert Link"
        aria-label="Insert Link"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/></svg>
      </button>

      <div class="divider divider-horizontal mx-0"></div>

      <button 
        type="button" 
        class="btn btn-sm btn-ghost" 
        onclick={() => editor?.chain().focus().undo().run()} 
        disabled={mode === 'text' || !editor?.can().undo()}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"/></svg>
      </button>

      <button 
        type="button" 
        class="btn btn-sm btn-ghost" 
        onclick={() => editor?.chain().focus().redo().run()} 
        disabled={mode === 'text' || !editor?.can().redo()}
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M12 5a1 1 0 110 2H6.414l1.293 1.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 1.414L6.414 5H12zM8 15a1 1 0 110-2h5.586l-1.293-1.293a1 1 0 111.414-1.414l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L13.586 15H8z"/></svg>
      </button>
    </div>

    <!-- Mode Switcher -->
    <div class="tabs tabs-boxed tabs-sm">
      <button type="button" class="tab {mode === 'visual' ? 'tab-active' : ''}" onclick={() => switchMode('visual')} aria-label="Visual Mode">Visual</button>
      <button type="button" class="tab {mode === 'text' ? 'tab-active' : ''}" onclick={() => switchMode('text')} aria-label="Text Mode">Text</button>
    </div>
  </div>

  <!-- Editor Area -->
  <div class="bg-base-100">
    {#if mode === 'visual'}
      <div bind:this={editorElement} class="overflow-auto"></div>
    {:else}
      <textarea 
        class="textarea w-full min-h-[400px] rounded-none border-0 font-mono text-sm p-4 focus:outline-none" 
        value={textContent}
        oninput={handleTextChange}
        placeholder="Paste your HTML here..."
      ></textarea>
    {/if}
  </div>
</div>

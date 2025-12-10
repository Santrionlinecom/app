<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Link from '@tiptap/extension-link';
  import Image from '@tiptap/extension-image';
  import TextAlign from '@tiptap/extension-text-align';
  import Placeholder from '@tiptap/extension-placeholder';
  import EditorToolbar from './editor/EditorToolbar.svelte';

  let { value = $bindable(''), placeholder = 'Tulis konten di sini...' } = $props();

  let editor: Editor | null = $state(null);
  let editorElement: HTMLElement | null = $state(null);
  let mode = $state<'visual' | 'text'>('visual');
  let textContent = $state(value);

  onMount(() => {
    if (!editorElement) return;

    const instance = new Editor({
      element: editorElement,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3]
          }
        }),
        Link.configure({ openOnClick: false }),
        Image,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Placeholder.configure({ placeholder })
      ],
      content: value,
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none p-4 focus:outline-none min-h-[400px]'
        }
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        if (html !== value) {
          value = html;
          textContent = html;
        }
      }
    });

    editor = instance;
  });

  onDestroy(() => {
    editor?.destroy();
    editor = null;
  });

  // Sinkronisasi perubahan dari luar -> editor (hindari loop dengan pengecekan isi)
  $effect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
      textContent = value;
    }
  });

  function switchMode(newMode: 'visual' | 'text') {
    if (newMode === mode) return;

    if (newMode === 'text') {
      textContent = editor?.getHTML() ?? textContent;
      value = textContent;
    } else if (editor) {
      editor.commands.setContent(textContent, { emitUpdate: false });
      value = textContent;
    }

    mode = newMode;
  }

  function handleTextInput(event: Event) {
    const newValue = (event.target as HTMLTextAreaElement).value;
    textContent = newValue;
    value = newValue;
  }

  function handleAddImage(event: CustomEvent<{ url: string }>) {
    const url = event.detail?.url;
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }
</script>

<div class="border border-gray-300 bg-white rounded">
  <div class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 gap-2">
    {#if editor}
      <EditorToolbar {editor} disabled={mode === 'text'} on:addImage={handleAddImage} />
    {/if}

    <div class="flex items-center gap-1 text-sm">
      <button
        type="button"
        class="px-3 py-2 rounded-t border-x border-t border-gray-300"
        class:bg-white={mode === 'visual'}
        class:bg-gray-100={mode !== 'visual'}
        onclick={() => switchMode('visual')}
      >
        Visual
      </button>
      <button
        type="button"
        class="px-3 py-2 rounded-t border-x border-t border-gray-300"
        class:bg-white={mode === 'text'}
        class:bg-gray-100={mode !== 'text'}
        onclick={() => switchMode('text')}
      >
        Text
      </button>
    </div>
  </div>

  <div class="bg-white">
    <div bind:this={editorElement} class="min-h-[400px]" class:hidden={mode === 'text'}></div>
    <textarea
      class="w-full min-h-[400px] p-4 font-mono text-sm outline-none"
      class:hidden={mode === 'visual'}
      value={textContent}
      oninput={handleTextInput}
      spellcheck="false"
    ></textarea>
  </div>
</div>

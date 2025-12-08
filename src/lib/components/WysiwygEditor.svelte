<script lang="ts">
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Link from '@tiptap/extension-link';
	import Image from '@tiptap/extension-image';
	import TextAlign from '@tiptap/extension-text-align';
	import EditorToolbar from './editor/EditorToolbar.svelte';

	let { value = $bindable('') } = $props();

	let editor: Editor | null = $state(null);
	let editorElement: HTMLElement | null = $state(null);
	let mode = $state<'visual' | 'text'>('visual');
	let textContent = $state(value);

	$effect(() => {
		editor = new Editor({
			element: editorElement!,
			extensions: [
				StarterKit.configure({
					heading: {
						levels: [1, 2, 3]
					}
				}),
				Link.configure({ openOnClick: false }),
				Image,
				TextAlign.configure({
					types: ['heading', 'paragraph']
				})
			],
			content: value,
			editorProps: {
				attributes: {
					class: 'prose max-w-none focus:outline-none'
				}
			},
			onUpdate: ({ editor }) => {
				const html = editor.getHTML();
				value = html;
				textContent = html;
			}
		});

		return () => {
			editor?.destroy();
		};
	});

	$effect(() => {
		if (editor && value !== editor.getHTML()) {
			editor.commands.setContent(value, { emitUpdate: false });
			textContent = value;
		}
	});

	function switchMode(newMode: 'visual' | 'text') {
		if (newMode === 'text' && mode === 'visual') {
			textContent = editor?.getHTML() ?? '';
		} else if (newMode === 'visual' && mode === 'text') {
			editor?.commands.setContent(textContent);
		}
		mode = newMode;
	}

	function handleTextChange(e: Event) {
		const newContent = (e.target as HTMLTextAreaElement).value;
		textContent = newContent;
		value = newContent;
	}

	function handleAddImage({ detail: { url } }: CustomEvent<{ url: string }>) {
		if (url) {
			editor?.chain().focus().setImage({ src: url }).run();
		}
	}
</script>

<div class="bg-gray-200 p-4 sm:p-8 rounded-lg">
	<div class="relative">
		<!-- Mode Switcher -->
		<div class="absolute top-2 right-2 z-10">
			<div class="tabs tabs-boxed tabs-sm bg-gray-200">
				<button
					type="button"
					class="tab {mode === 'visual' ? 'tab-active !bg-white' : ''}"
					onclick={() => switchMode('visual')}>Visual</button
				>
				<button
					type="button"
					class="tab {mode === 'text' ? 'tab-active !bg-white' : ''}"
					onclick={() => switchMode('text')}>Text</button
				>
			</div>
		</div>

		{#if editor}
			<EditorToolbar {editor} on:addImage={handleAddImage} />
		{/if}

		<!-- Editor Area -->
		<div class="bg-white shadow-lg rounded-b-md">
			{#if mode === 'visual'}
				<div bind:this={editorElement} class="p-8 min-h-[500px] overflow-auto"></div>
			{:else}
				<textarea
					class="textarea w-full min-h-[500px] rounded-none border-0 font-mono text-sm p-8 focus:outline-none bg-white"
					value={textContent}
					oninput={handleTextChange}
					placeholder="Tulis atau tempelkan HTML di sini..."
				></textarea>
			{/if}
		</div>
	</div>
</div>

<script lang="ts">
	import type { Editor } from '@tiptap/svelte';
	import { createEventDispatcher } from 'svelte';

	let { editor }: { editor: Editor } = $props();

	const dispatch = createEventDispatcher<{
		addImage: { url: string };
	}>();

	let fileInput: HTMLInputElement;

	const handleFileSelect = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		const formData = new FormData();
		formData.append('file', file);

		try {
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Upload failed');
			}

			const { url } = await response.json();
			dispatch('addImage', { url });
		} catch (error) {
			console.error('Error uploading image:', error);
			// Handle error (e.g., show a notification)
		}
	};

	const openFileDialog = () => {
		fileInput.click();
	};
</script>

<div class="toolbar bg-gray-100 border border-gray-300 rounded-t-md p-1 flex flex-col gap-1">
	<!-- Row 1 -->
	<div class="flex items-center gap-1">
		<!-- Paragraph/Heading Dropdown -->
		<select
			class="border border-gray-300 rounded-sm px-2 py-1 text-sm"
			onchange={(e) => {
				const level = parseInt((e.target as HTMLSelectElement).value);
				if (level === 0) {
					editor.chain().focus().setParagraph().run();
				} else {
					editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
				}
			}}
		>
			<option value="0">Paragraf</option>
			<option value="1">Heading 1</option>
			<option value="2">Heading 2</option>
			<option value="3">Heading 3</option>
		</select>

		<!-- Text Formatting -->
		<button
			class:active={editor.isActive('bold')}
			onclick={() => editor.chain().focus().toggleBold().run()}
		>
			B
		</button>
		<button
			class:active={editor.isActive('italic')}
			onclick={() => editor.chain().focus().toggleItalic().run()}
		>
			I
		</button>

		<!-- Lists -->
		<button
			class:active={editor.isActive('bulletList')}
			onclick={() => editor.chain().focus().toggleBulletList().run()}
		>
			&bull; List
		</button>
		<button
			class:active={editor.isActive('orderedList')}
			onclick={() => editor.chain().focus().toggleOrderedList().run()}
		>
			1. List
		</button>

		<!-- Blockquote -->
		<button
			class:active={editor.isActive('blockquote')}
			onclick={() => editor.chain().focus().toggleBlockquote().run()}
		>
			&ldquo;
		</button>

		<!-- Alignment -->
		<button onclick={() => editor.chain().focus().setTextAlign('left').run()}>L</button>
		<button onclick={() => editor.chain().focus().setTextAlign('center').run()}>C</button>
		<button onclick={() => editor.chain().focus().setTextAlign('right').run()}>R</button>

		<!-- Link -->
		<button
			onclick={() => {
				const url = prompt('Enter URL:');
				if (url) {
					editor.chain().focus().toggleLink({ href: url }).run();
				}
			}}
		>
			Link
		</button>
	</div>

	<!-- Row 2 -->
	<div class="flex items-center gap-1 pt-1 border-t border-gray-200">
		<button class="flex items-center gap-2 px-2 py-1 text-sm" onclick={openFileDialog}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-image"
				><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path
					d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
				/></svg
			>
			Tambahkan Media
		</button>
		<input type="file" bind:this={fileInput} onchange={handleFileSelect} class="hidden" accept="image/*" />
	</div>
</div>

<style>
	.toolbar button {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
	}
	.toolbar button:hover {
		background-color: #e0e0e0;
		border-color: #ccc;
	}
	.toolbar button.active {
		background-color: #d1eaff;
		border-color: #a5cfff;
	}
</style>

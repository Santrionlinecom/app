<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export type SelectOption = {
		value: string;
		label: string;
		emoji?: string;
		disabled?: boolean;
	};

	export let options: SelectOption[] = [];
	export let value = '';
	export let placeholder = 'Pilih...';
	export let searchPlaceholder = 'Ketik untuk mencari...';
	export let emptyText = 'Tidak ada data';
	export let disabled = false;
	export let name: string | undefined = undefined;
	export let id: string | undefined = undefined;
	export let required = false;
	export let wrapperClass = '';
	export let inputClass = '';
	export let listClass = '';

	const dispatch = createEventDispatcher<{
		change: { value: string; option?: SelectOption };
	}>();

	let isOpen = false;
	let query = '';
	let highlightedIndex = -1;
	let hasTyped = false;
	let root: HTMLDivElement | null = null;
	let inputEl: HTMLInputElement | null = null;
	$: listId = id ? `${id}-listbox` : undefined;

	const displayLabel = (option?: SelectOption | null) =>
		option ? `${option.emoji ? `${option.emoji} ` : ''}${option.label}`.trim() : '';

	$: selectedOption = options.find((opt) => opt.value === value) ?? null;
	$: if (!isOpen) {
		query = selectedOption ? displayLabel(selectedOption) : '';
	}

	$: normalizedQuery = query.trim().toLowerCase();
	$: filteredOptions = hasTyped
		? options.filter((opt) => opt.label.toLowerCase().includes(normalizedQuery))
		: options;

	const openList = () => {
		if (disabled) return;
		isOpen = true;
		hasTyped = false;
		highlightedIndex = Math.max(
			0,
			filteredOptions.findIndex((opt) => opt.value === value)
		);
	};

	const closeList = () => {
		isOpen = false;
		hasTyped = false;
		highlightedIndex = -1;
	};

	const selectOption = (option: SelectOption) => {
		if (option.disabled) return;
		value = option.value;
		query = displayLabel(option);
		dispatch('change', { value, option });
		closeList();
	};

	const handleInput = (event: Event) => {
		if (disabled) return;
		query = (event.currentTarget as HTMLInputElement).value;
		hasTyped = true;
		isOpen = true;
		highlightedIndex = 0;
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (disabled) return;
		if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
			event.preventDefault();
			openList();
			return;
		}
		if (!isOpen) return;
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			highlightedIndex = Math.min(highlightedIndex + 1, filteredOptions.length - 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			highlightedIndex = Math.max(highlightedIndex - 1, 0);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			const option = filteredOptions[highlightedIndex];
			if (option) selectOption(option);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			closeList();
			inputEl?.blur();
		}
	};

	const handleFocus = () => {
		if (disabled) return;
		openList();
		query = '';
	};

	const handleOutsideClick = (event: MouseEvent) => {
		if (!root) return;
		if (event.target instanceof Node && root.contains(event.target)) return;
		closeList();
	};

	onMount(() => {
		document.addEventListener('mousedown', handleOutsideClick);
		return () => document.removeEventListener('mousedown', handleOutsideClick);
	});
</script>

<div class={`relative w-full ${wrapperClass}`} bind:this={root}>
	{#if name}
		<input type="hidden" name={name} value={value} {required} />
	{/if}
	<input
		bind:this={inputEl}
		id={id}
		class={`input input-bordered w-full ${disabled ? 'bg-gray-100 text-gray-400' : ''} ${inputClass}`}
		type="text"
		placeholder={placeholder}
		autocomplete="off"
		{disabled}
		{required}
		bind:value={query}
		on:input={handleInput}
		on:focus={handleFocus}
		on:keydown={handleKeydown}
		role="combobox"
		aria-expanded={isOpen}
		aria-haspopup="listbox"
		aria-controls={listId}
		aria-autocomplete="list"
	/>
	{#if isOpen}
		<div
			id={listId}
			role="listbox"
			class={`absolute z-40 mt-2 w-full rounded-xl border bg-white shadow-lg ${listClass}`}
		>
			<div class="px-3 pt-2 text-[11px] text-slate-400">{searchPlaceholder}</div>
			<div class="max-h-64 overflow-auto py-1">
				{#if filteredOptions.length === 0}
					<div class="px-4 py-3 text-sm text-slate-500">{emptyText}</div>
				{:else}
					{#each filteredOptions as option, index}
						<button
							type="button"
							role="option"
							aria-selected={index === highlightedIndex}
							class={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${
								index === highlightedIndex ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
							} ${option.disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-emerald-50'}`}
							on:mousedown|preventDefault={() => selectOption(option)}
						>
							{#if option.emoji}
								<span class="text-base leading-none">{option.emoji}</span>
							{/if}
							<span class="truncate">{option.label}</span>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

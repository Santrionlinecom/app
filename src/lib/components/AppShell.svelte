<script>
	import Sidebar from './Sidebar.svelte';
	import TopBar from './TopBar.svelte';

	export let title = 'Dashboard';
	export let subtitle = '';
</script>

<div class="min-h-screen bg-so-cream lg:flex">
	<Sidebar />
	<main class="min-w-0 flex-1 pb-24 lg:pb-0">
		<TopBar {title} {subtitle} />
		<div class="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
			<slot />
		</div>
	</main>
</div>

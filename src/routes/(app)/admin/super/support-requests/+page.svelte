<script lang="ts">
	import type { PageData } from './$types'; export let data:PageData;
	const next:Record<string,string[]>={pending_contact:['contacted','cancelled'],contacted:['scheduled','cancelled'],scheduled:['completed','cancelled'],completed:[],cancelled:[]};
</script>
<svelte:head><title>Antrean Bantuan SantriPrint</title></svelte:head>
<div class="mx-auto max-w-6xl space-y-6 p-6"><h1 class="text-2xl font-bold">Antrean Bantuan SantriPrint</h1>
<nav class="flex flex-wrap gap-2">{#each ['pending_contact','contacted','scheduled','completed','cancelled'] as status}<a class="btn btn-sm {data.status===status?'btn-primary':'btn-outline'}" href="?status={status}">{status}</a>{/each}</nav>
<div class="overflow-x-auto rounded-2xl border bg-white"><table class="table"><thead><tr><th>Referensi</th><th>Paket</th><th>Status</th><th>Diperbarui</th><th>Aksi</th></tr></thead><tbody>{#each data.requests as item}<tr><td>{item.referenceCode}</td><td>{item.productTitle}</td><td>{item.status}</td><td>{new Date(Number(item.updatedAt)).toLocaleString('id-ID')}</td><td class="flex gap-2">{#each next[item.status]??[] as target}<form method="POST" action="?/transition"><input type="hidden" name="id" value={item.id}><input type="hidden" name="expectedStatus" value={item.status}><input type="hidden" name="nextStatus" value={target}><button class="btn btn-xs btn-outline">{target}</button></form>{/each}</td></tr>{/each}</tbody></table></div></div>

<script lang="ts">
	export let form;
</script>

<div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
	<div class="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
		<div class="flex justify-center items-center gap-2 text-green-700 font-bold text-2xl mb-2">
			<img src="/logo-santri.png" alt="Santri Online" class="h-12 w-auto" loading="lazy" />
		</div>
		<h2 class="text-3xl font-extrabold text-slate-900">Reset Password</h2>
		<p class="mt-2 text-sm text-slate-600">
			Masukkan email yang terdaftar untuk menerima tautan reset password.
		</p>
	</div>

	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-100">
			{#if form?.message}
				<div
					role="alert"
					class={`alert ${form?.success ? 'alert-success' : 'alert-error'} mb-6 text-sm py-3 rounded-lg shadow-sm`}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="stroke-current shrink-0 h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>{form.message}</span>
				</div>
			{/if}

			<form method="POST" class="space-y-5">
				<div class="form-control w-full">
					<label class="label" for="email">
						<span class="label-text text-slate-700 font-medium">Email</span>
					</label>
					<input
						id="email"
						name="email"
						type="email"
						placeholder="nama@email.com"
						required
						class="input input-bordered w-full bg-slate-50 focus:bg-white focus:border-blue-500 h-12 rounded-lg"
					/>
				</div>

				<div>
					<button
						type="submit"
						class="btn btn-primary w-full bg-green-700 border-none hover:bg-green-800 normal-case text-lg font-bold h-12 rounded-xl shadow-md hover:shadow-lg transition-all"
					>
						Kirim Tautan Reset
					</button>
				</div>
			</form>

			<div class="mt-6 text-sm text-center">
				<a href="/auth" class="text-blue-600 hover:text-blue-500 hover:underline">Kembali ke login</a>
			</div>
		</div>
	</div>
</div>

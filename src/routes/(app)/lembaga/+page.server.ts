import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type AddonStatus = {
	tipeAddon: string;
	status: string;
	berlakuHingga: number | null;
};

type LembagaRow = {
	id: string;
	name: string;
	type: string;
	slug: string | null;
	status: string | null;
	address: string | null;
	city: string | null;
	logoUrl: string | null;
	isAktif: number | null;
	createdAt: number | null;
	addonRaw: string | null;
};

const parseAddonRaw = (value?: string | null): AddonStatus[] => {
	if (!value) return [];

	return value
		.split('|')
		.map((item) => {
			const [tipeAddon, status, berlakuHinggaRaw] = item.split(':');
			const berlakuHingga = berlakuHinggaRaw?.trim() ? Number(berlakuHinggaRaw) : null;
			return {
				tipeAddon,
				status,
				berlakuHingga:
					typeof berlakuHingga === 'number' && Number.isFinite(berlakuHingga) ? berlakuHingga : null
			};
		})
		.filter((item) => item.tipeAddon && item.status);
};

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	if (!locals.db) {
		throw error(500, 'Layanan data tidak tersedia');
	}

	const nowMs = Date.now();
	const nowSeconds = Math.floor(nowMs / 1000);
	const { results } = await locals.db
		.prepare(
			`SELECT
				o.id,
				o.name,
				o.type,
				o.slug,
				o.status,
				o.address,
				o.city,
				o.logo_url AS logoUrl,
				o.is_aktif AS isAktif,
				o.created_at AS createdAt,
				GROUP_CONCAT(a.tipe_addon || ':' || a.status || ':' || COALESCE(a.berlaku_hingga, ''), '|') AS addonRaw
			 FROM organizations o
			 LEFT JOIN addon_lembaga a
			   ON a.lembaga_id = o.id
			  AND a.status = 'aktif'
			  AND (
				a.berlaku_hingga IS NULL
				OR a.berlaku_hingga > ?
				OR (a.berlaku_hingga < 100000000000 AND a.berlaku_hingga > ?)
			  )
			 WHERE o.akun_admin_id = ?
			 GROUP BY
				o.id,
				o.name,
				o.type,
				o.slug,
				o.status,
				o.address,
				o.city,
				o.logo_url,
				o.is_aktif,
				o.created_at
			 ORDER BY COALESCE(o.is_aktif, 0) DESC, o.created_at DESC`
		)
		.bind(nowMs, nowSeconds, locals.user.id)
		.all<LembagaRow>();

	return {
		lembagaList: (results ?? []).map((item) => ({
			id: item.id,
			name: item.name,
			type: item.type,
			slug: item.slug,
			status: item.status,
			address: item.address,
			city: item.city,
			logoUrl: item.logoUrl,
			isAktif: item.isAktif,
			createdAt: item.createdAt,
			addons: parseAddonRaw(item.addonRaw)
		}))
	};
};

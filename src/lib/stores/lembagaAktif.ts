import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';

const STORAGE_KEY = 'santrionline:lembaga-aktif-id';

export type LembagaAktif = {
	id: string;
	name: string;
	type: string;
	slug?: string | null;
	status?: string | null;
	logoUrl?: string | null;
	isAktif?: boolean | number | null;
};

const normalizeId = (id?: string | null) => id?.trim() || null;

const readPersistedId = () => {
	if (!browser) return null;
	try {
		return normalizeId(window.localStorage.getItem(STORAGE_KEY));
	} catch {
		return null;
	}
};

const persistId = (id?: string | null) => {
	if (!browser) return;
	try {
		const normalized = normalizeId(id);
		if (normalized) {
			window.localStorage.setItem(STORAGE_KEY, normalized);
		} else {
			window.localStorage.removeItem(STORAGE_KEY);
		}
	} catch {
		// localStorage can be unavailable in private or restricted browser modes.
	}
};

const pickInitialLembaga = (
	lembagaList: LembagaAktif[],
	preferredId?: string | null
): LembagaAktif | null => {
	const persistedId = readPersistedId();
	const requestedId = normalizeId(persistedId) ?? normalizeId(preferredId);
	if (requestedId) {
		const match = lembagaList.find((item) => item.id === requestedId);
		if (match) return match;
	}
	return lembagaList[0] ?? null;
};

const createLembagaAktifStore = () => {
	const { subscribe, set } = writable<LembagaAktif | null>(null);

	return {
		subscribe,
		set: (lembaga: LembagaAktif | null) => {
			set(lembaga);
			persistId(lembaga?.id);
		},
		clear: () => {
			set(null);
			persistId(null);
		},
		initialize: (lembagaList: LembagaAktif[], preferredId?: string | null) => {
			const selected = pickInitialLembaga(lembagaList, preferredId);
			set(selected);
			persistId(selected?.id);
		},
		select: (lembagaId: string, lembagaList: LembagaAktif[]) => {
			const selected = lembagaList.find((item) => item.id === lembagaId) ?? null;
			set(selected);
			persistId(selected?.id);
			return selected;
		}
	};
};

export const lembagaAktif = createLembagaAktifStore();
export const lembagaAktifId = derived(lembagaAktif, ($lembagaAktif) => $lembagaAktif?.id ?? null);

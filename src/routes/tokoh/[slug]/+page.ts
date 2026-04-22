import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import {
	getSanadAncestors,
	getSanadDescendants,
	getSanadDynasties,
	getSanadFigure,
	getSanadFiguresByGeneration,
	wahyuPrelude
} from '$lib/data/sanad';

export const load: PageLoad = ({ params }) => {
	const figure = getSanadFigure(params.slug);

	if (!figure) {
		throw error(404, 'Tokoh tidak ditemukan');
	}

	const peers = getSanadFiguresByGeneration(figure.generation).filter((item) => {
		if (item.slug === figure.slug) {
			return false;
		}

		if (!figure.cluster) {
			return true;
		}

		return item.cluster === figure.cluster;
	});

	return {
		figure,
		ancestors: getSanadAncestors(figure),
		descendants: getSanadDescendants(figure),
		dynasties: getSanadDynasties(figure),
		peers,
		wahyuPrelude: figure.slug === 'muhammad' ? wahyuPrelude : null
	};
};

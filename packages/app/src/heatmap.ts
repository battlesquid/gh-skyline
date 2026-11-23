import { HEATMAP_COLORS } from "./api/constants";

export const getHeatmapColors = <T>(
	items: readonly T[],
	valueGetter: (item: T) => number,
): string[] => {
	const values = items.map(valueGetter);
	const max = values.reduce((peak, value) => Math.max(peak, value), 0);
	const levels = HEATMAP_COLORS.length;
	return values.map((value) => {
		const level = value === 0 ? 0 : Math.ceil((value / max) * levels) - 1;
		return HEATMAP_COLORS[level];
	});
};

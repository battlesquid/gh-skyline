import type { Vec2 } from "manifold-3d";
import opentype from "opentype.js";
import { pointsOnPath } from "points-on-path";
import { preload, suspend } from "suspend-react";

const FONT_CACHE = new Map<string, opentype.Font>();

export const toPolygons = (
	font: opentype.Font,
	text: string,
	fontSize: number = 1,
) => {
	const paths = font.getPaths(text, 0, fontSize, fontSize);
	const svgs = paths.map((path) => path.toPathData(5));
	return svgs.flatMap((s) => {
		const result = pointsOnPath(s, 0.0001, 0.0001);
		return result.map((point) => point.map((p) => [p[0], p[1]] as Vec2));
	});
};

const loader = async (url: string) => {
	const cachedFont = FONT_CACHE.get(url);
	if (cachedFont !== undefined) {
		return cachedFont;
	}
	const response = await fetch(url);
	const buffer = await response.arrayBuffer();
	const font = opentype.parse(buffer);
	FONT_CACHE.set(url, font);
	return font;
};

export function useTTFLoader(url: string) {
	return suspend(loader, [url]);
}

useTTFLoader.preload = (url: string) => preload(loader, [url]);

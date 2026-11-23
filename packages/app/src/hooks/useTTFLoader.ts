import type { Vec2 } from "manifold-3d";
import opentype from "opentype.js";
import { pointsOnPath } from "points-on-path";
import { useEffect, useState } from "react";

const FONT_CACHE = new Map<string, opentype.Font>();
const loadingFonts = new Map<string, Promise<opentype.Font>>();

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

async function loadFont(url: string) {
	const cachedFont = FONT_CACHE.get(url);
	if (cachedFont) return cachedFont;
	const pending = loadingFonts.get(url);
	if (pending) return pending;

	const load = fetch(url)
		.then(async (response) => {
			if (!response.ok)
				throw new Error(`Could not load font (${response.status}).`);
			const font = opentype.parse(await response.arrayBuffer());
			FONT_CACHE.set(url, font);
			return font;
		})
		.finally(() => loadingFonts.delete(url));
	loadingFonts.set(url, load);
	return load;
}

export function preloadFont(url: string) {
	void loadFont(url).catch((error: unknown) =>
		console.error("Could not preload font", error),
	);
}

export function useSkylineFont(url: string) {
	const [result, setResult] = useState<{
		url: string;
		font?: opentype.Font;
		error?: string;
	}>();
	useEffect(() => {
		if (FONT_CACHE.has(url)) return;
		let cancelled = false;
		void loadFont(url).then(
			(font) => {
				if (!cancelled) setResult({ url, font });
			},
			(error: unknown) => {
				if (!cancelled)
					setResult({
						url,
						error:
							error instanceof Error ? error.message : "Could not load font.",
					});
			},
		);
		return () => {
			cancelled = true;
		};
	}, [url]);
	const font =
		FONT_CACHE.get(url) ?? (result?.url === url ? result.font : undefined);
	return {
		font,
		error: font ? undefined : result?.url === url ? result.error : undefined,
	};
}

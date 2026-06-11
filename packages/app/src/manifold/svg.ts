import type { Vec2 } from "manifold-3d";
import { pointsOnPath } from "points-on-path";

/**
 * Extract every <path> "d" attribute from an SVG string.
 */
const extractPathData = (svg: string): string[] => {
	const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
	if (doc.querySelector("parsererror") !== null) {
		throw new Error("Invalid SVG markup");
	}
	return Array.from(doc.querySelectorAll("path"))
		.map((path) => path.getAttribute("d"))
		.filter((d): d is string => d !== null && d.trim() !== "");
};

/**
 * Convert an SVG string into manifold polygons (Vec2[][]) suitable for a
 * CrossSection. The result is centered on the origin and uniformly scaled so its
 * height equals `targetHeight`. Points keep SVG's y-down convention so they
 * match opentype's `toPolygons` output and orient correctly once the frustum
 * applies its shared `.rotate([..., 0, 180])`.
 *
 * Construct the CrossSection with the "EvenOdd" fill rule so inner holes render
 * correctly. Only filled <path> geometry is converted; strokes and primitive
 * shapes (rect/circle/etc.) are ignored.
 */
export const svgToPolygons = (svg: string, targetHeight: number): Vec2[][] => {
	const pathData = extractPathData(svg);
	if (pathData.length === 0) {
		throw new Error("SVG contains no path data");
	}

	const contours: Vec2[][] = [];
	for (const d of pathData) {
		for (const polyline of pointsOnPath(d, 0.0001, 0.0001)) {
			if (polyline.length === 0) {
				continue;
			}
			contours.push(polyline.map((p) => [p[0], p[1]] as Vec2));
		}
	}

	if (contours.length === 0) {
		throw new Error("Unable to derive polygons from SVG");
	}

	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;
	for (const contour of contours) {
		for (const [x, y] of contour) {
			if (x < minX) minX = x;
			if (y < minY) minY = y;
			if (x > maxX) maxX = x;
			if (y > maxY) maxY = y;
		}
	}

	const height = maxY - minY;
	if (height <= 0) {
		throw new Error("SVG has zero height");
	}

	const scale = targetHeight / height;
	const cx = (minX + maxX) / 2;
	const cy = (minY + maxY) / 2;

	return contours.map((contour) =>
		contour.map(([x, y]) => [(x - cx) * scale, (y - cy) * scale] as Vec2),
	);
};

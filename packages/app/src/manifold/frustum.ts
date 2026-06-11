import type { Manifold as ManifoldType, Vec2, Vec3 } from "manifold-3d";
import { type BufferGeometry, Vector3 } from "three";
import { DEFAULT_INPUT_PARAMETERS } from "@/stores/parameters";
import { wasm } from "./module";
import { boundingBoxDimensions, centerManifold, mesh2geometry } from "./utils";

const { CrossSection } = wasm;

export interface ManifoldDimensions {
	width: number;
	length: number;
	height: number;
}

export interface ManifoldFrustumArgs extends ManifoldDimensions {
	lengthPadding: number;
	widthPadding: number;
}

export interface ManifoldFrustumText {
	points: Vec2[][];
	offset?: number;
}

export type ManifoldFrustumSide = "length" | "width";

export const getSlopeAngle = (
	frustum: ManifoldFrustumArgs,
	side: ManifoldFrustumSide = "length",
): number => {
	const { width, length, widthPadding, lengthPadding, height } = frustum;

	const baseWidth = width + widthPadding;
	const baseLength = length + lengthPadding;

	// Calculate the horizontal distance from center to edge at the base vs top
	const baseDimension = side === "width" ? baseWidth : baseLength;
	const topDimension = side === "width" ? width : length;

	// The horizontal difference between base and top edge
	const horizontalDifference = (baseDimension - topDimension) / 2;

	// Calculate the slope angle using arctangent
	const slopeAngle = Math.atan(horizontalDifference / height);

	return slopeAngle;
};

const toDeg = (rad: number): number => {
	return rad * (180 / Math.PI);
};

export const getNormal = (frustum: ManifoldFrustumArgs): Vec3 => {
	const angle = getSlopeAngle(frustum);
	return [0, Math.cos(angle), Math.sin(angle)];
};

export const getThreeNormal = (frustum: ManifoldFrustumArgs): Vector3 => {
	const normal = getNormal(frustum);
	return new Vector3(normal[0], normal[2], normal[1]);
};

export interface BaseFrustum {
	angle: number;
}

export interface ManifoldFrustum extends BaseFrustum {
	manifold: ManifoldType;
	normal: Vec3;
}

export interface ThreeFrustum extends BaseFrustum {
	geometry: BufferGeometry;
	normal: Vector3;
}

/**
 * Although it causes no functional bugs, placing the slot perfectly against the frustum surface causes visual artifacts.
 * Simply adding a very small amount of padding width to the slot fixes this
 */
export const SUBTRACT_VISIBILITY_PADDING = 0.0002;

export const makeManifoldFrustum = (
	frustum: ManifoldFrustumArgs,
	name: ManifoldFrustumText,
	year: ManifoldFrustumText,
	logo: ManifoldFrustumText,
	inset: boolean,
): ManifoldFrustum => {
	const { length, width, lengthPadding, widthPadding, height } = frustum;

	const baseLength = length + lengthPadding;
	const baseWidth = width + widthPadding;
	const topLengthScale = length / baseLength;
	const topWidthScale = width / baseWidth;

	const nameSlotOffset = name.offset ?? 0;
	const yearSlotOffset = year.offset ?? 0;
	const logoSlotOffset = logo.offset ?? 0;

	const angle = -getSlopeAngle(frustum);
	const normal = getNormal(frustum);

	const operation = inset ? "subtract" : "add";

	const EXTRUSION_LEN = 1;
	const TRANSLATE_DIR = inset ? -1 : 1;
	const TRANSLATE_LEN =
		TRANSLATE_DIR * (EXTRUSION_LEN / 2) + SUBTRACT_VISIBILITY_PADDING;

	const nameExtrusion = centerManifold(
		new CrossSection(name.points)
			.extrude(EXTRUSION_LEN)
			.rotate([toDeg(angle) - 90, 0, 180]),
	);
	const yearExtrusion = centerManifold(
		new CrossSection(year.points)
			.extrude(EXTRUSION_LEN)
			.rotate([toDeg(angle) - 90, 0, 180]),
	);

	const nameDimensions = boundingBoxDimensions(nameExtrusion.boundingBox());
	const yearDimensions = boundingBoxDimensions(yearExtrusion.boundingBox());

	const nameSlotPosition = [
		baseWidth / 2 -
			nameDimensions.width / 2 -
			(nameSlotOffset + widthPadding / 2) +
			TRANSLATE_LEN * normal[0],
		length / 2 + lengthPadding / 4 + TRANSLATE_LEN * normal[1],
		TRANSLATE_LEN * normal[2],
	] as const;

	// right-side anchored
	const yearSlotPosition = [
		-baseWidth / 2 +
			yearDimensions.width / 2 +
			(yearSlotOffset + widthPadding / 2) +
			TRANSLATE_LEN * normal[0],
		length / 2 + lengthPadding / 4 + TRANSLATE_LEN * normal[1],
		TRANSLATE_LEN * normal[2],
	] as const;

	let manifold = CrossSection.square([baseWidth, baseLength], true)
		.extrude(height, 0, 0, [topWidthScale, topLengthScale], true)
		[operation](nameExtrusion.translate(nameSlotPosition))
		[operation](yearExtrusion.translate(yearSlotPosition));

	// The logo is an arbitrary user SVG, so it uses the EvenOdd fill rule to
	// honour inner holes. Right-side anchored on the same front face as the
	// text, sitting outboard of the (right-anchored) name.
	if (logo.points.length > 0) {
		const logoExtrusion = centerManifold(
			new CrossSection(logo.points, "EvenOdd")
				.extrude(EXTRUSION_LEN)
				.rotate([toDeg(angle) - 90, 0, 180]),
		);
		const logoDimensions = boundingBoxDimensions(logoExtrusion.boundingBox());
		const logoSlotPosition = [
			baseWidth / 2 -
				logoDimensions.width / 2 -
				(logoSlotOffset + widthPadding / 2) +
				TRANSLATE_LEN * normal[0],
			length / 2 + lengthPadding / 4 + TRANSLATE_LEN * normal[1],
			TRANSLATE_LEN * normal[2],
		] as const;
		manifold = manifold[operation](logoExtrusion.translate(logoSlotPosition));
	}

	return { manifold, angle, normal };
};

export const makeThreeFrustum = (
	...args: Parameters<typeof makeManifoldFrustum>
): ThreeFrustum => {
	const { manifold, angle } = makeManifoldFrustum(...args);
	const normal = getThreeNormal(args[0]);
	const geometry = mesh2geometry(manifold.getMesh());
	return { angle, geometry, normal };
};

export const emptyThreeFrustum = (): ThreeFrustum =>
	makeThreeFrustum(
		{
			width: 0,
			length: 0,
			height: 0,
			widthPadding: 0,
			lengthPadding: 0,
		},
		{
			points: [],
		},
		{
			points: [],
		},
		{
			points: [],
		},
		DEFAULT_INPUT_PARAMETERS.insetText,
	);

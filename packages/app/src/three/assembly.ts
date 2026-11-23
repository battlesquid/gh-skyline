import type { Vec3 } from "manifold-3d";
import { Box3, type BufferGeometry, Matrix4, Vector3 } from "three";
import {
	CARRIER_THICKNESS,
	type SolidPart,
	type TextPlacement,
} from "../manifold/parts";
import type { TowerPaint, TowerSettings, TowerYear } from "./tower_parts";
import type { FrontItem } from "./types";

export type PlacedLogo = {
	geometries: readonly BufferGeometry[];
	bounds: Box3;
	angle: number;
	position: Vec3;
};

export type FrontPart =
	| { kind: "name" | "year"; text: TextPlacement }
	| { kind: "logo"; logo: PlacedLogo };

export interface BasePlacement {
	year: number | null;
	solid: SolidPart;
	front: readonly FrontPart[];
	z: number;
	inset: boolean;
	shift: number;
}

export interface YearPlacement {
	year: TowerYear;
	z: number;
	bounds: Box3;
}

export interface SkylineAssembly {
	bases: readonly BasePlacement[];
	years: readonly YearPlacement[];
	settings: TowerSettings;
	paint: TowerPaint;
	baseColor: string;
	carrierFootprint: Box3;
	bounds: Box3;
}

export type ExportTarget =
	| "assembled"
	| "towers"
	| "base"
	| FrontItem
	| `tile:${number}`;

export function placedBounds(bounds: Box3, angle: number, position: Vec3) {
	const matrix = new Matrix4().makeRotationX(angle).setPosition(...position);
	return bounds.clone().applyMatrix4(matrix);
}

export function frontBounds(part: FrontPart) {
	if (part.kind === "logo")
		return placedBounds(part.logo.bounds, part.logo.angle, part.logo.position);
	const { solid, angle, position } = part.text;
	return placedBounds(solid.bounds, angle, position);
}

export function assemblyBounds(
	bases: readonly BasePlacement[],
	years: readonly YearPlacement[],
	target: "assembled" | "base" = "assembled",
) {
	const bounds = new Box3();
	const offset = new Vector3();
	for (const { solid, z, shift, front, inset } of bases) {
		bounds.union(solid.bounds.clone().translate(offset.set(0, 0, z + shift)));
		if (target === "base") continue;
		for (const part of front) {
			if (inset && part.kind !== "logo") continue;
			bounds.union(
				frontBounds(part).translate(
					offset.set(0, 0, z + (part.kind === "logo" ? 0 : shift)),
				),
			);
		}
	}
	if (target === "assembled") {
		for (const year of years) {
			if (!year.bounds.isEmpty())
				bounds.union(year.bounds.clone().translate(offset.set(0, 0, year.z)));
		}
	}
	return bounds;
}

export function tileYear(target: ExportTarget) {
	return target.startsWith("tile:") ? Number(target.slice(5)) : null;
}

export function exportBounds(model: SkylineAssembly, target: ExportTarget) {
	if (target === "assembled") return model.bounds;
	if (target === "base") return assemblyBounds(model.bases, [], "base");
	if (target === "towers") {
		if (!model.years.some(({ bounds }) => !bounds.isEmpty())) return new Box3();
		const bounds = model.carrierFootprint.clone();
		bounds.min.y = -CARRIER_THICKNESS;
		bounds.max.y = Math.max(
			...model.years
				.filter(({ bounds }) => !bounds.isEmpty())
				.map(({ bounds }) => bounds.max.y),
		);
		return bounds;
	}
	const year = tileYear(target);
	if (year !== null)
		return assemblyBounds(
			model.bases.filter((base) => base.year === year),
			model.years.filter((row) => row.year.year === year),
		);
	const part = model.bases
		.flatMap((base) => base.front)
		.find((part) => part.kind === target);
	if (!part) return new Box3();
	return (
		part.kind === "logo" ? part.logo.bounds : part.text.solid.bounds
	).clone();
}

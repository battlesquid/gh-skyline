import type { Manifold as Solid, Mesh, Vec2, Vec3 } from "manifold-3d";
import { Box3, BufferAttribute, BufferGeometry } from "three";
import { measureWork } from "../three/pipeline_metrics";
import { wasm } from "./module";

const { CrossSection, Manifold } = wasm;

export interface SolidPart {
	mesh: Mesh;
	bounds: Box3;
}

class SolidScope {
	private solids: Solid[] = [];

	add(solid: Solid) {
		this.solids.push(solid);
		return solid;
	}

	dispose() {
		for (const solid of this.solids.reverse()) solid.delete();
	}
}

function buildPart(build: (scope: SolidScope) => Solid): SolidPart {
	const scope = new SolidScope();
	try {
		const solid = build(scope);
		if (solid.status() !== "NoError") {
			throw new Error(`Could not build printable solid: ${solid.status()}`);
		}
		const { min, max } = solid.boundingBox();
		const bounds = new Box3();
		if (!solid.isEmpty()) {
			bounds.min.set(...min);
			bounds.max.set(...max);
		}
		return { mesh: solid.getMesh(), bounds };
	} finally {
		scope.dispose();
	}
}

export function partGeometry(part: SolidPart) {
	const geometry = new BufferGeometry();
	geometry.setAttribute(
		"position",
		new BufferAttribute(part.mesh.vertProperties, 3),
	);
	geometry.setIndex(new BufferAttribute(part.mesh.triVerts, 1));
	geometry.computeVertexNormals();
	geometry.boundingBox = part.bounds.clone();
	return geometry;
}

export interface BaseDimensions {
	width: number;
	depth: number;
	height: number;
	widthTaper: number;
	depthTaper: number;
	frontJoint: number | null;
	backJoint: number | null;
}

export function makeBaseBlank(dim: BaseDimensions) {
	return measureWork("base blank", () =>
		buildPart((scope) => {
			const {
				width,
				depth,
				height,
				widthTaper,
				depthTaper,
				frontJoint,
				backJoint,
			} = dim;
			const topX = width / 2;
			const bottomX = topX + widthTaper / 2;
			const front = depth / 2;
			const back = -front;
			const bottomFront = front + (frontJoint === null ? depthTaper / 2 : 0);
			const bottomBack = back - (backJoint === null ? depthTaper / 2 : 0);
			return scope.add(
				Manifold.hull([
					[-topX, 0, front],
					[topX, 0, front],
					[-topX, 0, back],
					[topX, 0, back],
					[-bottomX, -height, bottomFront],
					[bottomX, -height, bottomFront],
					[-bottomX, -height, bottomBack],
					[bottomX, -height, bottomBack],
				]),
			);
		}),
	);
}

export const CONNECTOR_CLEARANCE = 0.25;
const CONNECTOR_LENGTH = 3;
const CONNECTOR_WIDTH = 8;
const OVERLAP = 0.002;

export function addBaseJoints(blank: SolidPart, dim: BaseDimensions) {
	if (dim.frontJoint === null && dim.backJoint === null) return blank;
	return measureWork("base boolean", () =>
		buildPart((scope) => {
			const shoulderHeight = Math.min(3.2, dim.height / 2);
			const clearance = Math.min(CONNECTOR_CLEARANCE, shoulderHeight / 5);
			const half = dim.depth / 2;
			let base = scope.add(Manifold.ofMesh(blank.mesh));
			if (dim.frontJoint !== null) {
				// A low, bed-supported tongue; the opposite tile has an open-bottom socket.
				const tongue = scope.add(
					Manifold.cube(
						[CONNECTOR_WIDTH, shoulderHeight, CONNECTOR_LENGTH + OVERLAP],
						true,
					),
				);
				base = scope.add(
					base.add(
						scope.add(
							tongue.translate(
								dim.frontJoint,
								-dim.height + shoulderHeight / 2,
								half + (CONNECTOR_LENGTH - OVERLAP) / 2,
							),
						),
					),
				);
			}
			if (dim.backJoint !== null) {
				const socket = scope.add(
					Manifold.cube(
						[
							CONNECTOR_WIDTH + 2 * clearance,
							shoulderHeight + 2 * clearance,
							CONNECTOR_LENGTH + clearance + OVERLAP,
						],
						true,
					),
				);
				base = scope.add(
					base.subtract(
						scope.add(
							socket.translate(
								dim.backJoint,
								-dim.height + shoulderHeight / 2,
								-half + (CONNECTOR_LENGTH + clearance - OVERLAP) / 2,
							),
						),
					),
				);
			}
			return base;
		}),
	);
}

export const TEXT_DEPTH = 1;
const TEXT_OVERLAP = 0.0002;

export function makeTextPart(points: Vec2[][]) {
	if (!points.length) return null;
	return measureWork("text extrusion", () =>
		buildPart((scope) => {
			const section = new CrossSection(points);
			try {
				const flat = scope.add(section.extrude(TEXT_DEPTH));
				const upright = scope.add(flat.scale([1, -1, 1]));
				const { min, max } = upright.boundingBox();
				if (upright.isEmpty()) return upright;
				return scope.add(
					upright.translate(
						-(min[0] + max[0]) / 2,
						-(min[1] + max[1]) / 2,
						-TEXT_DEPTH / 2,
					),
				);
			} finally {
				section.delete();
			}
		}),
	);
}

export interface TextPlacement {
	solid: SolidPart;
	angle: number;
	position: Vec3;
}

export function textPlacement(
	solid: SolidPart,
	angle: number,
	position: Vec3,
	inset: boolean,
): TextPlacement {
	const offset = (inset ? -1 : 1) * (TEXT_DEPTH / 2 - TEXT_OVERLAP);
	const [x, y, z] = position;
	return {
		solid,
		angle,
		position: [x, y - Math.sin(angle) * offset, z + Math.cos(angle) * offset],
	};
}

export function composeBase(
	base: SolidPart,
	texts: readonly TextPlacement[],
	inset: boolean,
) {
	if (!texts.length) return base;
	return measureWork("base boolean", () =>
		buildPart((scope) => {
			const shell = scope.add(Manifold.ofMesh(base.mesh));
			const placed = texts.map(({ solid, angle, position }) => {
				const source = scope.add(Manifold.ofMesh(solid.mesh));
				const rotated = scope.add(
					source.rotate([(angle * 180) / Math.PI, 0, 0]),
				);
				return scope.add(rotated.translate(position));
			});
			return scope.add(
				inset
					? Manifold.difference([shell, ...placed])
					: Manifold.union([shell, ...placed]),
			);
		}),
	);
}

export interface TowerBox {
	x: number;
	z: number;
	height: number;
}

export const CARRIER_THICKNESS = 0.8;

function addTowerBoxes(
	scope: SolidScope,
	base: Solid,
	towers: readonly TowerBox[],
	size: number,
) {
	const blocks = towers.map(({ x, z, height }) => {
		const block = scope.add(
			Manifold.cube([size, height + OVERLAP, size], true),
		);
		return scope.add(block.translate(x, (height - OVERLAP) / 2, z));
	});
	return scope.add(Manifold.union([base, ...blocks]));
}

export function makeTileBody(
	base: SolidPart,
	towers: readonly TowerBox[],
	size: number,
) {
	if (!towers.length) return base;
	return buildPart((scope) =>
		addTowerBoxes(scope, scope.add(Manifold.ofMesh(base.mesh)), towers, size),
	);
}

export function makeTowerCarrier(
	towers: readonly TowerBox[],
	size: number,
	footprint: Box3,
) {
	if (!towers.length) throw new Error("No contribution towers to export.");
	return buildPart((scope) => {
		const plate = scope.add(
			Manifold.cube(
				[
					footprint.max.x - footprint.min.x,
					CARRIER_THICKNESS,
					footprint.max.z - footprint.min.z,
				],
				true,
			),
		);
		const carrier = scope.add(
			plate.translate(
				(footprint.min.x + footprint.max.x) / 2,
				-CARRIER_THICKNESS / 2,
				(footprint.min.z + footprint.max.z) / 2,
			),
		);
		return addTowerBoxes(scope, carrier, towers, size);
	});
}

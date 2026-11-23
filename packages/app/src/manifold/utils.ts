import type {
	Box,
	Manifold as ManifoldType,
	Mesh as MeshType,
	Rect,
} from "manifold-3d";
import { BufferAttribute, BufferGeometry } from "three";
import type { TextGeometry } from "three-stdlib";
import { degToRad } from "three/src/math/MathUtils.js";
import type { ManifoldDimensions } from "./frustum";
import { wasm } from "./module";

const { Mesh, Manifold } = wasm;

export function geometry2mesh(geometry: BufferGeometry): MeshType {
	geometry.rotateX(degToRad(90));
	geometry.rotateZ(degToRad(180));
	geometry.center();
	// Only uses position attribute. You can interleave other attributes (UV, normals, etc.) if needed.
	const vertProperties = geometry.attributes.position.array as Float32Array;

	// Ensure geometry is indexed. If no index, create a sequential index array.
	const triVerts =
		geometry.index != null
			? (geometry.index.array as Uint32Array)
			: new Uint32Array(vertProperties.length / 3).map((_, idx) => idx);

	// Set up group runs for each material (draw call).
	const starts = geometry.groups.map((g) => g.start);
	const originalIDs = geometry.groups.map((g) => g.materialIndex ?? 0);

	// Sort runs in sequence by start index.
	const indices = Array.from(starts.keys());
	indices.sort((a, b) => starts[a] - starts[b]);
	const runIndex = new Uint32Array(indices.map((i) => starts[i]));
	const runOriginalID = new Uint32Array(indices.map((i) => originalIDs[i]));

	// Create the MeshGL for I/O with Manifold library.
	const mesh = new Mesh({
		numProp: 3,
		vertProperties,
		triVerts,
		runIndex,
		runOriginalID,
	});

	// Merge duplicate vertices with nearly identical positions.
	mesh.merge();
	return mesh;
}

export function mesh2geometry(mesh: MeshType) {
	const geometry = new BufferGeometry();
	// Assign buffers
	geometry.setAttribute(
		"position",
		new BufferAttribute(mesh.vertProperties, 3),
	);
	geometry.setIndex(new BufferAttribute(mesh.triVerts, 1));
	// Create a group (material) for each ID. Note that there may be multiple
	// triangle runs returned with the same ID, though these will always be
	// sequential since they are sorted by ID. In this example there are two runs
	// for the MeshNormalMaterial, one corresponding to each input mesh that had
	// this ID. This allows runTransform to return the total transformation matrix
	// applied to each triangle run from its input mesh - even after many
	// consecutive operations.
	let id = mesh.runOriginalID[0];
	let start = mesh.runIndex[0];
	for (let run = 0; run < mesh.numRun; ++run) {
		const nextID = mesh.runOriginalID[run + 1];
		if (nextID !== id) {
			const end = mesh.runIndex[run + 1];
			geometry.addGroup(start, end - start);
			id = nextID;
			start = end;
		}
	}
	geometry.center();
	geometry.rotateX(degToRad(-90));
	geometry.rotateY(degToRad(180));
	geometry.computeVertexNormals();
	geometry.normalizeNormals();
	return geometry;
}

export const makeTextManifold = (geometry: TextGeometry) => {
	return new Manifold(geometry2mesh(geometry));
};

export const boundingBoxDimensions = (box: Box): ManifoldDimensions => {
	return {
		width: box.max[0] - box.min[0],
		length: box.max[1] - box.min[1],
		height: box.max[2] - box.min[2],
	};
};

export const boundingRectDimensions = (rect: Rect) => {
	return {
		width: rect.max[0] - rect.min[0],
		length: rect.max[1] - rect.min[1],
	};
};

export const centerManifold = (manifold: ManifoldType) => {
	const bounds = manifold.boundingBox();
	const center = [
		-(bounds.min[0] + bounds.max[0]) / 2,
		-(bounds.min[1] + bounds.max[1]) / 2,
		-(bounds.min[2] + bounds.max[2]) / 2,
	] as const;
	return manifold.translate(center);
};

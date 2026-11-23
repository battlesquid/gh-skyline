import {
	Box3,
	BoxGeometry,
	type BufferGeometry,
	Group,
	Mesh,
	MeshStandardMaterial,
	Vector3,
} from "three";
import { STLExporter } from "three-stdlib";
import {
	composeBase,
	makeTileBody,
	makeTowerCarrier,
	partGeometry,
} from "../manifold/parts";
import {
	type ExportTarget,
	exportBounds,
	type SkylineAssembly,
	tileYear,
} from "./assembly";
import { measureWork } from "./pipeline_metrics";
import { towerBox, towerColor } from "./tower_parts";
import { ExportFormat } from "./types";

function isFrontTarget(target: ExportTarget) {
	return target === "logo" || target === "name" || target === "year";
}

export function formatExportSize(
	model: SkylineAssembly,
	target: ExportTarget,
	scale: number,
) {
	const { x, y, z } = exportBounds(model, target)
		.getSize(new Vector3())
		.multiplyScalar(scale);
	return (isFrontTarget(target) ? [x, y, z] : [x, z, y])
		.map((value) => `${Math.round(value)}\u{339c}`)
		.join(" \u{00d7} ");
}

export function prepareExport(
	model: SkylineAssembly,
	target: ExportTarget,
	scale: number,
) {
	const group = new Group();
	const ownedGeometry = new Set<BufferGeometry>();
	const materials = new Map<string, MeshStandardMaterial>();
	function material(color: string) {
		const previous = materials.get(color);
		if (previous) return previous;
		const created = new MeshStandardMaterial({ color });
		materials.set(color, created);
		return created;
	}
	function mesh(geometry: BufferGeometry, color: string, owned = true) {
		if (owned) ownedGeometry.add(geometry);
		const object = new Mesh(geometry, material(color));
		group.add(object);
		return object;
	}
	const dispose = () => {
		ownedGeometry.forEach((value) => value.dispose());
		materials.forEach((value) => value.dispose());
	};
	try {
		if (exportBounds(model, target).isEmpty())
			throw new Error("This part is not available to download.");
		const tile = tileYear(target);
		if (isFrontTarget(target)) {
			const part = model.bases
				.flatMap((base) => base.front)
				.find((part) => part.kind === target);
			if (part?.kind === "logo") {
				part.logo.geometries.forEach((geometry) =>
					mesh(geometry, model.baseColor, false),
				);
			} else if (part) {
				mesh(partGeometry(part.text.solid), model.baseColor);
			}
		} else if (target === "towers") {
			const boxes = model.years.flatMap(({ year, z }) =>
				year.days.map((day) => towerBox(day, model.settings, z)),
			);
			mesh(
				partGeometry(
					makeTowerCarrier(boxes, model.settings.size, model.carrierFootprint),
				),
				model.baseColor,
			);
		} else {
			for (const { year, solid, inset, shift, front, z } of model.bases) {
				if (tile !== null && year !== tile) continue;
				let shell =
					target === "base" || inset
						? solid
						: composeBase(
								solid,
								front.flatMap((part) =>
									part.kind !== "logo" ? [part.text] : [],
								),
								false,
							);
				if (tile !== null) {
					const row = model.years.find(({ year }) => year.year === tile);
					if (row)
						shell = makeTileBody(
							shell,
							row.year.days.map((day) => towerBox(day, model.settings)),
							model.settings.size,
						);
				}
				mesh(partGeometry(shell), model.baseColor).position.z = z + shift;
				if (target === "base") continue;
				for (const part of front) {
					if (part.kind !== "logo") continue;
					for (const geometry of part.logo.geometries) {
						const object = mesh(geometry, model.baseColor, false);
						object.rotation.x = part.logo.angle;
						object.position.set(...part.logo.position);
						object.position.z += z;
					}
				}
			}
			if (target === "assembled") {
				const box = new BoxGeometry();
				ownedGeometry.add(box);
				for (const { year, z } of model.years) {
					for (const day of year.days) {
						const tower = towerBox(day, model.settings, z);
						const object = mesh(box, towerColor(day, model.paint), false);
						object.position.set(tower.x, tower.height / 2, tower.z);
						object.scale.set(
							model.settings.size,
							tower.height,
							model.settings.size,
						);
					}
				}
			}
		}
		if (!isFrontTarget(target)) group.rotation.x = Math.PI / 2;
		group.scale.setScalar(scale);
		group.updateMatrixWorld(true);
		if (target !== "assembled") {
			const bounds = new Box3().setFromObject(group);
			const center = bounds.getCenter(new Vector3());
			group.position.set(-center.x, -center.y, -bounds.min.z);
			group.updateMatrixWorld(true);
		}
		return { group, dispose };
	} catch (error) {
		dispose();
		throw error;
	}
}

export async function makeDownload(
	model: SkylineAssembly,
	target: ExportTarget,
	scale: number,
	format: ExportFormat,
) {
	const { group, dispose } = prepareExport(model, target, scale);
	try {
		if (format === ExportFormat.ThreeMF) {
			const { exportTo3MF } = await import("three-3mf-exporter");
			const data = await measureWork("export", () => exportTo3MF(group));
			return new Blob([data], { type: "model/3mf" });
		}
		const data = measureWork("export", () =>
			new STLExporter().parse(group, { binary: true }),
		);
		return new Blob([data.buffer as ArrayBuffer], { type: "model/stl" });
	} finally {
		dispose();
	}
}

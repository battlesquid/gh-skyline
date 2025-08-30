import { useEffect, useState } from "react";
import type { Group, InstancedMesh } from "three";
import { exportTo3MF } from "three-3mf-exporter";
import { STLExporter } from "three-stdlib";
import { getThreeBoundingBox } from "../hooks/useBoundingBox";
import { createMeshesFromInstancedMesh, SkylineObjectNames } from "./utils";

export enum ExportFormat {
	Stl = "stl",
	ThreeMF = "3mf",
}

export type Exporter = (model: Group) => Promise<string>;

const EXPORT_MAP: Record<ExportFormat, Exporter> = {
	[ExportFormat.Stl]: async (model) => {
		const exporter = new STLExporter();
		const data = exporter.parse(model, { binary: true });
		return URL.createObjectURL(
			new Blob([data.buffer as ArrayBuffer], {
				type: "application/octet-stream",
			}),
		);
	},
	[ExportFormat.ThreeMF]: async (model) => {
		const data = await exportTo3MF(model);
		return URL.createObjectURL(
			new Blob([data], { type: "application/octet-stream" }),
		);
	},
};

const prepareModel = (model: Group, scale: number) => {
	const preparedModel = model.clone();
	const exportGroup = preparedModel.getObjectByName(
		SkylineObjectNames.TowersExportGroup,
	) as Group;
	const instances = preparedModel.getObjectByName(SkylineObjectNames.Towers) as
		| InstancedMesh
		| undefined;

	if (instances !== undefined) {
		const meshes = createMeshesFromInstancedMesh(instances);

		meshes.position.set(0, meshes.position.y, 0);
		meshes.updateMatrix();

		exportGroup.add(meshes);

		const instancesGroup = preparedModel.getObjectByName(
			SkylineObjectNames.TowersParent,
		) as Group;
		instancesGroup.removeFromParent();
		instances.removeFromParent();
	}

	preparedModel.rotation.set(Math.PI / 2, 0, 0);
	preparedModel.scale.set(scale, scale, scale);
	preparedModel.updateMatrixWorld();
	return preparedModel;
};

const loader = async (
	model: Group | null,
	scale: number,
	format: ExportFormat,
) => {
	if (model === null) {
		console.warn("Model is null, skipping export");
		return;
	}
	const preparedModel = prepareModel(model, scale);
	const url = await EXPORT_MAP[format](preparedModel);
	const vec = getThreeBoundingBox(preparedModel);
	const size = `${Math.round(vec.x)}\u{339c} \u{00d7} ${Math.round(vec.y)}\u{339c} \u{00d7} ${Math.round(vec.z)}\u{339c}`;
	return { url, size };
};

export function useExportedModel(
	model: Group | null,
	scale: number,
	format: ExportFormat,
) {
	const [downloadUrl, setDownloadUrl] = useState<string>("");
	const [exporting, setExporting] = useState(true);
	const [size, setSize] = useState(
		"0\u{339c} \u{00d7} 0\u{339c} \u{00d7} 0\u{339c}",
	);
	let exportTimeout: number | undefined;
	const clearExportTimeout = () => {
		if (exportTimeout !== undefined) {
			clearTimeout(exportTimeout);
		}
	};
	useEffect(() => {
		setExporting(true);
		loader(model, scale, format)
			.then((result) => {
				if (result !== undefined) {
					setDownloadUrl(result.url);
					setSize(result.size);
				}
			})
			.finally(() => {
				exportTimeout = window.setTimeout(() => {
					setExporting(false);
				}, 500);
			});
		return clearExportTimeout;
	}, [model, scale, format]);
	return { downloadUrl, exporting, size };
}

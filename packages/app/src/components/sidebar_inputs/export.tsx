import { Button, Text } from "@mantine/core";
import { Suspense } from "react";
import { useModelStore } from "../../stores/model";
import { useParametersContext } from "../../stores/parameters";
import { useExportedModel } from "../../three/export";

export function ExportButton() {
	const filename = useParametersContext(
		(state) => state.computed.resolvedFilename,
	);
	const format = useParametersContext((state) => state.inputs.exportFormat);
	const scale = useParametersContext((state) => state.inputs.scale);

	const model = useModelStore((state) => state.model);
	const dirty = useModelStore((state) => state.dirty);
	const { downloadUrl, exporting, size } = useExportedModel(
		model,
		scale,
		format,
	);

	return (
		<Suspense>
			<Button
				flex={1}
				loading={model === null || dirty || exporting}
				disabled={model === null || dirty || exporting}
				component="a"
				href={downloadUrl}
				download={`${filename}.${format}`}
			>
				<div>
					<Text fw={900} size="sm">
						Export
					</Text>
					<Text size="xs">{size}</Text>
				</div>
			</Button>
		</Suspense>
	);
}

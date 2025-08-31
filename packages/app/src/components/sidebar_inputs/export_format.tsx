import { Select } from "@mantine/core";
import { getParametersStore, useParametersContext } from "../../stores/parameters";
import { ExportFormat } from "../../three/export";

export function ExportFormatInput() {
    const DEFAULT_VALUE = getParametersStore().getInitialState().inputs.exportFormat;
	const setInputs = useParametersContext((state) => state.setInputs);
	return (
		<Select
			label="Format"
			data={[
				{
					value: ExportFormat.ThreeMF,
					label: ExportFormat.ThreeMF.toUpperCase(),
				},
				{
					value: ExportFormat.Stl,
					label: ExportFormat.Stl.toUpperCase(),
				},
			]}
			defaultValue={DEFAULT_VALUE}
			allowDeselect={false}
			onChange={(value) => {
				if (value === null) {
					return;
				}
				setInputs({ exportFormat: value as ExportFormat });
			}}
		/>
	);
}

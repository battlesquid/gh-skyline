import { Select } from "@mantine/core";
import {
	getParametersStore,
	useParametersContext,
} from "../../stores/parameters";
import { SkylineBaseShape } from "../../three/types";
import { capitalize } from "../../utils";

export function BaseShapeInput() {
	const DEFAULT_VALUE = getParametersStore().getInitialState().inputs.shape;
	const setInputs = useParametersContext((state) => state.setInputs);
	return (
		<Select
			label="Base Shape"
			data={[
				{
					value: SkylineBaseShape.Prism,
					label: capitalize(SkylineBaseShape.Prism),
				},
				{
					value: SkylineBaseShape.Frustum,
					label: capitalize(SkylineBaseShape.Frustum),
				},
			]}
			defaultValue={DEFAULT_VALUE}
			allowDeselect={false}
			onChange={(value) => {
				if (value === null) {
					return;
				}
				setInputs({ shape: value as SkylineBaseShape });
			}}
		/>
	);
}

import { NumberInput } from "@mantine/core";
import { useParametersContext } from "../../stores/parameters";
import { safeFloat } from "../../utils";

export function ScaleInput() {
	const scale = useParametersContext((state) => state.inputs.scale);
	const setInputs = useParametersContext((state) => state.setInputs);

	return (
		<NumberInput
			label="Scale"
			placeholder="Scale"
			min={1}
			step={0.1}
			value={scale}
            clampBehavior="strict"
			onChange={(value) => setInputs({ scale: safeFloat(value, 1) })}
		/>
	);
}

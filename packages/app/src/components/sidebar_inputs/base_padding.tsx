import { NumberInput } from "@mantine/core";
import { useParametersContext } from "../../stores/parameters";
import { safeFloat } from "../../utils";

export function BasePaddingInput() {
	const padding = useParametersContext((state) => state.inputs.padding);
	const setInputs = useParametersContext((state) => state.setInputs);

	return (
		<NumberInput
			label="Base Padding"
			placeholder="Base Padding"
			min={0}
			step={0.5}
			value={padding}
            clampBehavior="strict"
            allowNegative={false}
            allowLeadingZeros={false}
			onChange={(value) =>
				setInputs({
					padding: safeFloat(value, 0),
				})
			}
		/>
	);
}

import { NumberInput } from "@mantine/core";
import { useParametersContext } from "../../stores/parameters";
import { safeInt } from "../../utils";

export function TowerDampeningInput() {
	const dampening = useParametersContext((state) => state.inputs.dampening);
	const setInputs = useParametersContext((state) => state.setInputs);
	return (
		<NumberInput
			label="Tower Dampening"
			placeholder="Tower Dampening"
			min={1}
			allowDecimal={false}
			value={dampening}
			clampBehavior="strict"
			allowNegative={false}
			onChange={(value) => {
				setInputs({
					dampening: safeInt(value, 1),
				});
			}}
		/>
	);
}

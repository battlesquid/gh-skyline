import { TextInput } from "@mantine/core";
import { useParametersContext } from "../../stores/parameters";

export function UsernameOverrideInput() {
	const nameOverride = useParametersContext(
		(state) => state.inputs.nameOverride,
	);
	const setInputs = useParametersContext((state) => state.setInputs);

	return (
		<TextInput
			label="Username Override"
			value={nameOverride}
			placeholder="Username Override"
			onChange={(e) => setInputs({ nameOverride: e.target.value })}
		/>
	);
}

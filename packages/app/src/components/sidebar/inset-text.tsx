import { Checkbox } from "@mantine/core";
import { useParametersContext } from "../../stores/parameters";

export function InsetTextCheckbox() {
	const insetText = useParametersContext((state) => state.inputs.insetText);
	const setInputs = useParametersContext((state) => state.setInputs);

	return (
		<Checkbox
			label="Inset Text"
			checked={insetText}
			onChange={(e) => setInputs({ insetText: e.currentTarget.checked })}
		/>
	);
}

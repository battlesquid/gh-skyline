import { Checkbox, ColorInput } from "@mantine/core";
import { useParametersContext } from "../../stores/parameters";

export function RenderColorInput() {
	const color = useParametersContext((state) => state.inputs.color);
	const showContributionColor = useParametersContext(
		(state) => state.inputs.showContributionColor,
	);
	const setInputs = useParametersContext((state) => state.setInputs);

	return (
		<>
			<ColorInput
				label="Render Color"
				value={color}
				disabled={showContributionColor}
				onChange={(color) => setInputs({ color })}
			/>
			<Checkbox
				label="Show Contribution Colors"
				checked={showContributionColor}
				onChange={() =>
					setInputs({
						showContributionColor: !showContributionColor,
					})
				}
			/>
		</>
	);
}

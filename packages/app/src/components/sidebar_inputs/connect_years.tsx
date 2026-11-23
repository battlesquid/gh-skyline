import { Checkbox, Stack, Text } from "@mantine/core";
import { useModelStore } from "../../stores/model";
import { useParametersContext } from "../../stores/parameters";
import { OffsetInput } from "./front_content";

export function ConnectYearsInput() {
	const enabled = useParametersContext((state) => state.inputs.connectYears);
	const jointOffsets = useParametersContext(
		(state) => state.inputs.jointOffsets,
	);
	const scale = useParametersContext((state) => state.inputs.scale);
	const maxOffset = useParametersContext(({ computed }) =>
		Math.max(0, (computed.modelLength + computed.paddingWidth) / 2 - 7),
	);
	const setInputs = useParametersContext((state) => state.setInputs);
	const years = useModelStore((state) => state.snapshot?.model.years);
	return (
		<Stack gap="xs">
			<Checkbox
				label="Connectable year tiles"
				checked={enabled}
				onChange={(event) =>
					setInputs({ connectYears: event.currentTarget.checked })
				}
			/>
			{enabled && (
				<>
					<Text size="xs" c="dimmed">
						Tiles join front to back. Front decorations stay on the outer face.
						Export each tile separately for assembly. Use the same scale for
						mating tiles.
					</Text>
					{scale !== 1 && (
						<Text size="xs" c="dimmed">
							Scaling also changes connector clearance.
						</Text>
					)}
					{years?.slice(0, -1).map(({ year }, index) => (
						<OffsetInput
							key={year.year}
							label={`${year.year} to ${years[index + 1].year.year} connector offset`}
							value={Math.min(
								maxOffset,
								Math.max(-maxOffset, jointOffsets[year.year] ?? 0),
							)}
							min={-maxOffset}
							max={maxOffset}
							onCommit={(value) => {
								if (value !== (jointOffsets[year.year] ?? 0))
									setInputs({
										jointOffsets: { ...jointOffsets, [year.year]: value },
									});
							}}
						/>
					))}
				</>
			)}
		</Stack>
	);
}

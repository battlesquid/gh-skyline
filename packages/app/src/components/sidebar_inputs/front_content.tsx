import {
	Checkbox,
	Group,
	NumberInput,
	Select,
	Stack,
	Text,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useModelStore } from "../../stores/model";
import { useParametersContext } from "../../stores/parameters";
import {
	FRONT_ALIGNMENTS,
	FRONT_ITEMS,
	FRONT_LOGOS,
	type FrontItem,
	type FrontOptions,
} from "../../three/types";

export function OffsetInput({
	label,
	value,
	onChange,
	onCommit,
	onDraftEnd,
	min,
	max,
}: {
	label: string;
	value: number;
	onChange?: (value: number) => void;
	onCommit: (value: number) => void;
	onDraftEnd?: () => void;
	min?: number;
	max?: number;
}) {
	const [draft, setDraft] = useState<number | string | null>(null);
	function commit() {
		if (typeof draft === "number" && Number.isFinite(draft)) {
			onCommit(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, draft)));
		}
		setDraft(null);
		onDraftEnd?.();
	}
	return (
		<NumberInput
			label={label}
			value={draft ?? value}
			step={0.5}
			min={min}
			max={max}
			onChange={(next) => {
				setDraft(next);
				if (typeof next === "number" && Number.isFinite(next)) onChange?.(next);
			}}
			onBlur={commit}
			onKeyDown={(event) => {
				if (event.key === "Enter") commit();
				if (event.key === "Escape") {
					setDraft(null);
					onDraftEnd?.();
				}
			}}
		/>
	);
}

function FrontControls({ item }: { item: FrontItem }) {
	const options = useParametersContext((state) => state.inputs.front[item]);
	const inset = useParametersContext((state) => state.inputs.insetText);
	const store = useParametersContext((state) => state.setInputs);
	const front = useParametersContext((state) => state.inputs.front);
	const label = { name: "Name", year: "Year", logo: "Logo" }[item];
	const isCut = inset && item !== "logo";
	function clearGuide() {
		if (useModelStore.getState().frontDraft?.item === item) {
			useModelStore.setState({ frontDraft: null });
		}
	}
	useEffect(() => {
		if (!options.visible || !isCut) clearGuide();
		return clearGuide;
	}, [item, options.visible, isCut]);
	function update(changes: Partial<FrontOptions>) {
		if (
			Object.entries(changes).every(
				([key, value]) => options[key as keyof FrontOptions] === value,
			)
		)
			return;
		store({ front: { ...front, [item]: { ...options, ...changes } } });
	}
	function draftOffset(axis: "x" | "y", value: number) {
		if (isCut) useModelStore.setState({ frontDraft: { item, axis, value } });
		else update({ [axis]: value });
	}
	return (
		<Stack gap="xs">
			<Checkbox
				label={`Show ${label.toLowerCase()}`}
				checked={options.visible}
				onChange={(event) => update({ visible: event.currentTarget.checked })}
			/>
			{options.visible && (
				<>
					<Select
						label={`${label} alignment`}
						value={options.alignment}
						data={FRONT_ALIGNMENTS.map((value) => ({
							value,
							label: value[0].toUpperCase() + value.slice(1),
						}))}
						allowDeselect={false}
						onChange={(value) => {
							const alignment = FRONT_ALIGNMENTS.find(
								(option) => option === value,
							);
							if (alignment) update({ alignment });
						}}
					/>
					<Group grow align="start">
						<OffsetInput
							label={`${label} X offset`}
							value={options.x}
							onChange={(x) => draftOffset("x", x)}
							onCommit={(x) => update({ x })}
							onDraftEnd={clearGuide}
						/>
						<OffsetInput
							label={`${label} Y offset`}
							value={options.y}
							onChange={(y) => draftOffset("y", y)}
							onCommit={(y) => update({ y })}
							onDraftEnd={clearGuide}
						/>
					</Group>
					{isCut && (
						<Text size="xs" c="dimmed">
							Press Enter or leave an offset field to apply the engraving.
						</Text>
					)}
				</>
			)}
		</Stack>
	);
}

export function FrontContentInput() {
	const logo = useParametersContext((state) => state.inputs.frontLogo);
	const showLogo = useParametersContext(
		(state) => state.inputs.front.logo.visible,
	);
	const setInputs = useParametersContext((state) => state.setInputs);
	return (
		<Stack gap="md">
			{FRONT_ITEMS.map((item) => (
				<FrontControls key={item} item={item} />
			))}
			{showLogo && (
				<Select
					label="Logo design"
					value={logo}
					data={FRONT_LOGOS.map((value) => ({
						value,
						label: value === "Circle" ? "GitHub" : value,
					}))}
					allowDeselect={false}
					onChange={(value) => {
						const frontLogo = FRONT_LOGOS.find((option) => option === value);
						if (frontLogo) setInputs({ frontLogo });
					}}
				/>
			)}
		</Stack>
	);
}

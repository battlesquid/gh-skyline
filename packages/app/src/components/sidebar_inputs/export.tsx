import { Button, Select, Text } from "@mantine/core";
import { useShallow } from "zustand/shallow";
import { useModelStore } from "../../stores/model";
import { useParametersContext } from "../../stores/parameters";
import {
	type ExportTarget,
	exportBounds,
	type SkylineAssembly,
} from "../../three/assembly";
import { formatExportSize, makeDownload } from "../../three/export";

function targets(
	model?: SkylineAssembly,
): { value: ExportTarget; label: string }[] {
	const options: { value: ExportTarget; label: string }[] = [
		{ value: "assembled", label: "Assembled skyline" },
		{ value: "base", label: "Base only" },
		{ value: "towers", label: "Towers with carrier" },
		{ value: "name", label: "Name only" },
		{ value: "year", label: "Year text only" },
		{ value: "logo", label: "Logo only" },
	];
	for (const base of model?.bases ?? []) {
		if (base.year !== null)
			options.push({ value: `tile:${base.year}`, label: `${base.year} tile` });
	}
	return model
		? options.filter(({ value }) => !exportBounds(model, value).isEmpty())
		: options.slice(0, 1);
}

export function ExportTargetInput() {
	const snapshot = useModelStore((state) => state.snapshot);
	const target = useModelStore((state) => state.target);
	const setTarget = useModelStore((state) => state.setTarget);
	const options = targets(snapshot?.model);
	return (
		<Select
			label="Part to download"
			value={
				options.some(({ value }) => value === target) ? target : "assembled"
			}
			data={options}
			allowDeselect={false}
			onChange={(value) => {
				const option = options.find((option) => option.value === value);
				if (option) setTarget(option.value);
			}}
		/>
	);
}

export function ExportButton({ fetching }: { fetching: boolean }) {
	const filename = useParametersContext(
		(state) => state.computed.resolvedFilename,
	);
	const format = useParametersContext((state) => state.inputs.exportFormat);
	const scale = useParametersContext((state) => state.inputs.scale);
	const revision = useParametersContext((state) => state.modelRevision);
	const { snapshot, busy, error, target } = useModelStore(
		useShallow(({ snapshot, busy, error, target }) => ({
			snapshot,
			busy,
			error,
			target,
		})),
	);
	const selection =
		targets(snapshot?.model).find(({ value }) => value === target)?.value ??
		"assembled";
	const warning = snapshot?.fontError || snapshot?.warnings.join(" ");
	const ready =
		!!snapshot &&
		!snapshot.waiting &&
		snapshot.revision === revision &&
		!fetching;
	const disabled =
		!ready ||
		(warning && (selection === "assembled" || selection.startsWith("tile:")));
	const size = snapshot && formatExportSize(snapshot.model, selection, scale);

	async function download() {
		if (!snapshot || disabled || useModelStore.getState().busy) return;
		useModelStore.setState({ busy: true, error: "" });
		try {
			await new Promise<void>((resolve) =>
				requestAnimationFrame(() => {
					window.setTimeout(resolve, 0);
				}),
			);
			const data = await makeDownload(snapshot.model, selection, scale, format);
			const url = URL.createObjectURL(data);
			try {
				const anchor = document.createElement("a");
				anchor.href = url;
				const suffix =
					selection === "assembled" ? "" : `_${selection.replace(":", "-")}`;
				anchor.download = `${filename}${suffix}.${format}`;
				document.body.appendChild(anchor);
				try {
					anchor.click();
				} finally {
					anchor.remove();
				}
			} finally {
				// Let the browser consume the URL before releasing it.
				window.setTimeout(() => URL.revokeObjectURL(url), 1000);
			}
		} catch (cause) {
			useModelStore.setState({
				error:
					cause instanceof Error
						? cause.message
						: "Could not generate the download.",
			});
		} finally {
			useModelStore.setState({ busy: false });
		}
	}

	return (
		<>
			{warning && (
				<Text size="xs" c="orange" role="status">
					{warning}
				</Text>
			)}
			{error && (
				<Text size="xs" c="red" role="alert">
					{error}
				</Text>
			)}
			<Button
				flex={1}
				loading={busy}
				disabled={!!disabled}
				onClick={() => void download()}
			>
				<div>
					<Text
						className="mona-sans-wide"
						style={{ marginBottom: "-5px" }}
						fw={900}
						size="xs"
					>
						DOWNLOAD
					</Text>
					<Text size="xs">{size ?? "Preparing model"}</Text>
				</div>
			</Button>
		</>
	);
}

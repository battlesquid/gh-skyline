import { Button } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useControlsStore } from "../stores/controls";

export function ResetCameraButton() {
	const resetView = useControlsStore((state) => state.resetView);

	return (
		<Button
			pos="absolute"
			style={{
				bottom: "var(--mantine-spacing-sm)",
				right: "var(--mantine-spacing-sm)",
				zIndex: 1,
			}}
			variant="default"
			size="xs"
			leftSection={<IconRefresh size={16} stroke={1} aria-hidden="true" />}
			onClick={resetView}
		>
			Reset Camera
		</Button>
	);
}

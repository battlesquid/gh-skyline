import { ActionIcon, Card, Group, Portal, Tooltip } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
	IconCamera,
	IconHome,
	IconPencil,
	IconRotate360,
} from "@tabler/icons-react";
import { type ProjectionMode, useControlsStore } from "../stores/controls";
import classes from "../styles/dock.module.css";
import { MQ } from "../theme/media";
import { capitalize } from "../utils";

export function SkylineControls({
	onOpenDrawer,
}: {
	onOpenDrawer?: () => void;
}) {
	const resetView = useControlsStore((state) => state.resetView);
	const toggleAutoRotation = useControlsStore(
		(state) => state.toggleAutoRotate,
	);
	const toggleProjectionMode = useControlsStore(
		(state) => state.toggleProjectionMode,
	);
	const autoRotate = useControlsStore((state) => state.autoRotate);
	const otherMode: ProjectionMode = useControlsStore((state) =>
		state.projectionMode === "orthographic" ? "perspective" : "orthographic",
	);

	const isMobile = useMediaQuery(MQ.sm);

	return (
		<Portal target="#skyline-canvas">
			<Card className={classes.dock} p={5} withBorder>
				<Group gap={5}>
					{isMobile && onOpenDrawer && (
						<Tooltip label="Edit Settings">
							<ActionIcon
								variant="subtle"
								aria-label="Open Settings"
								onClick={() => onOpenDrawer?.()}
							>
								<IconPencil stroke={1} />
							</ActionIcon>
						</Tooltip>
					)}
					<Tooltip label="Reset View">
						<ActionIcon
							variant="subtle"
							aria-label="Reset View"
							onClick={() => resetView()}
						>
							<IconHome stroke={1} />
						</ActionIcon>
					</Tooltip>
					<Tooltip label={`Enable ${capitalize(otherMode)} Camera`}>
						<ActionIcon
							variant="subtle"
							aria-label="Toggle Projection Mode"
							onClick={() => toggleProjectionMode()}
						>
							<IconCamera stroke={1} />
						</ActionIcon>
					</Tooltip>
					<Tooltip label={`${autoRotate ? "Disable" : "Enable"} Rotation`}>
						<ActionIcon
							variant={autoRotate ? "filled" : "subtle"}
							aria-label="Toggle Rotation"
							onClick={() => toggleAutoRotation()}
						>
							<IconRotate360 stroke={1} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</Card>
		</Portal>
	);
}

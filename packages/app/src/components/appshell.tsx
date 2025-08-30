import { AppShell, LoadingOverlay } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { UserProfile } from "../api/auth";
import { useExtendedQuery } from "../hooks/useExtendedQuery";
import { useUrlStateSync } from "../hooks/useUrlState";
import { useParametersContext } from "../stores/parameters";
import { Skyline } from "../three/skyline";
import { HoverCard } from "./hover_card";
import { Sidebar } from "./sidebar";
import { SkylineControls } from "./skyline_controls";

export interface EditorAppShellProps {
	profile: UserProfile | null;
}

export function EditorAppShell({ profile }: EditorAppShellProps) {
	const name = useParametersContext((state) => state.inputs.name);
	const start = useParametersContext((state) => state.inputs.startYear);
	const end = useParametersContext((state) => state.inputs.endYear);

	const [mobileOpened] = useDisclosure();
	const [desktopOpened] = useDisclosure(true);

	const { years, fetching, ok } = useExtendedQuery({
		name,
		start,
		end,
	});

	useUrlStateSync();

	return (
		<AppShell
			header={{ height: 0 }}
			padding={"xs"}
			navbar={{
				width: 320,
				breakpoint: "sm",
				collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
			}}
			withBorder={false}
		>
			<AppShell.Navbar p="md" pr={0}>
				<Sidebar profile={profile} ok={ok} />
			</AppShell.Navbar>
			<AppShell.Main style={{ height: "calc(100vh)" }}>
				<LoadingOverlay
					visible={fetching}
					zIndex={1000}
					overlayProps={{ radius: "sm", blur: 2 }}
				/>
				<Skyline years={years} />
				<div
					style={{
						position: "absolute",
						left: 0,
						right: 0,
						top: 0,
						bottom: 0,
						pointerEvents: "none",
					}}
				>
					<HoverCard />
				</div>
				<SkylineControls />
			</AppShell.Main>
		</AppShell>
	);
}

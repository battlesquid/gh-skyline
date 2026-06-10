import { AppShell, Drawer, Text } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import type { UserProfile } from "../api/auth";
import { useUrlStateSync } from "../hooks/use-url-state";
import { MQ } from "../theme/media";
import Viewer from "../three/viewer";
import { HoverCard } from "./hover-card";
import Loading from "./loading";
import { Sidebar } from "./sidebar";
import { SkylineControls } from "./app-controls";

export interface EditorAppShellProps {
	profile: UserProfile | null;
}

export function EditorAppShell({ profile }: EditorAppShellProps) {
	const [mobileOpened] = useDisclosure();
	const [desktopOpened] = useDisclosure(true);
	const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
		useDisclosure(false);

	const isMobile = useMediaQuery(MQ.sm);

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
				<Sidebar profile={profile}  />
			</AppShell.Navbar>
			<AppShell.Main style={{ height: "100vh" }}>
				<Loading />
				<Viewer />
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
				<SkylineControls onOpenDrawer={openDrawer} />
				{isMobile && (
					<Drawer
						opened={drawerOpened}
						onClose={closeDrawer}
						position="bottom"
						size="xl"
						title={
							<Text
								flex={1}
								className="mona-sans-wide"
								tt="uppercase"
								size="md"
							>
								{import.meta.env.PUBLIC_APP_NAME}
							</Text>
						}
					>
						<Sidebar fromDrawer profile={profile} />
					</Drawer>
				)}
			</AppShell.Main>
		</AppShell>
	);
}

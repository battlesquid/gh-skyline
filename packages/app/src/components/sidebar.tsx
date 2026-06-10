import {
	Accordion,
	AppShell,
	Button,
	Card,
	Divider,
	ScrollArea,
	Stack,
	Title,
	Typography,
} from "@mantine/core";
import {
	IconBrandGithubFilled,
	IconCube,
	IconDownload,
	IconPaint,
	IconTextSize,
} from "@tabler/icons-react";
import type { UserProfile } from "../api/auth";
import accordionClasses from "../styles/accordion.module.css";
import { Profile } from "./profile";
import { BasePaddingInput } from "./sidebar/base-padding";
import { BaseShapeInput } from "./sidebar/base-shape";
import { ExportButton } from "./sidebar/export";
import { ExportFormatInput } from "./sidebar/export-format";
import { FilenameInput } from "./sidebar/filename";
import { FontInput } from "./sidebar/font";
import { GenerateSection } from "./sidebar/generate_section";
import { InsetTextCheckbox } from "./sidebar/inset-text";
import { RenderColorInput } from "./sidebar/render-color";
import { ScaleInput } from "./sidebar/scale";
import { ShareButton } from "./sidebar/share";
import { TowerDampeningInput } from "./sidebar/tower-dampening";
import { UsernameOverrideInput } from "./sidebar/username-override";
import { useContributionQueryStore } from "../stores/query";

interface SidebarProps {
	fromDrawer?: boolean;
	profile: UserProfile | null;
}

export function Sidebar(props: SidebarProps) {
	const { fromDrawer, profile } = props;

	const ok = useContributionQueryStore((state) => state.ok);

	return (
		<Stack h={"100%"} gap={10}>
			{!fromDrawer && (
				<AppShell.Section px={6} py={4}>
					<Title className="mona-sans-wide" tt="uppercase" order={5}>
						{import.meta.env.PUBLIC_APP_NAME}
					</Title>
				</AppShell.Section>
			)}
			<Card h="100%" p="md">
				<AppShell.Section
					style={{
						marginRight: "calc(var(--scrollarea-scrollbar-size, 0px) * -1)",
					}}
					grow
					component={ScrollArea}
					type="hover"
					offsetScrollbars
				>
					<Stack gap={10}>
						<GenerateSection ok={ok} login={profile?.login ?? ""} />
						<Divider />
						{/* <Title className="mona-sans-wide" tt="uppercase" order={5}>
							Settings
						</Title> */}
						<Accordion classNames={accordionClasses}>
							<Accordion.Item value="text_options">
								<Accordion.Control icon={<IconTextSize stroke={1} size={20} />}>
									<Title className="mona-sans-wide" tt="uppercase" order={6}>
										Text
									</Title>
								</Accordion.Control>
								<Accordion.Panel>
									<Stack>
										<UsernameOverrideInput />
										<FontInput />
										<InsetTextCheckbox />
									</Stack>
								</Accordion.Panel>
							</Accordion.Item>
							<Accordion.Item value="model_options">
								<Accordion.Control icon={<IconCube stroke={1} size={20} />}>
									<Title className="mona-sans-wide" tt="uppercase" order={6}>
										Model
									</Title>
								</Accordion.Control>
								<Accordion.Panel>
									<Stack>
										<TowerDampeningInput />
										<BasePaddingInput />
										<BaseShapeInput />
									</Stack>
								</Accordion.Panel>
							</Accordion.Item>
							<Accordion.Item value="display_options">
								<Accordion.Control icon={<IconPaint stroke={1} size={20} />}>
									<Title className="mona-sans-wide" tt="uppercase" order={6}>
										Render
									</Title>
								</Accordion.Control>
								<Accordion.Panel>
									<Stack gap={10}>
										<RenderColorInput />
									</Stack>
								</Accordion.Panel>
							</Accordion.Item>
							<Accordion.Item value="export_options">
								<Accordion.Control icon={<IconDownload stroke={1} size={20} />}>
									<Title className="mona-sans-wide" tt="uppercase" order={6}>
										Export
									</Title>
								</Accordion.Control>
								<Accordion.Panel>
									<Stack gap={10}>
										<FilenameInput />
										<ExportFormatInput />
										<ScaleInput />
									</Stack>
								</Accordion.Panel>
							</Accordion.Item>
						</Accordion>
					</Stack>
				</AppShell.Section>
				<AppShell.Section>
					<Stack gap="xs">
						<ShareButton />
						<ExportButton />
					</Stack>
				</AppShell.Section>
			</Card>
			<AppShell.Section>
				<Profile profile={profile} />
			</AppShell.Section>
			<AppShell.Section>
				<Button
					component="a"
					href="https://github.com/battlesquid/gh-skyline"
					target="_blank"
					size="xs"
					variant="default"
					leftSection={<IconBrandGithubFilled size={14} />}
					fullWidth
				>
					View on Github
				</Button>
			</AppShell.Section>
		</Stack>
	);
}

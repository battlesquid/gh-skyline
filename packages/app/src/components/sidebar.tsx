import {
	Accordion,
	AppShell,
	Button,
	Card,
	Divider,
	Group,
	ScrollArea,
	Stack,
	Title,
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
import { BasePaddingInput } from "./sidebar_inputs/base_padding";
import { BaseShapeInput } from "./sidebar_inputs/base_shape";
import { ExportButton } from "./sidebar_inputs/export";
import { ExportFormatInput } from "./sidebar_inputs/export_format";
import { FilenameInput } from "./sidebar_inputs/filename";
import { FontInput } from "./sidebar_inputs/font_input";
import { GenerateSection } from "./sidebar_inputs/generate_section";
import { InsetTextCheckbox } from "./sidebar_inputs/inset_text";
import { RenderColorInput } from "./sidebar_inputs/render_color";
import { ScaleInput } from "./sidebar_inputs/scale";
import { ShareButton } from "./sidebar_inputs/share";
import { TowerDampeningInput } from "./sidebar_inputs/tower_dampening";
import { UsernameOverrideInput } from "./sidebar_inputs/username_override";

interface SidebarProps {
	profile: UserProfile | null;
	ok: boolean;
}

export function Sidebar(props: SidebarProps) {
	const { profile, ok } = props;

	return (
		<Stack h={"100%"} gap={10}>
			<AppShell.Section px={6} py={4}>
				<Title order={4}>{import.meta.env.PUBLIC_APP_NAME}</Title>
			</AppShell.Section>
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
						<Title order={5}>Settings</Title>
						<Accordion classNames={accordionClasses}>
							<Accordion.Item value="text_options">
								<Accordion.Control icon={<IconTextSize stroke={1} size={20} />}>
									Text
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
									Model
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
									Render
								</Accordion.Control>
								<Accordion.Panel>
									<Stack gap={10}>
										<RenderColorInput />
									</Stack>
								</Accordion.Panel>
							</Accordion.Item>
							<Accordion.Item value="export_options">
								<Accordion.Control icon={<IconDownload stroke={1} size={20} />}>
									Export
								</Accordion.Control>
								<Accordion.Panel>
									<Stack gap={10}>
										<ScaleInput />
										<FilenameInput />
										<ExportFormatInput />
									</Stack>
								</Accordion.Panel>
							</Accordion.Item>
						</Accordion>
					</Stack>
				</AppShell.Section>
				<AppShell.Section>
					<Group gap="xs">
						<ShareButton />
						<ExportButton />
					</Group>
				</AppShell.Section>
			</Card>
			<AppShell.Section>
				<Profile profile={profile} />
			</AppShell.Section>
			<AppShell.Section>
				<Button
					component="a"
					href="https://github.com/battlesquid/skyline"
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

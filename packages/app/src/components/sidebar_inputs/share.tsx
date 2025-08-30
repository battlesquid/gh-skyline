import {
	ActionIcon,
	Button,
	CopyButton,
	Group,
	Popover,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";
import { IconCheck, IconCopy, IconShare2 } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { buildShareLinks } from "../../share/urlShare";
import { useParametersContext } from "../../stores/parameters";

export function ShareButton() {
	const [opened, setOpened] = useState(false);
	const inputs = useParametersContext((s) => s.inputs);
	const [minimal, setMinimal] = useState<string>("");
	const [full, setFull] = useState<string>("");

	useEffect(() => {
		if (!opened) return;
		const { minimal, full } = buildShareLinks(inputs);
		setMinimal(minimal);
		setFull(full);
	}, [opened, inputs]);

	return (
		<Popover opened={opened} onChange={setOpened} position="top" withArrow>
			<Popover.Target>
				<Button
					variant="light"
					onClick={() => setOpened((v) => !v)}
					leftSection={<IconShare2 size={16} />}
				>
					<Text className="mona-sans-wide" tt="uppercase" fw={900} size="xs">
						Share
					</Text>
				</Button>
			</Popover.Target>
			<Popover.Dropdown>
				<Stack gap={8} w={280}>
					<Text size="sm" fw={600}>
						Share Options
					</Text>
					<Group gap="xs" wrap="nowrap">
						<Text size="xs" style={{ flex: 1 }}>
							Username + Year Range
						</Text>
						<CopyButton value={minimal} timeout={2000}>
							{({ copied, copy }) => (
								<Tooltip label={copied ? "Copied" : "Copy link"} withArrow>
									<ActionIcon
										onClick={copy}
										variant="subtle"
										color={copied ? "teal" : "gray"}
									>
										{copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
									</ActionIcon>
								</Tooltip>
							)}
						</CopyButton>
					</Group>
					<Group gap="xs" wrap="nowrap">
						<Text size="xs" style={{ flex: 1 }}>
							Username + Years + Model/Render
						</Text>
						<CopyButton value={full} timeout={2000}>
							{({ copied, copy }) => (
								<Tooltip label={copied ? "Copied" : "Copy link"} withArrow>
									<ActionIcon
										onClick={copy}
										variant="subtle"
										color={copied ? "teal" : "gray"}
									>
										{copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
									</ActionIcon>
								</Tooltip>
							)}
						</CopyButton>
					</Group>
					<Text size="xs" c="dimmed">
						Fonts are not yet included in shared links.
					</Text>
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
}

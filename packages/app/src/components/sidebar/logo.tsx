import {
	ActionIcon,
	FileButton,
	NumberInput,
	Select,
	Stack,
} from "@mantine/core";
import { IconFolder } from "@tabler/icons-react";
import { useState } from "react";
import { DEFAULT_LOGO_SELECTION, useLogoStore } from "@/stores/logos";
import { useParametersContext } from "@/stores/parameters";
import { safeFloat } from "@/utils";

export function LogoInput() {
	const logo = useParametersContext((state) => state.inputs.logo);
	const logoScale = useParametersContext((state) => state.inputs.logoScale);
	const logoOffset = useParametersContext((state) => state.inputs.logoOffset);
	const setInputs = useParametersContext((state) => state.setInputs);
	const logos = useLogoStore((state) => state.logos);
	const addLogo = useLogoStore((state) => state.addLogo);
	const [logoLoadFailed, setLogoLoadFailed] = useState(false);

	return (
		<Stack gap={10}>
			<div style={{ display: "flex", columnGap: "0.5rem" }}>
				<Select
					style={{ flex: 1 }}
					label="Logo"
					data={Object.keys(logos)}
					value={logo}
					defaultValue={DEFAULT_LOGO_SELECTION}
					allowDeselect={false}
					scrollAreaProps={{ type: "always" }}
					onChange={(value) => {
						if (value === null) {
							return;
						}
						setInputs({ logo: value });
					}}
					error={logoLoadFailed ? "Unable to load logo" : ""}
				/>
				<Stack gap={0}>
					<wbr />
					<FileButton
						onChange={async (file) => {
							setLogoLoadFailed(false);
							if (file === null) {
								return;
							}
							const name = file.name.replace(/\.svg$/i, "");
							const svg = await file.text();
							if (addLogo(name, svg)) {
								setInputs({ logo: name });
							} else {
								setLogoLoadFailed(true);
							}
						}}
						accept="image/svg+xml"
					>
						{(props) => (
							<ActionIcon variant="light" size="input-sm" {...props}>
								<IconFolder stroke={1} />
							</ActionIcon>
						)}
					</FileButton>
				</Stack>
			</div>
			<NumberInput
				label="Logo Size"
				min={0.1}
				step={0.1}
				value={logoScale}
				clampBehavior="strict"
				allowNegative={false}
				allowLeadingZeros={false}
				onChange={(value) => setInputs({ logoScale: safeFloat(value, 0.1) })}
			/>
			<NumberInput
				label="Logo Offset"
				min={0}
				step={0.5}
				value={logoOffset}
				clampBehavior="strict"
				allowNegative={false}
				allowLeadingZeros={false}
				onChange={(value) => setInputs({ logoOffset: safeFloat(value, 0) })}
			/>
		</Stack>
	);
}

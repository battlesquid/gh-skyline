import { Select } from "@mantine/core";
import { useState } from "react";
import { DEFAULT_FONT_SELECTION, useFontStore } from "../../stores/fonts";
import { useParametersContext } from "../../stores/parameters";

// TODO: re-implement font loading using ttf format

export function FontInput() {
	const setInputs = useParametersContext((state) => state.setInputs);
	const [fontLoadFailed] = useState(false);
	const fonts = useFontStore((state) => state.fonts);

	return (
		<div style={{ display: "flex", columnGap: "0.5rem" }}>
			<Select
				style={{ flex: 1 }}
				label="Font"
				data={Object.keys(fonts)}
				defaultValue={DEFAULT_FONT_SELECTION}
				allowDeselect={false}
				scrollAreaProps={{
					type: "always",
				}}
				onChange={(value) => {
					if (value === null) {
						return;
					}
					setInputs({ font: fonts[value] });
				}}
				error={fontLoadFailed ? "Unable to load font" : ""}
			/>
			{/* <Stack gap={0}>
				<wbr />
				<FileButton
					onChange={async (file) => {
						setFontLoadFailed(false);
						if (file === null) {
							return;
						}
						const name = file.name.split(".")[0];
						const data = await file.text();
						try {
							setFontLoadFailed(!addFont(name, JSON.parse(data)));
						} catch (e) {
							console.error(e);
						}
					}}
					accept="application/json"
				>
					{(props) => (
						<ActionIcon variant="light" size="input-sm" {...props}>
							<IconFolder stroke={1} />
						</ActionIcon>
					)}
				</FileButton>
			</Stack> */}
		</div>
	);
}

import { Group, Stack, Text } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { IconFile, IconUpload, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { parseCustomData } from "../../custom_data";
import { useParametersContext } from "../../stores/parameters";

export function CustomDataInput() {
	const setInputs = useParametersContext((state) => state.setInputs);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	return (
		<Stack gap="xs">
			<Dropzone
				onDrop={async ([file]) => {
					setError(null);
					setLoading(true);
					try {
						const customData = await parseCustomData(
							await file.text(),
							file.name,
						);
						setInputs({ customData });
					} catch (error) {
						setError(
							error instanceof Error
								? error.message
								: "Unable to import the file.",
						);
					} finally {
						setLoading(false);
					}
				}}
				onReject={() => setError("Choose one CSV or JSON file.")}
				accept={{ "application/json": [".json"], "text/csv": [".csv"] }}
				multiple={false}
				loading={loading}
			>
				<Group
					justify="center"
					gap="sm"
					mih={140}
					style={{ pointerEvents: "none" }}
				>
					<Dropzone.Accept>
						<IconUpload
							size={52}
							color="var(--mantine-color-blue-6)"
							stroke={1.5}
						/>
					</Dropzone.Accept>
					<Dropzone.Reject>
						<IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
					</Dropzone.Reject>
					<Dropzone.Idle>
						<IconFile
							size={52}
							color="var(--mantine-color-dimmed)"
							stroke={1.5}
						/>
					</Dropzone.Idle>

					<Text size="sm" inline>
						Drop a CSV or JSON file here, or click to browse
					</Text>
				</Group>
			</Dropzone>
			{error && (
				<Text role="alert" c="red" size="sm">
					{error}
				</Text>
			)}
		</Stack>
	);
}

import { Group, Text } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";

export function CustomDataInput() {


    return (
        <Dropzone
            onDrop={async ([file]) => {
                const [name, ext] = file.name.split(".");
                const data = await file.text();
            }}
            onReject={(files) => console.log('rejected files', files)}
            accept={["application/json", "text/csv"]}
            maxFiles={1}
            
        >
            <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
                <Dropzone.Accept>
                    <IconUpload size={52} color="var(--mantine-color-blue-6)" stroke={1.5} />
                </Dropzone.Accept>
                <Dropzone.Reject>
                    <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
                </Dropzone.Reject>
                <Dropzone.Idle>
                    <IconPhoto size={52} color="var(--mantine-color-dimmed)" stroke={1.5} />
                </Dropzone.Idle>

                <div>
                    <Text size="xl" inline>
                        Drag a CSV or JSON file here
                    </Text>
                    <Text size="sm" c="dimmed" inline mt={7}>
                        Github Skyline will use the first record to validate the rest. Please ensure at least a field for the date and a field for the number of contributions exists in each record.
                    </Text>
                </div>
            </Group>
        </Dropzone>
    )
}
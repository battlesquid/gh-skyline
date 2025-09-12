import { Group, Text } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";
import csv from "csvtojson";
import { isNullish } from "../../utils";
import { ContributionDay, ContributionWeeks } from "../../api/types";

const toJSON = async (data: string, ext: string): Promise<Record<string, unknown>[]> => {
    if (ext === "csv") {
        const result = await csv({ output: "json" }).fromString(data);
        return result as Record<string, unknown>[];
    }
    return JSON.parse(data) as Record<string, unknown>[];
}

type ParseResult = {
    error: string | undefined;
    data: Record<string, unknown>[];
}

const isDate = (value: unknown) => /\d{4}-\d{2}\d{2}/.test(`${value}`);
const isNumber = (value: unknown) => /\d+/.test(`${value}`);

const parseRecord = (record: Record<string, unknown>, dateKey: string, countKey: string): ContributionDay => {
    const date = new Date(record[dateKey] as string);
    const contributionCount = Number.parseInt(`${record[countKey]}`);
    const weekday = date.getUTCDay();
    const color = "#40c463";
    return {
        date,
        contributionCount,
        weekday,
        color
    }
}

const parseRecords = (data: Record<string, unknown>[]): ParseResult => {
    const [baseline, ...rest] = data;
    let dateKey: string | undefined;
    let countKey: string | undefined;
    for (const [key, value] of Object.entries(baseline)) {
        if (dateKey === undefined && isDate(value)) {
            dateKey = key;
            continue;
        }
        if (countKey === undefined && isNumber(value)) {
            countKey = key;
        }
        if (dateKey !== undefined && countKey !== undefined) {
            break;
        }
    }
    if (dateKey === undefined || countKey === undefined) {
        return {
            error: "Unable to resolve fields for date and contribution count.",
            data: []
        }
    }
    const valid = rest.every(entry => isDate(entry[dateKey]) && isNumber(entry[dateKey]));
    if (!valid) {
        return {
            error: `Found a record that does not conform to inferred schema (dateKey: ${dateKey}, countKey: ${countKey})`,
            data: []
        }
    }
    const weeks: ContributionWeeks[] = [[]];
    const parsedBaseline = parseRecord(baseline, dateKey, countKey);
    let prevWeekday = parsedBaseline.weekday;
    let yearIdx = 0;
    for (const record of data) {
        const parsed = parseRecord(record, dateKey, countKey);
    }
}

export function CustomDataInput() {


    return (
        <Dropzone
            onDrop={async ([file]) => {
                const [name, ext] = file.name.split(".");
                const data = await file.text();
                const json = await toJSON(data, ext);
            }}
            onReject={(files) => console.log('rejected files', files)}
            accept={["application/json", "text/csv"]}
            maxFiles={1}

        >
            <Group justify="center" gap="sm" mih={140} style={{ pointerEvents: 'none' }}>
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

                </div>
            </Group>
        </Dropzone>
    )
}
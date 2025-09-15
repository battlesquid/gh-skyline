import { Group, Text } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { IconFile, IconUpload, IconX } from "@tabler/icons-react";
import csv from "csvtojson";
import { ContributionDay, ContributionWeeks } from "../../api/types";
import { useParametersContext } from "../../stores/parameters";

const toJSON = async (data: string, ext: string): Promise<Record<string, unknown>[]> => {
    if (ext === "csv") {
        const result = await csv({ output: "json" }).fromString(data);
        return result as Record<string, unknown>[];
    }
    return JSON.parse(data) as Record<string, unknown>[];
}

type ParseResult = {
    error: string | null;
    data: ContributionWeeks[];
}

const isDate = (value: unknown) => !isNaN(new Date(`${value}`).getTime());
const isNumber = (value: unknown) => /\d+/.test(`${value}`);

const toContributionDay = (record: Record<string, unknown>, dateKey: string, countKey: string): ContributionDay => {
    const date = new Date(record[dateKey] as string);
    const contributionCount = Number.parseInt(`${record[countKey]}`);
    const weekday = date.getUTCDay();
    const color = "";
    return {
        date,
        contributionCount,
        weekday,
        color
    }
}

const toContributionCalendar = (data: Record<string, unknown>[]): ParseResult => {
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
        };
    }
    const valid = rest.every(entry => isDate(entry[dateKey]) && isNumber(entry[dateKey]));
    if (!valid) {
        return {
            error: `Found a record that does not conform to inferred schema (dateKey: ${dateKey}, countKey: ${countKey})`,
            data: []
        };
    }
    const records = data
        .map(d => toContributionDay(d, dateKey, countKey))
        .sort((r1, r2) => r1.date.getTime() - r2.date.getTime());
    const START_YEAR = records[0].date.getUTCFullYear();
    const years: ContributionWeeks[] = records.reduce<ContributionWeeks[]>((acc, curr) => {
        const idx = curr.date.getUTCFullYear() - START_YEAR;
        acc[idx] ??= [];
        if (curr.weekday === 0 || acc[idx].at(-1) === undefined) {
            acc[idx].push({
                contributionDays: [],
                firstDay: curr.date
            });
        }
        acc[idx].at(-1)!.contributionDays.push(curr);
        return acc;
    }, []);

    return {
        error: null,
        data: years
    };
}

export function CustomDataInput() {
    const setInputs = useParametersContext((state) => state.setInputs);
    return (
        <Dropzone
            onDrop={async ([file]) => {
                const [, ext] = file.name.split(".");
                const data = await file.text();
                const json = await toJSON(data, ext);
                const { error, data: years } = toContributionCalendar(json);
                if (error === null) {
                    setInputs({ customData: years });
                }
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
                    <IconFile size={52} color="var(--mantine-color-dimmed)" stroke={1.5} />
                </Dropzone.Idle>

                <div>
                    <Text size="sm" inline>
                        Drag a CSV or JSON file here
                    </Text>

                </div>
            </Group>
        </Dropzone>
    )
}
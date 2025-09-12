import { Button, Group, NumberInput, Stack } from "@mantine/core";
import { useValidatedState } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { getParametersStore, useParametersContext } from "../../stores/parameters";
import type { GenerateSectionProps } from "./generate_section";
import { GitHubUsernameInput } from "./github_username_input";

export const MIN_START_YEAR = 2000;

export function GithubDataInput(props: GenerateSectionProps) {
    const { ok } = props;
    const initialStartYear =
        getParametersStore().getInitialState().inputs.startYear;
    const initialEndYear = getParametersStore().getInitialState().inputs.endYear;
    const setInputs = useParametersContext((state) => state.setInputs);
    const nameFromStore = useParametersContext((state) => state.inputs.name);

    const [name, setName] = useState(nameFromStore);
    const [modified, setModified] = useState(false);

    const [
        {
            value: startYear,
            lastValidValue: lastValidStartYear,
            valid: startYearValid,
        },
        setStartYear,
    ] = useValidatedState<string | number>(
        initialStartYear,
        (value) => {
            if (typeof value === "string" && value.trim() === "") {
                return false;
            }
            return true;
        },
        true,
    );

    const [
        { value: endYear, lastValidValue: lastValidEndYear, valid: endYearValid },
        setEndYear,
    ] = useValidatedState<string | number>(
        initialEndYear,
        (value) => {
            if (typeof value === "string" && value.trim() === "") {
                return false;
            }
            return true;
        },
        true,
    );

    useEffect(() => {
        setModified(false);
    }, [ok]);

    useEffect(() => {
        setName(nameFromStore);
    }, [nameFromStore]);

    useEffect(() => {
        if (!ok) {
            setModified(true);
        }
    }, [name]);
    return (
        <Stack gap={10}>
            <GitHubUsernameInput
                label="Github Username"
                placeholder="Github Username"
                value={name}
                onChange={setName}
                error={ok || modified ? "" : `Unable to find profile for "${name}".`}
            />
            <Group grow>
                <NumberInput
                    label="Start Year"
                    placeholder="Start Year"
                    min={MIN_START_YEAR}
                    max={new Date().getFullYear()}
                    allowNegative={false}
                    allowDecimal={false}
                    allowLeadingZeros={false}
                    stepHoldDelay={500}
                    stepHoldInterval={100}
                    value={startYear}
                    onBlur={() => {
                        let currentStartYear = startYear;
                        if (!startYearValid && lastValidStartYear !== undefined) {
                            setStartYear(lastValidStartYear);
                            currentStartYear = lastValidStartYear;
                        }
                        if (currentStartYear > endYear) {
                            setEndYear(
                                Math.min(new Date().getFullYear(), currentStartYear as number),
                            );
                        }
                    }}
                    onChange={setStartYear}
                />
                <NumberInput
                    label="End Year"
                    placeholder="End Year"
                    min={MIN_START_YEAR}
                    max={new Date().getFullYear()}
                    allowNegative={false}
                    allowDecimal={false}
                    allowLeadingZeros={false}
                    stepHoldDelay={500}
                    stepHoldInterval={100}
                    value={endYear}
                    onBlur={() => {
                        let currentEndYear = endYear;
                        if (!endYearValid && lastValidEndYear !== undefined) {
                            setEndYear(lastValidEndYear);
                            currentEndYear = lastValidEndYear;
                        }
                        if (currentEndYear < startYear) {
                            setStartYear(
                                Math.min(new Date().getFullYear(), currentEndYear as number),
                            );
                        }
                    }}
                    onChange={setEndYear}
                />
            </Group>
            <Button
                fullWidth
                className="mona-sans-wide"
                tt="uppercase"
                disabled={name.trim() === ""}
                variant="light"
                size="xs"
                onClick={() =>
                    setInputs({
                        name,
                        startYear: startYear as number,
                        endYear: endYear as number,
                    })
                }
            >
                Generate
            </Button>
        </Stack>
    )
}
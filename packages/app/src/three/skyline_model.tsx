import { Instances, useBounds } from "@react-three/drei";
import {
    type MutableRefObject,
    useEffect,
    useState
} from "react";
import { Color, type Group as ThreeGroup } from "three";
import type {
    ContributionDay,
    ContributionWeek,
    ContributionWeeks,
} from "../api/types";
import { getFirstDayOffset } from "../api/utils";
import { useBoundingBox } from "../hooks/useBoundingBox";
import { useControlsStore } from "../stores/controls";
import { useModelStore } from "../stores/model";
import { DEFAULT_INPUT_PARAMETERS, useParametersContext } from "../stores/parameters";
import { ContributionTower } from "./contribution_tower";
import type { SkylineProps } from "./skyline";
import { SkylineBase } from "./skyline_base";
import { SkylineObjectNames } from "./utils";

interface TowersRender {
    towers: (JSX.Element | null)[];
    count: number;
}

export interface SkylineModelProps extends SkylineProps {
    group: MutableRefObject<ThreeGroup | null>;
}

export function SkylineModel({
    group,
    years
}: SkylineModelProps) {
    const [initialized, setInitialized] = useState(false);
    const computed = useParametersContext((state) => state.computed);
    const inputs = useParametersContext((state) => state.inputs);

    const setDirty = useModelStore((state) => state.setDirty);
    const setSize = useModelStore((state) => state.setSize);
    const setModel = useModelStore((state) => state.setModel);

    const reset = useControlsStore((state) => state.reset);
    const clearReset = useControlsStore((state) => state.clearReset);

    const bounds = useBounds();
    let boundsTimeout: number | undefined;
    const clearBoundsTimeout = () => {
        if (boundsTimeout !== undefined) {
            clearTimeout(boundsTimeout);
        }
    };

    useEffect(() => {
        clearTimeout(boundsTimeout);
        setDirty(true);
        boundsTimeout = setTimeout(() => {
            if (group.current === null) {
                return;
            }
            setDirty(false);
            if (initialized) {
                bounds.refresh().clip().fit();
            } else {
                setInitialized(true);
            }
            setModel(group.current.clone());
        }, 1500);

        return clearBoundsTimeout;
    }, [
        inputs.dampening,
        inputs.name,
        inputs.nameOverride,
        inputs.startYear,
        inputs.endYear,
        inputs.padding,
        inputs.font,
        inputs.shape,
        inputs.insetText,
        inputs.showContributionColor,
    ]);

    useEffect(() => {
        if (reset === null) {
            return;
        }
        bounds.refresh().clip().fit().reset();
        clearReset();
    }, [reset]);

    useBoundingBox(
        {
            obj: group,
            setter: setSize,
        },
        [inputs, years],
    );

    const renderDay = (
        day: ContributionDay,
        yearIdx: number,
        weekIdx: number,
        weekOffset: number,
        dayIdx: number,
    ) => {
        if (day.contributionCount === 0) {
            return null;
        }
        const YEAR_OFFSET = computed.modelWidth * yearIdx;
        const centerOffset =
            years.length === 1 ? 0 : -(computed.modelWidth * (years.length - 1)) / 2;
        const color = new Color(inputs.showContributionColor ? day.color : inputs.color);
        return (
            <ContributionTower
                key={day.date.toString()}
                day={day}
                color={color}
                x={
                    weekIdx * inputs.towerSize -
                    computed.halfModelLength +
                    computed.towerSizeOffset
                }
                y={
                    centerOffset +
                    YEAR_OFFSET +
                    ((dayIdx + weekOffset) * inputs.towerSize -
                        computed.halfModelWidth +
                        computed.towerSizeOffset)
                }
                size={DEFAULT_INPUT_PARAMETERS.towerSize}
                dampening={inputs.dampening}
            />
        );
    };

    const renderWeek = (
        week: ContributionWeek,
        yearIdx: number,
        weekIdx: number,
        weekOffset: number,
    ) => {
        return week.contributionDays.reduce<TowersRender>(
            (prev, day, dayIdx) => {
                const tower = renderDay(day, yearIdx, weekIdx, weekOffset, dayIdx);
                const count = +(tower !== null);
                return { towers: prev.towers.concat(tower), count: prev.count + count };
            },
            { towers: [], count: 0 }
        );
    };

    const renderYear = (
        weeks: ContributionWeeks,
        yearIdx: number,
    ) => {
        return weeks.reduce<TowersRender>(
            (prev, week, weekIdx) => {
                const weekOffset = weekIdx === 0
                    ? getFirstDayOffset(week, weekIdx)
                    : 0;
                const { towers, count } = renderWeek(week, yearIdx, weekIdx, weekOffset);
                return { towers: prev.towers.concat(towers), count: prev.count + count }
            },
            { towers: [], count: 0 }
        );
    };

    const render = () => {
        return years.reduce<TowersRender>(
            (prev, weeks, yearIdx) => {
                const { towers, count } = renderYear(weeks, yearIdx)
                return { towers: prev.towers.concat(towers), count: prev.count + count }
            },
            { towers: [], count: 0 }
        );
    };

    const { towers, count } = render();

    return (
        <group ref={group}>
            <group name={SkylineObjectNames.TowersExportGroup} />
            {count > 0 && (
                <group name={SkylineObjectNames.TowersParent}>
                    <Instances
                        name={SkylineObjectNames.Towers}
                        key={`${inputs.name}-${computed.formattedYear}-${inputs.showContributionColor}`}
                        limit={count}
                        castShadow
                        receiveShadow
                    >
                        <boxGeometry />
                        <meshStandardMaterial />
                        {towers}
                    </Instances>
                </group>
            )}
            <SkylineBase years={years} />
        </group>
    );
}

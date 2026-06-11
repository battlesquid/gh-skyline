import { darken } from "@mantine/core";
import { Instances } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import { type JSX, type RefObject, useEffect } from "react";
import { Color, type Group as ThreeGroup } from "three";
import type {
	ContributionDay,
	ContributionWeek,
	ContributionWeeks,
} from "@/api/types";
import { getFirstDayOffset } from "@/api/utils";
import { useModelStore } from "@/stores/model";
import {
	DEFAULT_INPUT_PARAMETERS,
	useParametersContext,
} from "@/stores/parameters";
import { useContributionQueryStore } from "@/stores/query";
import { GROUPS } from "../utils/constants";
import { SkylineBase } from "./base";
import { ContributionTower } from "./tower";

interface TowersRender {
	towers: (JSX.Element | null)[];
	count: number;
}

export interface SkylineModelProps {
	group: RefObject<ThreeGroup | null>;
}

export function SkylineModel({ group }: SkylineModelProps) {
	const computed = useParametersContext((state) => state.computed);
	const inputs = useParametersContext((state) => state.inputs);

	const setModel = useModelStore((state) => state.setModel);
	const years = useContributionQueryStore((state) => state.results);

	let boundsTimeout: number | undefined;
	const clearBoundsTimeout = () => {
		if (boundsTimeout !== undefined) {
			clearTimeout(boundsTimeout);
		}
	};

	useEffect(() => {
		clearTimeout(boundsTimeout);
		boundsTimeout = setTimeout(() => {
			if (group.current === null) {
				return;
			}
			setModel(group.current.clone());
		}, 1000);

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
		inputs.logo,
		inputs.logoScale,
		inputs.logoOffset,
	]);

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
		const color = new Color(
			inputs.showContributionColor ? darken(day.color, 0.2) : inputs.color,
		);

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
			{ towers: [], count: 0 },
		);
	};

	const renderYear = (weeks: ContributionWeeks, yearIdx: number) => {
		return weeks.reduce<TowersRender>(
			(prev, week, weekIdx) => {
				const weekOffset = weekIdx === 0 ? getFirstDayOffset(week, weekIdx) : 0;
				const { towers, count } = renderWeek(
					week,
					yearIdx,
					weekIdx,
					weekOffset,
				);
				return {
					towers: prev.towers.concat(towers),
					count: prev.count + count,
				};
			},
			{ towers: [], count: 0 },
		);
	};

	const render = () => {
		return years.reduce<TowersRender>(
			(prev, weeks, yearIdx) => {
				const { towers, count } = renderYear(weeks, yearIdx);
				return {
					towers: prev.towers.concat(towers),
					count: prev.count + count,
				};
			},
			{ towers: [], count: 0 },
		);
	};

	const { towers, count } = render();

	return (
		<group ref={group}>
			<group name={GROUPS.TOWERS_EXPORT} />
			<Select enabled>
				{count > 0 && (
					<group name={GROUPS.TOWERS_PARENT}>
						<Instances
							name={GROUPS.TOWERS}
							key={`${inputs.name}-${computed.formattedYear}-${inputs.showContributionColor}`}
							limit={count}
							castShadow
							receiveShadow
						>
							<boxGeometry />
							<meshStandardMaterial roughness={0.5} metalness={0.2} />
							{towers}
						</Instances>
					</group>
				)}
				<SkylineBase />
			</Select>
		</group>
	);
}

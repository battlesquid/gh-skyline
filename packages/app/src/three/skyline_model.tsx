import { darken } from "@mantine/core";
import { Instances } from "@react-three/drei";
import { type MutableRefObject, useEffect, useMemo } from "react";
import { Color, type Group as ThreeGroup } from "three";
import { useShallow } from "zustand/shallow";
import { getHeatmapColors } from "../heatmap";
import { useModelStore } from "../stores/model";
import {
	DEFAULT_INPUT_PARAMETERS,
	SkylineDatasource,
	useParametersContext,
} from "../stores/parameters";
import { getWeekNo } from "../utils";
import { ContributionTower } from "./contribution_tower";
import type { SkylineProps } from "./skyline";
import { SkylineBase } from "./skyline_base";
import { SkylineObjectNames } from "./utils";

export interface SkylineModelProps extends SkylineProps {
	group: MutableRefObject<ThreeGroup | null>;
}

export function SkylineModel({ group, years }: SkylineModelProps) {
	const computed = useParametersContext(useShallow((state) => state.computed));
	const inputs = useParametersContext(useShallow((state) => state.inputs));
	const isCustom = inputs.datasource === SkylineDatasource.Custom;
	const towersByYear = useMemo(
		() =>
			years.map((weeks) => {
				const days = weeks
					.flatMap((week) => week.contributionDays)
					.filter((day) => day.contributionCount > 0);
				const colors =
					isCustom && inputs.showContributionColor
						? getHeatmapColors(days, (day) => day.contributionCount)
						: null;
				return days.map((day, index) => {
					const date = new Date(day.date);
					return {
						day,
						weekIndex: getWeekNo(date),
						weekday: date.getUTCDay(),
						color: colors?.[index],
					};
				});
			}),
		[years, isCustom, inputs.showContributionColor],
	);

	const setDirty = useModelStore(useShallow((state) => state.setDirty));
	const setModel = useModelStore((state) => state.setModel);

	useEffect(() => {
		setDirty(true);
		const exportTimeout = setTimeout(() => {
			if (group.current === null) {
				return;
			}
			setDirty(false);
			setModel(group.current.clone());
		}, 1000);

		return () => clearTimeout(exportTimeout);
	}, [
		years,
		inputs.datasource,
		inputs.dampening,
		inputs.name,
		inputs.nameOverride,
		inputs.startYear,
		inputs.endYear,
		inputs.padding,
		inputs.font,
		inputs.shape,
		inputs.insetText,
		inputs.color,
		inputs.showContributionColor,
	]);

	const centerOffset = -(computed.modelWidth * (years.length - 1)) / 2;
	const towers = towersByYear.flatMap((days, yearIdx) =>
		days.map(({ day, weekIndex, weekday, color }) => (
			<ContributionTower
				key={day.date.toString()}
				day={day}
				color={
					new Color(
						inputs.showContributionColor
							? (color ?? darken(day.color, 0.2))
							: inputs.color,
					)
				}
				x={
					weekIndex * inputs.towerSize -
					computed.halfModelLength +
					computed.towerSizeOffset
				}
				y={
					centerOffset +
					computed.modelWidth * yearIdx +
					weekday * inputs.towerSize -
					computed.halfModelWidth +
					computed.towerSizeOffset
				}
				size={DEFAULT_INPUT_PARAMETERS.towerSize}
				dampening={inputs.dampening}
			/>
		)),
	);
	const count = towers.length;

	return (
		<group ref={group}>
			<group name={SkylineObjectNames.TowersExportGroup} />
			{count > 0 && (
				<group name={SkylineObjectNames.TowersParent}>
					<Instances
						name={SkylineObjectNames.Towers}
						key={`${count}-${inputs.name}-${computed.formattedYear}-${inputs.showContributionColor}`}
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
			<SkylineBase years={years} />
		</group>
	);
}

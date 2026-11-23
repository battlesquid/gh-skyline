import { darken } from "@mantine/core";
import { Box3, Vector3 } from "three";
import { DAYS_IN_WEEK } from "../api/constants";
import type { ContributionDay, ContributionWeeks } from "../api/types";
import { getHeatmapColors } from "../heatmap";
import { getWeekNo } from "../utils";
import { measureWork } from "./pipeline_metrics";

type TowerDay = {
	day: ContributionDay;
	week: number;
	weekday: number;
	heatmap: string;
};
export type TowerYear = { year: number; days: readonly TowerDay[] };
type CachedYear = TowerYear & { input: ContributionWeeks; signature: string };

export function reconcileTowerYears(
	years: ContributionWeeks[],
	firstYear: number,
	previous: readonly CachedYear[],
): CachedYear[] {
	const byYear = new Map(previous.map((year) => [year.year, year]));
	return years.map((input, index) => {
		const year = firstYear + index;
		const cached = byYear.get(year);
		if (cached?.input === input) return cached;
		const days = input.flatMap((week) => week.contributionDays);
		const signature = JSON.stringify(
			days.map(({ date, contributionCount, color }) => [
				new Date(date).getTime(),
				contributionCount,
				color,
			]),
		);
		if (cached?.signature === signature) return { ...cached, input };
		return measureWork("tower data", () => {
			const positive = days.filter((day) => day.contributionCount > 0);
			const heat = getHeatmapColors(positive, (day) => day.contributionCount);
			return {
				year,
				input,
				signature,
				days: positive.map((day, i) => {
					const date = new Date(day.date);
					return {
						day,
						week: getWeekNo(date),
						weekday: date.getUTCDay(),
						heatmap: heat[i],
					};
				}),
			};
		});
	});
}

export interface TowerSettings {
	size: number;
	width: number;
	dampening: number;
}

export interface TowerPaint {
	color: string;
	showContributionColor: boolean;
	custom: boolean;
}

export function towerColor(tower: TowerDay, paint: TowerPaint) {
	if (!paint.showContributionColor) return paint.color;
	return paint.custom ? tower.heatmap : darken(tower.day.color, 0.2);
}

export function towerBox(tower: TowerDay, settings: TowerSettings, origin = 0) {
	const { size, width, dampening } = settings;
	return {
		x: (tower.week + 0.5) * size - width / 2,
		z: (tower.weekday + 0.5 - DAYS_IN_WEEK / 2) * size + origin,
		height: (tower.day.contributionCount * size) / dampening,
	};
}

export function towerBounds(year: TowerYear, settings: TowerSettings) {
	const box = new Box3();
	const point = new Vector3();
	const half = settings.size / 2;
	for (const tower of year.days) {
		const { x, z, height } = towerBox(tower, settings);
		box.expandByPoint(point.set(x - half, 0, z - half));
		box.expandByPoint(point.set(x + half, height, z + half));
	}
	return box;
}

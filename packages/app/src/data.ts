import type { ContributionWeeks } from "./api/types";

const createSampleYear = (): ContributionWeeks => {
	const year = 2025;
	const weeks: ContributionWeeks = [];
	// A fixed seed keeps the preview consistent across reloads.
	let seed = year;
	const roll = () => {
		seed = (seed * 16807) % 2147483647;
		return seed / 2147483647;
	};
	let busyWeek = false;

	for (let day = 1; day <= 365; day++) {
		const date = new Date(Date.UTC(year, 0, day));
		const weekday = date.getUTCDay();
		if (weekday === 0 || weeks.length === 0) {
			weeks.push({ firstDay: date, contributionDays: [] });
			busyWeek = roll() < 0.45;
		}

		const weekend = weekday === 0 || weekday === 6;
		const activityChance = (busyWeek ? 0.82 : 0.5) - (weekend ? 0.25 : 0);
		const contributionCount =
			roll() < activityChance ? 1 + Math.floor(roll() * 32) : 0;
		weeks[weeks.length - 1].contributionDays.push({
			date,
			weekday,
			contributionCount,
			color: "",
		});
	}

	return weeks;
};

export const SAMPLE_DATA: ContributionWeeks[] = [createSampleYear()];

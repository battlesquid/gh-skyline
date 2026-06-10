import type { ContributionWeek } from "@/api/types";

export const getFirstDayOffset = (
	week: ContributionWeek,
	weekNo: number,
): number => {
	return weekNo === 0 ? new Date(week.firstDay).getUTCDay() : 0;
};

export const formatYearText = (start: number, end: number) => {
	if (start === end) {
		return `${start}`;
	}
	return `${start}-${end}`;
};

export const capitalize = (input: string) =>
	`${input.at(0)?.toUpperCase()}${input.substring(1)}`;

export const safeFloat = (value: string | number, min: number) => {
	if (value === "") {
		return min;
	}
	const safeValue = Number.parseFloat(`${value}`);
	return Math.max(safeValue, min);
};

export const safeInt = (value: string | number, min: number) => {
	if (value === "") {
		return min;
	}
	const safeValue = Number.parseInt(`${value}`);
	return Math.max(safeValue, min);
};

export const safeString = (value: string, fallback: string) => {
	return value.trim() !== "" ? value : fallback;
};

// Sunday-based column relative to the week containing January 1.
export const getWeekNo = (date: Date) => {
	const yearStart = new Date(date);
	yearStart.setUTCMonth(0, 1);
	yearStart.setUTCHours(0, 0, 0, 0);
	return Math.floor(
		((date.getTime() - yearStart.getTime()) / 86400000 +
			yearStart.getUTCDay()) /
			7,
	);
};

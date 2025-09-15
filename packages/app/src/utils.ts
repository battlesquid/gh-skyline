export const capitalize = (input: string) =>
	`${input.at(0)?.toUpperCase()}${input.substring(1)}`;

export const getSvgBoundingBox = (svg: string) => {
	const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	el.setAttribute(
		"style",
		"width:0!important; height:0!important; position:fixed!important; overflow:hidden!important; visibility:hidden!important; opacity:0!important",
	);
	el.innerHTML = svg;
	document.body.append(el);
	const { width, height } = el.getBBox();
	document.body.removeChild(el);
	return {
		width,
		height,
	};
};

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

export const isNullish = (value: unknown): value is null | undefined => {
	if (value === null || value === undefined) {
		return true;
	}
	return false;
};

// gets the week number relative to the year
export const getWeekNo = (date: Date) => {
	const d = new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
	);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return (
		Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7) - 1
	);
}
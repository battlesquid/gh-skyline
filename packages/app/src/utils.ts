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

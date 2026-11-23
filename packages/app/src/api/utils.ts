export const formatYearText = (start: number, end: number) => {
	if (start === end) {
		return `${start}`;
	}
	return `${start}-${end}`;
};

import csv from "csvtojson";
import type { ContributionDay, ContributionWeeks } from "./api/types";
import { getWeekNo } from "./utils";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const parseDate = (value: unknown) => {
	if (typeof value !== "string") {
		return null;
	}
	const input = value.trim();
	const isoDate =
		/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2}))?$/;
	if (!isoDate.test(input)) {
		return null;
	}
	const calendarDate = input.slice(0, 10);
	const midnight = new Date(`${calendarDate}T00:00:00Z`);
	const date = new Date(input);
	if (
		!Number.isFinite(date.getTime()) ||
		!Number.isFinite(midnight.getTime()) ||
		!midnight.toISOString().startsWith(calendarDate)
	) {
		return null;
	}
	date.setUTCHours(0, 0, 0, 0);
	return date;
};

const parseCount = (value: unknown) => {
	const count =
		typeof value === "string" && /^\d+$/.test(value.trim())
			? Number(value)
			: value;
	return typeof count === "number" && Number.isSafeInteger(count) && count >= 0
		? count
		: null;
};

const normalizeKey = (key: string) => key.toLowerCase().replace(/[\s_-]/g, "");

export async function parseCustomData(
	text: string,
	filename: string,
): Promise<ContributionWeeks[]> {
	const extension = filename.split(".").at(-1)?.toLowerCase();
	if (extension !== "csv" && extension !== "json") {
		throw new Error("Choose a CSV or JSON file.");
	}

	let rows: unknown;
	try {
		rows =
			extension === "csv"
				? await csv({ checkColumn: true }).fromString(text)
				: JSON.parse(text);
	} catch {
		throw new Error(`Unable to read the file as ${extension.toUpperCase()}.`);
	}
	if (!Array.isArray(rows) || rows.length === 0) {
		throw new Error("The file must contain at least one contribution record.");
	}
	const [first] = rows;
	if (!isRecord(first)) {
		throw new Error("Record 1 must contain a date and a contribution count.");
	}
	const keys = Object.keys(first);
	const dateKey =
		keys.find((key) => normalizeKey(key) === "date") ??
		keys.find((key) => parseDate(first[key]) !== null);
	const countKeys = keys.filter((key) => key !== dateKey);
	const countKey =
		countKeys.find((key) =>
			["contributioncount", "count", "contributions"].includes(
				normalizeKey(key),
			),
		) ?? countKeys.find((key) => parseCount(first[key]) !== null);
	if (dateKey === undefined || countKey === undefined) {
		throw new Error('Include "date" and "count" fields in each record.');
	}

	const seen = new Set<number>();
	const days = rows.map((row: unknown, index): ContributionDay => {
		const date = isRecord(row) ? parseDate(row[dateKey]) : null;
		if (date === null) {
			throw new Error(
				`Record ${index + 1} needs a valid ISO date (YYYY-MM-DD).`,
			);
		}
		const contributionCount = isRecord(row) ? parseCount(row[countKey]) : null;
		if (contributionCount === null) {
			throw new Error(
				`Record ${index + 1} needs a non-negative whole-number count.`,
			);
		}
		if (seen.has(date.getTime())) {
			throw new Error(
				`Record ${index + 1} repeats the date ${date.toISOString().slice(0, 10)}.`,
			);
		}
		seen.add(date.getTime());
		return { date, contributionCount, weekday: date.getUTCDay(), color: "" };
	});

	days.sort((a, b) => a.date.getTime() - b.date.getTime());
	const startYear = days[0].date.getUTCFullYear();
	const endYear = days[days.length - 1].date.getUTCFullYear();
	const years = Array.from(
		{ length: endYear - startYear + 1 },
		(): ContributionWeeks => [],
	);
	for (const day of days) {
		const weeks = years[day.date.getUTCFullYear() - startYear];
		const lastWeek = weeks.at(-1);
		if (
			lastWeek &&
			getWeekNo(new Date(lastWeek.firstDay)) === getWeekNo(day.date)
		) {
			lastWeek.contributionDays.push(day);
		} else {
			weeks.push({ firstDay: day.date, contributionDays: [day] });
		}
	}
	return years;
}

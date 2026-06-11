import {
	compressToEncodedURIComponent,
	decompressFromEncodedURIComponent,
} from "lz-string";
import { z } from "zod";
import { formatYearText } from "@/api/utils";
import { isBuiltinLogo } from "@/stores/logos";
import {
	DEFAULT_INPUT_PARAMETERS,
	SkylineBaseShape,
	type SkylineModelInputParameters,
} from "@/stores/parameters";
import { ExportFormat } from "@/three/utils/export";

export const URL_PARAM_KEY = "s";

// Earliest year selectable; aligns with MIN_START_YEAR in generate_section.tsx.
export const MIN_YEAR = 2000;

/**
 * Parse the `$years` path segment back into a year range.
 * Inverse of {@link formatYearText}: "2024" -> {2024,2024}, "2024-2025" -> {2024,2025}.
 * Returns null for anything malformed or out of range.
 */
export function parseYears(
	raw: string,
): { startYear: number; endYear: number } | null {
	const match = raw.match(/^(\d{4})(?:-(\d{4}))?$/);
	if (!match) return null;
	const max = new Date().getFullYear();
	const startYear = Number(match[1]);
	const endYear = match[2] !== undefined ? Number(match[2]) : startYear;
	if (startYear < MIN_YEAR || endYear < MIN_YEAR) return null;
	if (startYear > max || endYear > max) return null;
	if (startYear > endYear) return null;
	return { startYear, endYear };
}

/** Build the `$years` path segment from a year range ("2024" or "2024-2025"). */
export function formatYearsPath(startYear: number, endYear: number): string {
	return formatYearText(startYear, endYear);
}

export const REST_VERSION = 1;

/**
 * The "rest" of the parameters that live in `?s=` — everything except
 * name/startYear/endYear (those live in the path) and font (not yet shareable).
 */
export const RestShareSchema = z.object({
	v: z.literal(REST_VERSION).catch(REST_VERSION),
	nameOverride: z.string().catch(DEFAULT_INPUT_PARAMETERS.nameOverride),
	insetText: z.boolean().catch(DEFAULT_INPUT_PARAMETERS.insetText),
	towerSize: z.number().catch(DEFAULT_INPUT_PARAMETERS.towerSize),
	dampening: z.number().min(1).catch(DEFAULT_INPUT_PARAMETERS.dampening),
	shape: z.enum(SkylineBaseShape).catch(DEFAULT_INPUT_PARAMETERS.shape),
	padding: z.number().min(0).catch(DEFAULT_INPUT_PARAMETERS.padding),
	textDepth: z.number().catch(DEFAULT_INPUT_PARAMETERS.textDepth),
	color: z.string().catch(DEFAULT_INPUT_PARAMETERS.color),
	showContributionColor: z
		.boolean()
		.catch(DEFAULT_INPUT_PARAMETERS.showContributionColor),
	scale: z.number().min(1).catch(DEFAULT_INPUT_PARAMETERS.scale),
	exportFormat: z
		.enum(ExportFormat)
		.catch(DEFAULT_INPUT_PARAMETERS.exportFormat),
	logo: z.string().catch(DEFAULT_INPUT_PARAMETERS.logo),
	logoScale: z.number().catch(DEFAULT_INPUT_PARAMETERS.logoScale),
	logoOffset: z.number().catch(DEFAULT_INPUT_PARAMETERS.logoOffset),
	nameOffset: z.number().catch(DEFAULT_INPUT_PARAMETERS.nameOffset),
	yearOffset: z.number().catch(DEFAULT_INPUT_PARAMETERS.yearOffset),
});
export type RestShareState = z.infer<typeof RestShareSchema>;

/** Single source of truth for which input keys are serialized into `?s=`. */
export const REST_KEYS = [
	"nameOverride",
	"insetText",
	"towerSize",
	"dampening",
	"shape",
	"padding",
	"textDepth",
	"color",
	"showContributionColor",
	"scale",
	"exportFormat",
	"logo",
	"logoScale",
	"logoOffset",
	"nameOffset",
	"yearOffset",
] as const satisfies readonly (keyof SkylineModelInputParameters)[];

export function toRest(inputs: SkylineModelInputParameters): RestShareState {
	return {
		v: REST_VERSION,
		nameOverride: inputs.nameOverride,
		insetText: inputs.insetText,
		towerSize: inputs.towerSize,
		dampening: inputs.dampening,
		shape: inputs.shape,
		padding: inputs.padding,
		textDepth: inputs.textDepth,
		color: inputs.color,
		showContributionColor: inputs.showContributionColor,
		scale: inputs.scale,
		exportFormat: inputs.exportFormat,
		// Only built-in logos are shareable; custom uploads are never serialized.
		logo: isBuiltinLogo(inputs.logo)
			? inputs.logo
			: DEFAULT_INPUT_PARAMETERS.logo,
		logoScale: inputs.logoScale,
		logoOffset: inputs.logoOffset,
		nameOffset: inputs.nameOffset,
		yearOffset: inputs.yearOffset,
	};
}

export function encodeRest(state: RestShareState): string {
	return compressToEncodedURIComponent(JSON.stringify(state));
}

export function decodeRest(encoded: string): RestShareState | null {
	try {
		const json = decompressFromEncodedURIComponent(encoded);
		if (!json) return null;
		const result = RestShareSchema.safeParse(JSON.parse(json));
		if (!result.success) return null;
		return result.data;
	} catch {
		return null;
	}
}

/** True when every shareable "rest" key matches its default (so `?s=` can be omitted). */
function restEqualsDefaults(inputs: SkylineModelInputParameters): boolean {
	const rest = toRest(inputs);
	return REST_KEYS.every((key) => rest[key] === DEFAULT_INPUT_PARAMETERS[key]);
}

/** Encoded `?s=` value, or null when the model is at defaults (keep the URL clean). */
export function encodeRestIfNeeded(
	inputs: SkylineModelInputParameters,
): string | null {
	if (restEqualsDefaults(inputs)) return null;
	return encodeRest(toRest(inputs));
}

/**
 * Build the initial store inputs from the route: name/years come from the path,
 * the rest from the (optional) `?s=` blob. Unknown/garbage `s` falls back to defaults.
 */
export function getInitialInputs(
	params: { name: string; years: string },
	searchS?: string,
): Partial<SkylineModelInputParameters> {
	const out: Partial<SkylineModelInputParameters> = { name: params.name };
	const years = parseYears(params.years);
	if (years) {
		out.startYear = years.startYear;
		out.endYear = years.endYear;
	}
	if (searchS) {
		const rest = decodeRest(searchS);
		if (rest) {
			out.nameOverride = rest.nameOverride;
			out.insetText = rest.insetText;
			out.towerSize = rest.towerSize;
			out.dampening = rest.dampening;
			out.shape = rest.shape;
			out.padding = rest.padding;
			out.textDepth = rest.textDepth;
			out.color = rest.color;
			out.showContributionColor = rest.showContributionColor;
			out.scale = rest.scale;
			out.exportFormat = rest.exportFormat;
			// Ignore unknown (e.g. custom) logo keys, falling back to the default.
			out.logo = isBuiltinLogo(rest.logo)
				? rest.logo
				: DEFAULT_INPUT_PARAMETERS.logo;
			out.logoScale = rest.logoScale;
			out.logoOffset = rest.logoOffset;
			out.nameOffset = rest.nameOffset;
			out.yearOffset = rest.yearOffset;
		}
	}
	return out;
}

export function buildShareLinks(
	inputs: SkylineModelInputParameters,
	href?: string,
): { minimal: string; full: string } {
	const base = new URL(href ?? window.location.href);
	const path = `/${encodeURIComponent(inputs.name)}/${formatYearsPath(
		inputs.startYear,
		inputs.endYear,
	)}`;

	const minimalUrl = new URL(path, base.origin);
	const minimal = minimalUrl.toString();

	const encoded = encodeRestIfNeeded(inputs);
	const fullUrl = new URL(path, base.origin);
	if (encoded) fullUrl.searchParams.set(URL_PARAM_KEY, encoded);
	const full = fullUrl.toString();

	return { minimal, full };
}

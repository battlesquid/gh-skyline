import lzString from "lz-string";
import { z } from "zod";
import {
	DEFAULT_INPUT_PARAMETERS,
	type SkylineModelInputParameters,
} from "../stores/parameters";
import {
	DEFAULT_FRONT_OPTIONS,
	ExportFormat,
	FRONT_ALIGNMENTS,
	FRONT_LOGOS,
	SkylineBaseShape,
} from "../three/types";

export const URL_PARAM_KEY = "s";

export const MinimalShareSchema = z.object({
	v: z.literal(1).catch(1),
	type: z.literal("minimal"),
	name: z.string().catch(DEFAULT_INPUT_PARAMETERS.name),
	startYear: z
		.number()
		.int()
		.max(new Date().getFullYear())
		.catch(DEFAULT_INPUT_PARAMETERS.startYear),
	endYear: z
		.number()
		.int()
		.max(new Date().getFullYear())
		.catch(DEFAULT_INPUT_PARAMETERS.endYear),
});

const frontOptionsSchema = z
	.object({
		visible: z.boolean().catch(DEFAULT_FRONT_OPTIONS.visible),
		alignment: z.enum(FRONT_ALIGNMENTS).catch(DEFAULT_FRONT_OPTIONS.alignment),
		x: z.number().catch(DEFAULT_FRONT_OPTIONS.x),
		y: z.number().catch(DEFAULT_FRONT_OPTIONS.y),
	})
	.catch(DEFAULT_FRONT_OPTIONS);

export const FullShareSchema = z.object({
	v: z.literal(1).catch(1),
	type: z.literal("full"),
	name: z.string().catch(DEFAULT_INPUT_PARAMETERS.name),
	startYear: z
		.number()
		.int()
		.max(new Date().getFullYear())
		.catch(DEFAULT_INPUT_PARAMETERS.startYear),
	endYear: z
		.number()
		.int()
		.max(new Date().getFullYear())
		.catch(DEFAULT_INPUT_PARAMETERS.endYear),
	nameOverride: z.string().catch(DEFAULT_INPUT_PARAMETERS.nameOverride),
	insetText: z.boolean().catch(DEFAULT_INPUT_PARAMETERS.insetText),
	towerSize: z.number().positive().catch(DEFAULT_INPUT_PARAMETERS.towerSize),
	dampening: z.number().min(1).catch(DEFAULT_INPUT_PARAMETERS.dampening),
	shape: z.enum(SkylineBaseShape).catch(DEFAULT_INPUT_PARAMETERS.shape),
	padding: z.number().min(0).catch(DEFAULT_INPUT_PARAMETERS.padding),
	textDepth: z.number().positive().catch(DEFAULT_INPUT_PARAMETERS.textDepth),
	color: z.string().catch(DEFAULT_INPUT_PARAMETERS.color),
	showContributionColor: z
		.boolean()
		.catch(DEFAULT_INPUT_PARAMETERS.showContributionColor),
	scale: z.number().min(1).catch(DEFAULT_INPUT_PARAMETERS.scale),
	exportFormat: z
		.enum(ExportFormat)
		.catch(DEFAULT_INPUT_PARAMETERS.exportFormat),
	logoOffset: z.number().catch(DEFAULT_INPUT_PARAMETERS.logoOffset),
	nameOffset: z.number().catch(DEFAULT_INPUT_PARAMETERS.nameOffset),
	yearOffset: z.number().catch(DEFAULT_INPUT_PARAMETERS.yearOffset),
	front: z
		.object({
			name: frontOptionsSchema,
			year: frontOptionsSchema,
			logo: frontOptionsSchema,
		})
		.catch(DEFAULT_INPUT_PARAMETERS.front),
	frontLogo: z.enum(FRONT_LOGOS).catch(DEFAULT_INPUT_PARAMETERS.frontLogo),
	connectYears: z.boolean().catch(DEFAULT_INPUT_PARAMETERS.connectYears),
	jointOffsets: z
		.record(z.string().regex(/^\d{4}$/), z.number())
		.catch(DEFAULT_INPUT_PARAMETERS.jointOffsets),
});

export const ShareSchema = z.discriminatedUnion("type", [
	MinimalShareSchema,
	FullShareSchema,
]);
export type ShareState = z.infer<typeof ShareSchema>;

export function toMinimal(inputs: SkylineModelInputParameters): ShareState {
	return {
		v: 1,
		type: "minimal",
		name: inputs.name,
		startYear: inputs.startYear,
		endYear: inputs.endYear,
	};
}

export function toFull(inputs: SkylineModelInputParameters): ShareState {
	return {
		v: 1,
		type: "full",
		name: inputs.name,
		nameOverride: inputs.nameOverride,
		startYear: inputs.startYear,
		endYear: inputs.endYear,
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
		logoOffset: inputs.logoOffset,
		nameOffset: inputs.nameOffset,
		yearOffset: inputs.yearOffset,
		front: inputs.front,
		frontLogo: inputs.frontLogo,
		connectYears: inputs.connectYears,
		jointOffsets: inputs.jointOffsets,
	};
}

export function encodeShareState(state: ShareState): string {
	const json = JSON.stringify(state);
	return lzString.compressToEncodedURIComponent(json);
}

export function decodeShareState(encoded: string): ShareState | null {
	try {
		const json = lzString.decompressFromEncodedURIComponent(encoded);
		if (!json) return null;
		const parsed = JSON.parse(json);
		const result = ShareSchema.safeParse(parsed);
		if (!result.success) return null;
		return result.data;
	} catch {
		return null;
	}
}

export function readShareFromUrl(urlString: string): ShareState | null {
	try {
		const url = new URL(urlString);
		const encoded = url.searchParams.get(URL_PARAM_KEY);
		if (!encoded) return null;
		return decodeShareState(encoded);
	} catch {
		return null;
	}
}

export function getInitialInputsFromUrl(
	urlString: string,
): Partial<SkylineModelInputParameters> {
	const data = readShareFromUrl(urlString);
	if (!data) return {};
	if (data.type === "minimal") {
		return {
			name: data.name,
			startYear: data.startYear,
			endYear: data.endYear,
		};
	}
	return {
		name: data.name,
		nameOverride: data.nameOverride,
		startYear: data.startYear,
		endYear: data.endYear,
		insetText: data.insetText,
		towerSize: data.towerSize,
		dampening: data.dampening,
		shape: data.shape,
		padding: data.padding,
		textDepth: data.textDepth,
		color: data.color,
		showContributionColor: data.showContributionColor,
		scale: data.scale,
		exportFormat: data.exportFormat,
		logoOffset: data.logoOffset,
		nameOffset: data.nameOffset,
		yearOffset: data.yearOffset,
		front: data.front,
		frontLogo: data.frontLogo,
		connectYears: data.connectYears,
		jointOffsets: data.jointOffsets,
	};
}

export function buildShareLinks(
	inputs: SkylineModelInputParameters,
	href?: string,
): { minimal: string; full: string } {
	const minimalState = toMinimal(inputs);
	const fullState = toFull(inputs);
	const minEnc = encodeShareState(minimalState);
	const fullEnc = encodeShareState(fullState);
	const base = new URL(href ?? window.location.href);
	const url1 = new URL(base.toString());
	url1.searchParams.set(URL_PARAM_KEY, minEnc);
	const minimal = url1.toString();
	const url2 = new URL(base.toString());
	url2.searchParams.set(URL_PARAM_KEY, fullEnc);
	const full = url2.toString();
	return { minimal, full };
}

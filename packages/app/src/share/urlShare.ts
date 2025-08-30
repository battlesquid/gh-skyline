import {
	compressToEncodedURIComponent,
	decompressFromEncodedURIComponent,
} from "lz-string";
import { z } from "zod";

import type { SkylineModelInputParameters } from "../stores/parameters";
import { ExportFormat } from "../three/export";
import { SkylineBaseShape } from "../three/types";

export const URL_PARAM_KEY = "s";

export const MinimalShareSchema = z.object({
	v: z.literal(1),
	type: z.literal("minimal"),
	name: z.string(),
	startYear: z.number().int(),
	endYear: z.number().int(),
});

export const FullShareSchema = z.object({
	v: z.literal(1),
	type: z.literal("full"),
	name: z.string(),
	nameOverride: z.string(),
	startYear: z.number().int(),
	endYear: z.number().int(),
	insetText: z.boolean(),
	towerSize: z.number(),
	dampening: z.number(),
	shape: z.nativeEnum(SkylineBaseShape),
	padding: z.number(),
	textDepth: z.number(),
	color: z.string(),
	showContributionColor: z.boolean(),
	scale: z.number(),
	exportFormat: z.nativeEnum(ExportFormat),
	logoOffset: z.number(),
	nameOffset: z.number(),
	yearOffset: z.number(),
});

export const ShareSchema = z.union([MinimalShareSchema, FullShareSchema]);
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
	};
}

export function encodeShareState(state: ShareState): string {
	const json = JSON.stringify(state);
	return compressToEncodedURIComponent(json);
}

export function decodeShareState(encoded: string): ShareState | null {
	try {
		const json = decompressFromEncodedURIComponent(encoded);
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

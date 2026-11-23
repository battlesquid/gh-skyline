export enum SkylineBaseShape {
	Prism = "prism",
	Frustum = "frustum",
}

export enum ExportFormat {
	Stl = "stl",
	ThreeMF = "3mf",
}

export const FRONT_ITEMS = ["name", "year", "logo"] as const;
export type FrontItem = (typeof FRONT_ITEMS)[number];
export const FRONT_ALIGNMENTS = ["default", "left", "center", "right"] as const;
export const FRONT_LOGOS = ["Circle", "Diamond", "Star"] as const;

export interface FrontOptions {
	visible: boolean;
	alignment: (typeof FRONT_ALIGNMENTS)[number];
	x: number;
	y: number;
}

export const DEFAULT_FRONT_OPTIONS: FrontOptions = Object.freeze({
	visible: true,
	alignment: "default",
	x: 0,
	y: 0,
});

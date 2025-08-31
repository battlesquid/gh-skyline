import { createContext, useContext } from "react";
import { createStore, useStore } from "zustand";
import { DAYS_IN_WEEK, WEEKS_IN_YEAR } from "../api/constants";
import { formatYearText } from "../api/utils";
import { ExportFormat } from "../three/export";
import { SkylineBaseShape } from "../three/types";
import { safeString } from "../utils";
import { DEFAULT_FONT } from "./fonts";

export interface SkylineModelInputParameters {
	name: string;
	nameOverride: string;
	insetText: boolean;
	startYear: number;
	endYear: number;
	towerSize: number;
	dampening: number;
	font: string;
	shape: SkylineBaseShape;
	padding: number;
	textDepth: number;
	color: string;
	showContributionColor: boolean;
	filename: string;
	scale: number;
	exportFormat: ExportFormat;
	logoOffset: number;
	nameOffset: number;
	yearOffset: number;
}

export interface SkylineModelComputedParameters {
	modelLength: number;
	modelWidth: number;
	halfPlatformHeight: number;
	platformHeight: number;
	textSize: number;
	towerSizeOffset: number;
	halfModelLength: number;
	halfModelWidth: number;
	paddingWidth: number;
	formattedYear: string;
	resolvedFilename: string;
	resolvedName: string;
	renderColor: string;
}

export interface SkylineModelParameters {
	inputs: SkylineModelInputParameters;
	computed: SkylineModelComputedParameters;
}

export type ParametersStore = {
	inputs: SkylineModelInputParameters;
	computed: SkylineModelComputedParameters;
	setInputs: (parameters: Partial<SkylineModelInputParameters>) => void;
};

export const getComputedParameters = (
	inputs: SkylineModelInputParameters,
): SkylineModelComputedParameters => {
	const modelLength = WEEKS_IN_YEAR * inputs.towerSize;
	const modelWidth = DAYS_IN_WEEK * inputs.towerSize;
	const platformHeight = inputs.towerSize * 3.2;
	const halfPlatformHeight = platformHeight / 2;
	const textSize = platformHeight / 2.2;
	const towerSizeOffset = inputs.towerSize / 2;
	const halfModelLength = modelLength / 2;
	const halfModelWidth = modelWidth / 2;
	const paddingWidth = inputs.padding * 2;
	const formattedYear = formatYearText(inputs.startYear, inputs.endYear);
	const resolvedFilename = safeString(
		inputs.filename,
		`${inputs.name}_${formattedYear}_skyline`,
	);
	const resolvedName = safeString(inputs.nameOverride, inputs.name);
	const renderColor = inputs.showContributionColor
		? DEFAULT_INPUT_PARAMETERS.color
		: inputs.color;

	return {
		modelLength,
		modelWidth,
		halfPlatformHeight,
		platformHeight,
		textSize,
		towerSizeOffset,
		halfModelLength,
		halfModelWidth,
		paddingWidth,
		resolvedFilename,
		formattedYear,
		resolvedName,
		renderColor,
	};
};

export const DEFAULT_INPUT_PARAMETERS = Object.freeze({
	name: "battlesquid",
	nameOverride: "",
	startYear: new Date().getFullYear(),
	endYear: new Date().getFullYear(),
	color: "#787878",
	font: DEFAULT_FONT,
	insetText: false,
	showContributionColor: false,
	padding: 2,
	textDepth: 1,
	towerSize: 2.5,
	dampening: 4,
	shape: SkylineBaseShape.Prism,
	filename: "",
	scale: 1,
	exportFormat: ExportFormat.ThreeMF,
	logoOffset: 10,
	nameOffset: 15,
	yearOffset: 10,
});

export const DEFAULT_COMPUTED_PARAMETERS = Object.freeze(
	getComputedParameters(DEFAULT_INPUT_PARAMETERS),
);

export const createParametersStore = (
	props?: Partial<SkylineModelInputParameters>,
) => {
	const allInputProps = { ...DEFAULT_INPUT_PARAMETERS, ...props };
	const allComputedProps = {
		...DEFAULT_COMPUTED_PARAMETERS,
		...getComputedParameters(allInputProps),
	};

	return createStore<ParametersStore>()((set, get) => ({
		inputs: allInputProps,
		computed: allComputedProps,
		setInputs: (_inputs: Partial<SkylineModelInputParameters>) => {
			const inputs: SkylineModelInputParameters = {
				...get().inputs,
				..._inputs,
			};
			const computed = getComputedParameters(inputs);
			set(() => ({ inputs, computed }));
		},
	}));
};

export const getParametersStore = () => {
	const store = useContext(ParametersContext);
	if (store === null) {
		throw new Error("Missing ParametersContext.Provider in the tree");
	}
	return store;
};

export const ParametersContext = createContext<ReturnType<
	typeof createParametersStore
> | null>(null);

export const useParametersContext = <T>(
	selector: (state: ParametersStore) => T,
): T => {
	const store = getParametersStore();
	return useStore(store, selector);
};

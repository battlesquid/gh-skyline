import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Box3, Vector3 } from "three";
import { useShallow } from "zustand/shallow";
import { toPolygons, useSkylineFont } from "../hooks/useTTFLoader";
import {
	addBaseJoints,
	type BaseDimensions,
	composeBase,
	makeBaseBlank,
	makeTextPart,
	type SolidPart,
} from "../manifold/parts";
import { useModelStore } from "../stores/model";
import { SkylineDatasource, useParametersContext } from "../stores/parameters";
import {
	assemblyBounds,
	type BasePlacement,
	type FrontPart,
	frontBounds,
} from "./assembly";
import { ContributionTowers } from "./contribution_tower";
import type { SkylineProps } from "./skyline";
import { FrontGuide, makeLogo, placeFront, SkylineBase } from "./skyline_base";
import { reconcileTowerYears, towerBounds } from "./tower_parts";
import { DEFAULT_FRONT_OPTIONS, FRONT_ITEMS, SkylineBaseShape } from "./types";

function useBaseShells(dimensions: BaseDimensions[]) {
	const previous = useRef(new Map<string, SolidPart>());
	const cached = useMemo(() => {
		const parts = new Map<string, SolidPart>();
		const shells = dimensions.map((dim) => {
			// A joint moving sideways doesn't change the underlying shell or face frame.
			const blankDim = {
				...dim,
				frontJoint: dim.frontJoint === null ? null : 0,
				backJoint: dim.backJoint === null ? null : 0,
			};
			function obtain(key: string, build: () => SolidPart) {
				const value = parts.get(key) ?? previous.current.get(key) ?? build();
				parts.set(key, value);
				return value;
			}
			const blank = obtain(`blank:${JSON.stringify(blankDim)}`, () =>
				makeBaseBlank(blankDim),
			);
			if (dim.frontJoint === null && dim.backJoint === null) return blank;
			return obtain(`joint:${JSON.stringify(dim)}`, () =>
				addBaseJoints(blank, dim),
			);
		});
		return { shells, parts };
	}, [dimensions]);
	useLayoutEffect(() => {
		previous.current = cached.parts;
	}, [cached]);
	return cached.shells;
}

export function SkylineModel({ years, firstYear }: SkylineProps) {
	const {
		name,
		yearText,
		height,
		rowDepth,
		padding,
		shape,
		fontUrl,
		front,
		frontLogo,
		nameOffset,
		yearOffset,
		logoOffset,
		inset,
		logoDepth,
		connectYears,
		jointOffsets,
		custom,
		baseColor,
	} = useParametersContext(
		useShallow(({ inputs, computed }) => ({
			name: computed.resolvedName,
			yearText: computed.formattedYear,
			height: computed.platformHeight,
			rowDepth: computed.modelWidth,
			padding: inputs.padding,
			shape: inputs.shape,
			fontUrl: inputs.font,
			front: inputs.front,
			frontLogo: inputs.frontLogo,
			nameOffset: inputs.nameOffset,
			yearOffset: inputs.yearOffset,
			logoOffset: inputs.logoOffset,
			inset: inputs.insetText,
			logoDepth: inputs.textDepth,
			connectYears: inputs.connectYears,
			jointOffsets: inputs.jointOffsets,
			custom: inputs.datasource === SkylineDatasource.Custom,
			baseColor: computed.renderColor,
		})),
	);
	const settings = useParametersContext(
		useShallow(({ inputs, computed }) => ({
			size: inputs.towerSize,
			width: computed.modelLength,
			dampening: inputs.dampening,
		})),
	);
	const paint = useParametersContext(
		useShallow(({ inputs }) => ({
			color: inputs.color,
			showContributionColor: inputs.showContributionColor,
			custom,
		})),
	);
	const revision = useParametersContext((state) => state.modelRevision);
	const setSnapshot = useModelStore((state) => state.setSnapshot);
	const previous = useRef<ReturnType<typeof reconcileTowerYears>>([]);
	const towerYears = useMemo(
		() => reconcileTowerYears(years, firstYear, previous.current),
		[years, firstYear],
	);
	useLayoutEffect(() => {
		previous.current = towerYears;
	}, [towerYears]);

	const rows = Math.max(years.length, 1);
	const pitch = rowDepth + (connectYears ? 2 * padding : 0);
	const yearIds = towerYears.map(({ year }) => year).join(",");
	const boxCache = useRef(
		new Map<
			number,
			{
				days: (typeof towerYears)[number]["days"];
				settings: typeof settings;
				bounds: Box3;
			}
		>(),
	);
	const yearParts = useMemo(
		() =>
			towerYears.map((year, index) => {
				const cached = boxCache.current.get(year.year);
				const bounds =
					cached?.days === year.days && cached.settings === settings
						? cached.bounds
						: towerBounds(year, settings);
				return { year, z: (index - (rows - 1) / 2) * pitch, bounds };
			}),
		[towerYears, settings, pitch, rows],
	);
	useLayoutEffect(() => {
		boxCache.current = new Map(
			yearParts.map(({ year, bounds }) => [
				year.year,
				{ days: year.days, settings, bounds },
			]),
		);
	}, [yearParts, settings]);

	const width = settings.width + 2 * padding;
	const dimensions = useMemo(() => {
		const ids = yearIds ? yearIds.split(",").map(Number) : [firstYear];
		const tapered = shape === SkylineBaseShape.Frustum;
		const shell = {
			width,
			height,
			widthTaper: tapered ? 5 : 0,
			depthTaper: tapered ? 7 : 0,
		};
		if (!connectYears)
			return [
				{
					...shell,
					depth: rows * rowDepth + 2 * padding,
					frontJoint: null,
					backJoint: null,
				},
			];
		const limit = Math.max(0, width / 2 - 7);
		const offset = (id: number) =>
			Math.min(limit, Math.max(-limit, jointOffsets[id] ?? 0));
		return ids.map((year, i) => ({
			...shell,
			depth: pitch,
			frontJoint: i < ids.length - 1 ? offset(year) : null,
			backJoint: i ? offset(ids[i - 1]) : null,
		}));
	}, [
		yearIds,
		firstYear,
		shape,
		width,
		height,
		connectYears,
		jointOffsets,
		pitch,
		padding,
		rowDepth,
		rows,
	]);
	const shells = useBaseShells(dimensions);
	const { font, error: fontError } = useSkylineFont(fontUrl);
	const nameText = useMemo(
		() => (font ? makeTextPart(toPolygons(font, name, height / 1.65)) : null),
		[font, name, height],
	);
	const yearTextPart = useMemo(
		() =>
			font ? makeTextPart(toPolygons(font, yearText, height / 1.65)) : null,
		[font, yearText, height],
	);
	const logo = useMemo(
		() => makeLogo(frontLogo, logoDepth, height * 0.65),
		[frontLogo, logoDepth, height],
	);
	useEffect(
		() => () => logo.geometries.forEach((geometry) => geometry.dispose()),
		[logo],
	);

	const last = shells.length - 1;
	const face = dimensions[last];
	const { parts, warnings } = useMemo(() => {
		const parts: FrontPart[] = [];
		const warnings: string[] = [];
		const assets = { name: nameText, year: yearTextPart, logo };
		const offsets = { name: nameOffset, year: yearOffset, logo: logoOffset };
		for (const item of FRONT_ITEMS) {
			const part = placeFront(
				item,
				assets[item],
				front[item],
				face,
				offsets[item],
				inset,
			);
			if (typeof part === "string") warnings.push(part);
			else if (part) parts.push(part);
		}
		return { parts, warnings };
	}, [
		nameText,
		yearTextPart,
		logo,
		front,
		face,
		nameOffset,
		yearOffset,
		logoOffset,
		inset,
	]);
	// Depend only on actual text cutters. Changing the logo or a back joint must not re-cut the shell.
	const nameCut = parts.find((part) => part.kind === "name");
	const yearCut = parts.find((part) => part.kind === "year");
	const nameSolid = nameCut?.kind === "name" ? nameCut.text.solid : null;
	const yearSolid = yearCut?.kind === "year" ? yearCut.text.solid : null;
	const [nameX, nameY, nameZ] =
		nameCut?.kind === "name" ? nameCut.text.position : [];
	const [yearX, yearY, yearZ] =
		yearCut?.kind === "year" ? yearCut.text.position : [];
	const angle = -Math.atan(face.depthTaper / 2 / face.height);
	const frontShell = shells[last];
	const cutShell = useMemo(() => {
		if (!inset) return frontShell;
		const cuts = [];
		if (
			nameSolid &&
			nameX !== undefined &&
			nameY !== undefined &&
			nameZ !== undefined
		)
			cuts.push({
				solid: nameSolid,
				angle,
				position: [nameX, nameY, nameZ] as [number, number, number],
			});
		if (
			yearSolid &&
			yearX !== undefined &&
			yearY !== undefined &&
			yearZ !== undefined
		)
			cuts.push({
				solid: yearSolid,
				angle,
				position: [yearX, yearY, yearZ] as [number, number, number],
			});
		return composeBase(frontShell, cuts, true);
	}, [
		frontShell,
		inset,
		angle,
		nameSolid,
		yearSolid,
		nameX,
		nameY,
		nameZ,
		yearX,
		yearY,
		yearZ,
	]);

	const legacyShift = useMemo(() => {
		if (connectYears || inset) return 0;
		const bounds = frontShell.bounds.clone();
		for (const part of [
			placeFront(
				"name",
				nameText,
				DEFAULT_FRONT_OPTIONS,
				face,
				nameOffset,
				false,
			),
			placeFront(
				"year",
				yearTextPart,
				DEFAULT_FRONT_OPTIONS,
				face,
				yearOffset,
				false,
			),
		]) {
			if (part && typeof part !== "string") bounds.union(frontBounds(part));
		}
		return (
			-(bounds.min.z + bounds.max.z) / 2 +
			(shape === SkylineBaseShape.Prism ? 0.5 : 0)
		);
	}, [
		connectYears,
		inset,
		frontShell,
		nameText,
		face,
		nameOffset,
		yearTextPart,
		yearOffset,
		shape,
	]);

	const bases = useMemo(() => {
		const ids = yearIds ? yearIds.split(",").map(Number) : [firstYear];
		return shells.map((solid, i): BasePlacement => ({
			year: connectYears ? ids[i] : null,
			solid: i === last ? cutShell : solid,
			front: i === last ? parts : [],
			z: connectYears ? (i - (rows - 1) / 2) * pitch : 0,
			inset: i === last && inset,
			shift: i === last ? legacyShift : 0,
		}));
	}, [
		connectYears,
		cutShell,
		inset,
		last,
		parts,
		pitch,
		rows,
		shells,
		firstYear,
		yearIds,
		legacyShift,
	]);

	const carrierFootprint = useMemo(
		() => Box3FromFootprint(settings.width, (rows - 1) * pitch + rowDepth),
		[settings.width, rows, pitch, rowDepth],
	);
	const bounds = useMemo(
		() => assemblyBounds(bases, yearParts),
		[bases, yearParts],
	);
	const model = useMemo(
		() => ({
			bases,
			years: yearParts,
			settings,
			paint,
			baseColor,
			carrierFootprint,
			bounds,
		}),
		[bases, yearParts, settings, paint, baseColor, carrierFootprint, bounds],
	);
	const needsFont = front.name.visible || front.year.visible;
	useLayoutEffect(() => {
		setSnapshot({
			revision,
			model,
			warnings,
			waiting: needsFont && !font,
			fontError: needsFont ? fontError : undefined,
		});
	}, [model, revision, warnings, font, fontError, needsFont, setSnapshot]);
	useLayoutEffect(() => () => setSnapshot(null), [setSnapshot]);

	return (
		<group>
			{yearParts.map(({ year, z }) => (
				<ContributionTowers
					key={year.year}
					days={year.days}
					settings={settings}
					paint={paint}
					origin={z}
				/>
			))}
			{bases.map((base, index) => (
				<SkylineBase
					key={base.year ?? "main"}
					base={base}
					color={baseColor}
					nameAsset={index === last ? nameText : null}
					yearAsset={index === last ? yearTextPart : null}
					logoAsset={index === last ? logo : null}
				/>
			))}
			{inset && (
				<FrontGuide
					z={bases[last].z}
					face={face}
					name={nameText}
					year={yearTextPart}
					front={front}
					nameOffset={nameOffset}
					yearOffset={yearOffset}
				/>
			)}
		</group>
	);
}

function Box3FromFootprint(width: number, depth: number) {
	return new Box3(
		new Vector3(-width / 2, 0, -depth / 2),
		new Vector3(width / 2, 0, depth / 2),
	);
}

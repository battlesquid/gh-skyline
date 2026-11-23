import { memo, useEffect, useMemo } from "react";
import { Box3, ExtrudeGeometry, Matrix4 } from "three";
import { SVGLoader } from "three-stdlib";
import { LOGOS } from "../logos";
import {
	type BaseDimensions,
	partGeometry,
	type SolidPart,
	textPlacement,
} from "../manifold/parts";
import { useModelStore } from "../stores/model";
import {
	type BasePlacement,
	type FrontPart,
	type PlacedLogo,
} from "./assembly";
import { measureWork } from "./pipeline_metrics";
import { type FrontItem, type FrontOptions } from "./types";

const svgLoader = new SVGLoader();

export function makeLogo(
	asset: keyof typeof LOGOS,
	depth: number,
	height: number,
) {
	return measureWork("logo extrusion", () => {
		const shapes = svgLoader
			.parse(LOGOS[asset])
			.paths.flatMap((path) => path.toShapes(true));
		const geometries = shapes.map(
			(shape) => new ExtrudeGeometry(shape, { depth, bevelEnabled: false }),
		);
		const bounds = new Box3();
		for (const geometry of geometries) {
			geometry.computeBoundingBox();
			if (geometry.boundingBox) bounds.union(geometry.boundingBox);
		}
		const center = bounds.getCenter(bounds.min.clone());
		const scale = height / (bounds.max.y - bounds.min.y);
		const transform = new Matrix4()
			.makeScale(scale, scale, 1)
			.multiply(new Matrix4().makeRotationX(Math.PI))
			.multiply(new Matrix4().makeTranslation(-center.x, -center.y, -center.z));
		bounds.makeEmpty();
		for (const geometry of geometries) {
			geometry.applyMatrix4(transform);
			geometry.computeBoundingBox();
			if (geometry.boundingBox) bounds.union(geometry.boundingBox);
		}
		return { geometries, bounds };
	});
}

export function placeFront(
	item: FrontItem,
	asset: SolidPart | Pick<PlacedLogo, "geometries" | "bounds"> | null,
	options: FrontOptions,
	dim: BaseDimensions,
	legacyOffset: number,
	inset: boolean,
): FrontPart | string | null {
	if (!options.visible || !asset || asset.bounds.isEmpty()) return null;
	const angle = -Math.atan(dim.depthTaper / 2 / dim.height);
	const halfWidth = (asset.bounds.max.x - asset.bounds.min.x) / 2;
	const halfHeight = (asset.bounds.max.y - asset.bounds.min.y) / 2;
	const faceHalf = dim.width / 2;
	let anchor: number;
	switch (options.alignment) {
		case "left":
			anchor = -faceHalf + halfWidth + 1;
			break;
		case "center":
			anchor = 0;
			break;
		case "right":
			anchor = faceHalf - halfWidth - 1;
			break;
		default:
			anchor =
				item === "name"
					? faceHalf - halfWidth - legacyOffset
					: -faceHalf + legacyOffset + (item === "logo" ? 0 : halfWidth);
	}
	const x = anchor + options.x;
	const { y } = options;
	const slantHeight = Math.hypot(dim.height, dim.depthTaper / 2);
	if (
		(options.alignment !== "default" || options.x !== 0 || y !== 0) &&
		(Math.abs(x) + halfWidth > faceHalf ||
			Math.abs(y) + halfHeight > slantHeight / 2)
	) {
		return `${item[0].toUpperCase()}${item.slice(1)} doesn't fit on the front face. Adjust its alignment or offsets.`;
	}
	const faceY = -dim.height / 2 + Math.cos(angle) * y;
	const faceZ = dim.depth / 2 + dim.depthTaper / 4 + Math.sin(angle) * y;
	if (item === "logo" && "geometries" in asset) {
		const normalOffset = asset.bounds.max.z - asset.bounds.min.z;
		return {
			kind: item,
			logo: {
				...asset,
				angle,
				position: [
					x,
					faceY - (Math.sin(angle) * normalOffset) / 2,
					faceZ + (Math.cos(angle) * normalOffset) / 2,
				],
			},
		};
	}
	if (item !== "logo" && "mesh" in asset) {
		return {
			kind: item,
			text: textPlacement(asset, angle, [x, faceY, faceZ], inset),
		};
	}
	return null;
}

const PartMesh = memo(function PartMesh({
	solid,
	color,
	position,
	angle = 0,
	visible = true,
}: {
	solid: SolidPart;
	color: string;
	position?: [number, number, number];
	angle?: number;
	visible?: boolean;
}) {
	const geometry = useMemo(() => partGeometry(solid), [solid]);
	useEffect(() => () => geometry.dispose(), [geometry]);
	return (
		<mesh
			geometry={geometry}
			position={position}
			rotation-x={angle}
			visible={visible}
			castShadow
			receiveShadow
		>
			<meshStandardMaterial
				color={color}
				flatShading
				roughness={0.6}
				metalness={0.1}
			/>
		</mesh>
	);
});

export const SkylineBase = memo(function SkylineBase({
	base,
	color,
	nameAsset,
	yearAsset,
	logoAsset,
}: {
	base: BasePlacement;
	color: string;
	nameAsset: SolidPart | null;
	yearAsset: SolidPart | null;
	logoAsset: Pick<PlacedLogo, "geometries" | "bounds"> | null;
}) {
	const name = base.front.find((part) => part.kind === "name");
	const year = base.front.find((part) => part.kind === "year");
	const logo = base.front.find((part) => part.kind === "logo");
	return (
		<group position-z={base.z}>
			<group position-z={base.shift}>
				<PartMesh solid={base.solid} color={color} />
				{nameAsset && (
					<PartMesh
						solid={nameAsset}
						color={color}
						visible={!base.inset && name?.kind === "name"}
						position={name?.kind === "name" ? name.text.position : undefined}
						angle={name?.kind === "name" ? name.text.angle : undefined}
					/>
				)}
				{yearAsset && (
					<PartMesh
						solid={yearAsset}
						color={color}
						visible={!base.inset && year?.kind === "year"}
						position={year?.kind === "year" ? year.text.position : undefined}
						angle={year?.kind === "year" ? year.text.angle : undefined}
					/>
				)}
			</group>
			{logoAsset && (
				<group
					visible={logo?.kind === "logo"}
					position={logo?.logo.position}
					rotation-x={logo?.logo.angle ?? 0}
				>
					{logoAsset.geometries.map((geometry) => (
						<mesh
							key={geometry.id}
							geometry={geometry}
							castShadow
							receiveShadow
						>
							<meshStandardMaterial
								color={color}
								flatShading
								roughness={0.6}
								metalness={0.1}
							/>
						</mesh>
					))}
				</group>
			)}
		</group>
	);
});

export function FrontGuide({
	z,
	face,
	name,
	year,
	front,
	nameOffset,
	yearOffset,
}: {
	z: number;
	face: BaseDimensions;
	name: SolidPart | null;
	year: SolidPart | null;
	front: Record<FrontItem, FrontOptions>;
	nameOffset: number;
	yearOffset: number;
}) {
	const draft = useModelStore((state) => state.frontDraft);
	const solid =
		draft?.item === "name" ? name : draft?.item === "year" ? year : null;
	const geometry = useMemo(() => (solid ? partGeometry(solid) : null), [solid]);
	useEffect(() => () => geometry?.dispose(), [geometry]);
	if (!draft || !solid || !geometry) return null;
	const part = placeFront(
		draft.item,
		solid,
		{
			...front[draft.item],
			[draft.axis]: draft.value,
		},
		face,
		draft.item === "name" ? nameOffset : yearOffset,
		false,
	);
	if (!part || typeof part === "string" || part.kind === "logo") return null;
	return (
		<group position-z={z}>
			<mesh
				geometry={geometry}
				position={part.text.position}
				rotation-x={part.text.angle}
			>
				<meshBasicMaterial
					color="#56d364"
					opacity={0.45}
					transparent
					depthWrite={false}
				/>
			</mesh>
		</group>
	);
}

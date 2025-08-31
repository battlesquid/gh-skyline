import { useMemo, useRef } from "react";
import { type Group, MeshStandardMaterial } from "three";
import { useShallow } from "zustand/shallow";
import { useExtrudedSvg } from "../hooks/useExtrudedSvg";
import { toPolygons, useTTFLoader } from "../hooks/useTTFLoader";
import { LOGOS } from "../logos";
import {
	type ManifoldFrustumArgs,
	type ManifoldFrustumText,
	makeThreeFrustum,
} from "../manifold/frustum";
import { useParametersContext } from "../stores/parameters";
import type { SkylineProps } from "./skyline";
import { SkylineBaseShape } from "./types";
import { SkylineObjectNames } from "./utils";

export interface SkylineBaseProps extends SkylineProps {}

export function SkylineBase({ years }: SkylineBaseProps) {
	const inputs = useParametersContext(useShallow((state) => state.inputs));
	const computed = useParametersContext(useShallow((state) => state.computed));

	// TODO: dont memoize this, maybe make a hook to just update props
	const material = useMemo(
		() =>
			new MeshStandardMaterial({
				color: computed.renderColor,
				flatShading: true,
				roughness: 0.6,
				metalness: 0.1,
			}),
		[computed.renderColor],
	);

	const logoRef = useRef<Group | null>(null);
	const logo = useExtrudedSvg({
		svg: LOGOS.Circle,
		ref: logoRef,
		depth: inputs.textDepth,
		material,
		castShadow: true,
		receiveShadow: true,
		onObjectReady(group) {
			const wantedHeight = 0.65 * computed.platformHeight;
			const scale = wantedHeight / logo.svgBoundingBox.height;
			group.scale.set(scale, -scale, 1);
		},
	});

	const ttfFont = useTTFLoader(inputs.font);

	const frustumProps: ManifoldFrustumArgs = useMemo(
		() => ({
			width: computed.modelLength + computed.paddingWidth,
			length: computed.modelWidth * years.length + computed.paddingWidth,
			height: computed.platformHeight,
			lengthPadding: 7 * +(inputs.shape === SkylineBaseShape.Frustum),
			widthPadding: 5 * +(inputs.shape === SkylineBaseShape.Frustum),
		}),
		[
			computed.modelLength,
			computed.paddingWidth,
			computed.platformHeight,
			inputs.shape,
			years,
		],
	);

	const nameManifoldProps = useMemo(
		(): ManifoldFrustumText => ({
			points: toPolygons(
				ttfFont,
				computed.resolvedName,
				computed.platformHeight / 1.65,
			),
			offset: inputs.nameOffset,
		}),
		[ttfFont, computed.resolvedName, inputs.nameOffset],
	);

	const yearManifoldProps = useMemo(
		(): ManifoldFrustumText => ({
			points: toPolygons(
				ttfFont,
				computed.formattedYear,
				computed.platformHeight / 1.65,
			),
			offset: inputs.yearOffset,
		}),
		[ttfFont, inputs.yearOffset, computed.formattedYear],
	);

	const frustum = useMemo(
		() =>
			makeThreeFrustum(
				frustumProps,
				nameManifoldProps,
				yearManifoldProps,
				inputs.insetText,
			),
		[frustumProps, nameManifoldProps, yearManifoldProps, inputs.insetText],
	);

	// TODO: if text depth becomes a configurable parameter, this check probably won't suffice
	// we'll instead need to subtract the bounding box of the base w/ text minus the base
	// in the case that text is extruded past the base's bounding box
	const TEXT_EXTRUSION_OFFSET =
		inputs.insetText || inputs.shape === SkylineBaseShape.Frustum
			? 0
			: inputs.textDepth / 2;

	return (
		<group name={SkylineObjectNames.Base}>
			<mesh
				geometry={frustum.geometry}
				position={[0, -computed.halfPlatformHeight, TEXT_EXTRUSION_OFFSET]}
				material={material}
				onPointerOver={(e) => e.stopPropagation()}
				castShadow
				receiveShadow
			/>
			<object3D
				ref={logoRef}
				rotation={[frustum.angle, 0, 0]}
				position={[
					-computed.halfModelLength -
						inputs.padding +
						inputs.logoOffset -
						frustum.normal.x * (logo.threeBoundingBox.z / 2),
					-computed.halfPlatformHeight +
						frustum.normal.y * (logo.threeBoundingBox.z / 2),
					(computed.modelWidth * years.length) / 2 +
						inputs.padding +
						frustum.normal.z * (logo.threeBoundingBox.z / 2) +
						frustumProps.lengthPadding / 4,
				]}
				castShadow
				receiveShadow
			/>
		</group>
	);
}

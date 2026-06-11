import { Selection } from "@react-three/postprocessing";
import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { useShallow } from "zustand/shallow";
import { toPolygons, useTTFLoader } from "../../hooks/use-ttf-loader";
import {
	type ManifoldFrustumArgs,
	type ManifoldFrustumText,
	makeThreeFrustum,
} from "../../manifold/frustum";
import { svgToPolygons } from "../../manifold/svg";
import { DEFAULT_LOGO_SELECTION, useLogoStore } from "../../stores/logos";
import {
	SkylineBaseShape,
	useParametersContext,
} from "../../stores/parameters";
import { useContributionQueryStore } from "../../stores/query";
import { GROUPS } from "../utils/constants";

const LOGO_HEIGHT_FACTOR = 0.65;

export function SkylineBase() {
	const inputs = useParametersContext(useShallow((state) => state.inputs));
	const computed = useParametersContext(useShallow((state) => state.computed));
	const years = useContributionQueryStore((state) => state.results);
	const logos = useLogoStore((state) => state.logos);

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

	const font = useTTFLoader(inputs.font);

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
				font,
				computed.resolvedName,
				computed.platformHeight / 1.65,
			),
			offset: inputs.nameOffset,
		}),
		[font, computed.resolvedName, inputs.nameOffset],
	);

	const yearManifoldProps = useMemo(
		(): ManifoldFrustumText => ({
			points: toPolygons(
				font,
				computed.formattedYear,
				computed.platformHeight / 1.65,
			),
			offset: inputs.yearOffset,
		}),
		[font, inputs.yearOffset, computed.formattedYear],
	);

	const logoSvg = logos[inputs.logo] ?? logos[DEFAULT_LOGO_SELECTION];
	const logoManifoldProps = useMemo((): ManifoldFrustumText => {
		try {
			return {
				points: svgToPolygons(
					logoSvg,
					LOGO_HEIGHT_FACTOR * computed.platformHeight * inputs.logoScale,
				),
				offset: inputs.logoOffset,
			};
		} catch (e) {
			console.error("Failed to convert logo SVG to polygons", e);
			return { points: [], offset: inputs.logoOffset };
		}
	}, [logoSvg, computed.platformHeight, inputs.logoScale, inputs.logoOffset]);

	const frustum = useMemo(
		() =>
			makeThreeFrustum(
				frustumProps,
				nameManifoldProps,
				yearManifoldProps,
				logoManifoldProps,
				inputs.insetText,
			),
		[
			frustumProps,
			nameManifoldProps,
			yearManifoldProps,
			logoManifoldProps,
			inputs.insetText,
		],
	);

	// TODO: if text depth becomes a configurable parameter, this check probably won't suffice
	// we'll instead need to subtract the bounding box of the base w/ text minus the base
	// in the case that text is extruded past the base's bounding box
	const TEXT_EXTRUSION_OFFSET =
		inputs.insetText || inputs.shape === SkylineBaseShape.Frustum
			? 0
			: inputs.textDepth / 2;

	return (
		<group name={GROUPS.BASE}>
			<Selection>
				<mesh
					geometry={frustum.geometry}
					position={[0, -computed.halfPlatformHeight, TEXT_EXTRUSION_OFFSET]}
					material={material}
					onPointerOver={(e) => e.stopPropagation()}
					castShadow
					receiveShadow
				/>
			</Selection>
		</group>
	);
}

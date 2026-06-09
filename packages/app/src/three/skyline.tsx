import { Bounds, Environment, Grid, SoftShadows } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import { DoubleSide, type Group } from "three";
import type { ContributionWeeks } from "../api/types";
import { useControlsStore } from "../stores/controls";
import { useParametersContext } from "../stores/parameters";
import { Cameras } from "./cameras";
import { CameraControls } from "./controls";
import { SkylineModel } from "./skyline_model";
import { SynthwaveParticles } from "./synthwave_particles";

export interface SkylineProps {
	years: ContributionWeeks[];
}

export function Skyline(props: SkylineProps) {
	const { years } = props;
	const computed = useParametersContext((state) => state.computed);
	const group = useRef<Group | null>(null);
	const style = useMemo(() => ({ height: "100%" }), []);
	const orthographic = useControlsStore(
		(state) => state.projectionMode === "orthographic",
	);
	const ready = years.length !== 0 && years[0].length !== 0;

	return (
		<Canvas
			orthographic={orthographic}
			id="skyline-canvas"
			style={style}
			shadows
		>
			<Suspense>
				<CameraControls />
				<Cameras />
				<Bounds fit={ready} clip={ready} observe={ready} margin={1}>
					<SkylineModel group={group} years={years} />
				</Bounds>
				<ambientLight intensity={Math.PI / 2} />
				<spotLight
					castShadow
					position={[0, 20, 200]}
					angle={0.5}
					penumbra={0.1}
					decay={0.4}
					intensity={Math.PI}
					color="#6f6f6f"
				/>
				<pointLight
					castShadow
					position={[0, 40, 50]}
					decay={0}
					intensity={Math.PI}
					color="#c7c7c7"
				/>
				<directionalLight
					color="#a8a8a8"
					intensity={Math.PI}
					position={[0, 10, -50]}
				/>
				<Environment
					files="/three/wildflower_field_4k.jpg"
					environmentIntensity={0.6}
				/>
				<SoftShadows size={80} samples={10} />
				<Grid
					name="grid"
					position={[0, -computed.platformHeight, 0]}
					side={DoubleSide}
					cellSize={0}
					sectionColor={"#4e98b4"}
					sectionSize={40}
					fadeDistance={10000}
					fadeStrength={10}
					fadeFrom={1}
					infiniteGrid={true}
				/>
				<SynthwaveParticles
					position={[0, -computed.platformHeight + 0.05, 0]}
					gridSize={40}
				/>
			</Suspense>
		</Canvas>
	);
}

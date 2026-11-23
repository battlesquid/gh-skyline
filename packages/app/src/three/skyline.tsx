import { Environment, Grid, SoftShadows } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import type { ContributionWeeks } from "../api/types";
import { useParametersContext } from "../stores/parameters";
import { CameraControls, SKYLINE_CAMERA_POSITION } from "./controls";
import { SkylineModel } from "./skyline_model";

export interface SkylineProps {
	years: ContributionWeeks[];
	firstYear: number;
}

const camera = {
	position: SKYLINE_CAMERA_POSITION,
	fov: 10,
	near: 1,
	far: 100_000,
};

export function Skyline(props: SkylineProps) {
	const platformHeight = useParametersContext(
		(state) => state.computed.platformHeight,
	);
	const style = useMemo(() => ({ height: "100%" }), []);
	return (
		<Canvas camera={camera} id="skyline-canvas" style={style} shadows>
			<Suspense>
				<SkylineModel {...props} />
				<CameraControls {...props} />
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
					position={[0, -platformHeight, 0]}
					cellColor={"#4e98b4"}
					cellSize={10}
					sectionColor={"#4e98b4"}
					sectionSize={40}
					fadeDistance={10000}
					fadeStrength={10}
					fadeFrom={1}
					infiniteGrid={true}
				/>
			</Suspense>
		</Canvas>
	);
}

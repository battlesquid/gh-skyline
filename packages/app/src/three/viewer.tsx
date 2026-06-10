import { useContributionQuery } from "@/hooks/use-contribution-query";
import { useParametersContext } from "@/stores/parameters";
import { Grid } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Outline, Selection } from "@react-three/postprocessing";
import { KernelSize } from "postprocessing";
import { useMemo, useRef } from "react";
import { Group } from "three";
import CameraControls from "./camera-controls";
import Lights from "./lights";
import { SkylineModel } from "./model/skyline_model";
function Viewer() {
	const computed = useParametersContext((state) => state.computed);
	const group = useRef<Group>(new Group());
	const style = useMemo(() => ({ height: "100%" }), []);

	useContributionQuery();

	return (
		<Canvas
			id="viewer"
			style={style}
			shadows
			camera={{ near: 0.1, far: 1000000 }}
		>
			<CameraControls />
			<Lights />
			<Selection>
				<EffectComposer autoClear={false}>
					<Outline
						pulseSpeed={0.2}
						edgeStrength={1.5}
						visibleEdgeColor={0x02FFEA}
						kernelSize={KernelSize.LARGE}
						blur
					/>
				</EffectComposer>
				<SkylineModel group={group} />
			</Selection>
			<Grid
				name="grid"
				position={[0, -computed.platformHeight, 0]}
				cellSize={2}
				cellColor={"#252525"}
				sectionSize={10}
				sectionColor={"#297999"}
				fadeDistance={2000}
				fadeStrength={10}
				fadeFrom={1}
				infiniteGrid={true}
			/>
		</Canvas>
	);
}
export default Viewer;
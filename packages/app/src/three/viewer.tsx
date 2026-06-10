import { Grid } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { type Group } from "three";
import { useContributionQuery } from "../hooks/use-contribution-query";
import { useParametersContext } from "../stores/parameters";
import CameraControls from "./controls";
import Lights from "./lights";
import { SkylineModel } from "./model/skyline_model";

function Viewer() {
	const computed = useParametersContext((state) => state.computed);
	const group = useRef<Group | null>(null);
	const style = useMemo(() => ({ height: "100%" }), []);
	
	useContributionQuery();

	return (
		<Canvas
			id="viewer"
			style={style}
			shadows
		>
			<CameraControls />
			<Lights />
			<SkylineModel group={group} />
			<Grid
				name="grid"
				position={[0, -computed.platformHeight, 0]}
				cellSize={10}
				cellColor={"#555555"}
				sectionSize={40}
				sectionColor={"#30454D"}
				fadeDistance={5000}
				fadeStrength={10}
				fadeFrom={1}
				infiniteGrid={true}
			/>
		</Canvas>
	);
}
export default Viewer;
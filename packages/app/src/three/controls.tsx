import { useControlsStore } from "../stores/controls";
import { CameraControls as DreiCameraControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useModelStore } from "../stores/model";

const cameraPadding = (padding: number) => ({
	paddingTop: padding,
	paddingBottom: padding,
	paddingLeft: padding,
	paddingRight: padding,
});

function CameraControls() {
	const controls = useRef<DreiCameraControls | null>(null);
	const reset = useControlsStore((state) => state.reset);
	const model = useModelStore((state) => state.model)
	useEffect(() => {
		if (controls.current === null) {
			return;
		}

		controls.current.normalizeRotations();
		controls.current.setLookAt(120, 0, 200, 0, 0, 0, true);
		if (model !== null) {
			controls.current.fitToBox(model, true, { ...cameraPadding(20) });
		}
	}, [reset, model]);

	return (
		<group name="camera-controls">
			<DreiCameraControls
				makeDefault
				ref={controls}
			/>
		</group>
	);
}

export default CameraControls;

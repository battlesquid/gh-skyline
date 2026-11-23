import { CameraControls as DreiCameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Matrix4, Vector3 } from "three";
import { useShallow } from "zustand/shallow";
import { useControlsStore } from "../stores/controls";
import { useModelStore } from "../stores/model";
import { useParametersContext } from "../stores/parameters";
import type { SkylineProps } from "./skyline";

export const SKYLINE_CAMERA_POSITION: [number, number, number] = [
	400, 400, 800,
];

export function CameraControls({ years }: SkylineProps) {
	const controlsRef = useRef<DreiCameraControls>(null);
	const needsFit = useRef(true);
	const framedAspect = useRef<number | null>(null);
	const domElement = useThree((state) => state.gl.domElement);
	const aspect = useThree((state) => state.size.width / state.size.height);
	const modelDimensions = useParametersContext(
		useShallow(({ inputs }) => [
			inputs.towerSize,
			inputs.dampening,
			inputs.padding,
			inputs.shape,
			inputs.insetText,
			inputs.textDepth,
			inputs.connectYears,
		]),
	);

	useEffect(() => {
		needsFit.current = true;
	}, [years, modelDimensions]);

	useFrame(({ camera }) => {
		const controls = controlsRef.current;
		const snapshot = useModelStore.getState().snapshot;
		if (!controls || !snapshot || !Number.isFinite(aspect) || aspect <= 0)
			return;

		const { reset, clearReset } = useControlsStore.getState();
		const resized = framedAspect.current !== aspect;
		if (needsFit.current || resized || reset) {
			const box = snapshot.model.bounds.clone();
			needsFit.current = false;
			if (reset) clearReset();
			if (box.isEmpty()) return;

			const center = box.getCenter(new Vector3());
			const offset =
				reset || framedAspect.current === null
					? new Vector3(...SKYLINE_CAMERA_POSITION)
					: controls
							.getPosition(new Vector3())
							.sub(controls.getTarget(new Vector3()));
			// fitToBox snaps to an axis; measure in view space to keep the angle.
			const view = new Matrix4()
				.lookAt(offset, new Vector3(), camera.up)
				.invert();
			const size = box.applyMatrix4(view).getSize(new Vector3());
			const distance = controls.getDistanceToFitBox(
				size.x * 1.15,
				size.y * 1.15,
				size.z,
			);
			const position = offset.setLength(distance).add(center);
			controls.maxDistance = distance * 10;
			void controls.setLookAt(
				position.x,
				position.y,
				position.z,
				center.x,
				center.y,
				center.z,
				!resized,
			);
			framedAspect.current = aspect;
		}
	});

	return (
		<DreiCameraControls ref={controlsRef} domElement={domElement} makeDefault />
	);
}

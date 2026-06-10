/**
 * Adapted from Irev-Dev
 * https://github.com/pmndrs/react-three-fiber/discussions/709#discussioncomment-2658482
 * https://codesandbox.io/p/sandbox/polished-silence-ec6v6d?file=%2Fsrc%2FApp.js%3A103%2C30
 */

import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, useState } from "react";
import type {
	OrthographicCamera as OrthographicCameraImpl,
	PerspectiveCamera as PerspectiveCameraImpl,
} from "three";
import { useControlsStore } from "@/stores/controls";

export function Cameras() {
	const fov = 10;
	const persRef = useRef<PerspectiveCameraImpl | null>(null);
	const orthoRef = useRef<OrthographicCameraImpl | null>(null);
	const pixelsFromCenterToTop = useThree((state) => state.size.height / 2);
	const orthographic = useControlsStore(
		(state) => state.projectionMode === "orthographic",
	);
	const [orthoDefault, setOrthoDefault] = useState(orthographic);

	useLayoutEffect(() => {
		if (persRef.current === null || orthoRef.current === null) {
			return;
		}
		const pcam = persRef.current;
		const ocam = orthoRef.current;
		// convert to radians and half angle since we're only interested in the angle from the center to the top of frame
		const fovFactor =
			Math.tan(((fov / 2) * Math.PI) / 180) / pixelsFromCenterToTop;
		const persDistanceToOrthoZoom = (distance: number) =>
			1 / fovFactor / distance;
		const orthoZoomToPersDistance = (zoom: number) => 1 / zoom / fovFactor;
		if (!pcam || !ocam || !pcam.position) return;
		setTimeout(() => {
			if (orthographic) {
				ocam.position.copy(pcam.position.clone());
				ocam.zoom = persDistanceToOrthoZoom(ocam.position.length());
				ocam.updateProjectionMatrix();
			} else {
				pcam.position.copy(ocam.position.clone());
				const distance = orthoZoomToPersDistance(ocam.zoom);
				pcam.position.setLength(distance);
			}
			setOrthoDefault(orthographic);
		});
	}, [orthographic]);

	return (
		<>
			<PerspectiveCamera
				position={[5, 5, 10]}
				ref={persRef}
				makeDefault={!orthoDefault}
				fov={fov}
			/>
			<OrthographicCamera
				position={[5, 5, 10]}
				zoom={10}
				ref={orthoRef}
				makeDefault={orthoDefault}
			/>
		</>
	);
}

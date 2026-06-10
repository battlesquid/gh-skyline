import { Instance, type PositionMesh } from "@react-three/drei";
import { useRef } from "react";
import { Color } from "three";
import type { ContributionDay } from "@/api/types";
import { useTowerStore } from "@/stores/tower";

interface ContributionTowerProps {
	x: number;
	y: number;
	day: ContributionDay;
	color: Color;
	dampening: number;
	size: number;
	onPointerEnter?: () => void;
	onPointerLeave?: () => void;
}

const tempColor = new Color();

export function ContributionTower({
	x,
	y,
	day,
	color,
	dampening,
	size,
	onPointerEnter,
	onPointerLeave,
}: ContributionTowerProps) {
	const height = (day.contributionCount * size) / dampening;
	const mesh = useRef<PositionMesh | null>(null);
	const setPosition = useTowerStore((state) => state.setPosition);
	const setTarget = useTowerStore((state) => state.setTarget);
	return (
		<Instance
			ref={mesh}
			scale={[size, height, size]}
			position={[x, height / 2, y]}
			color={color}
			onPointerEnter={(e) => {
				if (mesh.current === null) {
					return;
				}
				tempColor.copy(color);
				mesh.current.color.set(tempColor.multiplyScalar(1.6));
				e.stopPropagation();
				onPointerEnter?.();
				setTarget(day);
			}}
			onPointerMove={(e) => {
				setPosition({ x: e.clientX, y: e.clientY });
			}}
			onPointerLeave={(e) => {
				if (mesh.current === null) {
					return;
				}
				mesh.current.color.set(color);
				e.stopPropagation();
				onPointerLeave?.();
				setTarget(null);
			}}
		/>
	);
}

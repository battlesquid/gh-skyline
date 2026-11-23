import { memo, useLayoutEffect, useRef } from "react";
import { Color, type InstancedMesh, Matrix4 } from "three";
import { useTowerStore } from "../stores/tower";
import { measureWork } from "./pipeline_metrics";
import {
	type TowerPaint,
	type TowerSettings,
	type TowerYear,
	towerBox,
	towerColor,
} from "./tower_parts";

export const ContributionTowers = memo(function ContributionTowers({
	days,
	origin,
	settings,
	paint,
}: {
	days: TowerYear["days"];
	origin: number;
	settings: TowerSettings;
	paint: TowerPaint;
}) {
	const mesh = useRef<InstancedMesh>(null);
	const selected = useRef<number | null>(null);
	const setTarget = useTowerStore((state) => state.setTarget);
	const setPosition = useTowerStore((state) => state.setPosition);
	const count = days.length;

	useLayoutEffect(() => {
		const instance = mesh.current;
		if (!instance) return;
		measureWork("tower matrices", () => {
			const matrix = new Matrix4();
			days.forEach((day, i) => {
				const { x, z, height } = towerBox(day, settings);
				matrix.makeScale(settings.size, height, settings.size);
				matrix.setPosition(x, height / 2, z);
				instance.setMatrixAt(i, matrix);
			});
			instance.instanceMatrix.needsUpdate = true;
			instance.computeBoundingSphere();
			instance.computeBoundingBox();
		});
	}, [days, settings]);

	useLayoutEffect(() => {
		const instance = mesh.current;
		if (!instance) return;
		measureWork("tower colors", () => {
			const color = new Color();
			days.forEach((day, i) =>
				instance.setColorAt(i, color.set(towerColor(day, paint))),
			);
			if (instance.instanceColor) instance.instanceColor.needsUpdate = true;
		});
	}, [days, paint]);

	useLayoutEffect(
		() => () => {
			if (selected.current !== null) setTarget(null);
			selected.current = null;
		},
		[days, setTarget],
	);

	function highlight(id: number, active: boolean) {
		const instance = mesh.current;
		if (!instance?.instanceColor || !days[id]) return;
		const color = new Color(towerColor(days[id], paint));
		instance.setColorAt(id, active ? color.multiplyScalar(1.6) : color);
		instance.instanceColor.needsUpdate = true;
	}

	if (!count) return null;
	return (
		<instancedMesh
			ref={mesh}
			args={[undefined, undefined, count]}
			position-z={origin}
			castShadow
			receiveShadow
			onPointerMove={(event) => {
				const id = event.instanceId;
				if (id === undefined) return;
				event.stopPropagation();
				if (selected.current !== id) {
					if (selected.current !== null) highlight(selected.current, false);
					selected.current = id;
					highlight(id, true);
					setTarget(days[id].day);
				}
				setPosition({ x: event.clientX, y: event.clientY });
			}}
			onPointerOut={() => {
				if (selected.current === null) return;
				highlight(selected.current, false);
				selected.current = null;
				setTarget(null);
			}}
		>
			<boxGeometry />
			<meshStandardMaterial roughness={0.5} metalness={0.2} />
		</instancedMesh>
	);
});

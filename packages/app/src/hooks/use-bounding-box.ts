import {
	type DependencyList,
	RefObject,
	useEffect,
	useState
} from "react";
import { Mesh, type Object3D, Vector3 } from "three";
import { isNullish } from "../utils";
import { getThreeBoundingBox } from "../three/utils/bounding-box";

export interface BoundingBoxProps {
	obj: RefObject<Object3D | null> | undefined;
	setter?: (size: Vector3) => void;
}

export const useBoundingBox = (
	props: BoundingBoxProps,
	deps: DependencyList = [],
) => {
	const { obj, setter } = props ?? {};
	const [size, setSize] = useState<Vector3>(new Vector3(0, 0, 0));
	useEffect(() => {
		if (isNullish(obj) || isNullish(obj.current)) {
			return;
		}
		const copy = obj.current.clone();
		copy.rotation.set(0, 0, 0);
		if (copy instanceof Mesh) {
			copy.geometry.computeBoundingBox();
			copy.geometry.center();
		}
		const bb = getThreeBoundingBox(copy);
		if (setter) {
			setter(bb);
		} else {
			setSize(bb);
		}
	}, [obj, obj?.current, ...deps]);
	return { size };
};

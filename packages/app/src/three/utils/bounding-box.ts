import { Box3, type Object3D, Vector3 } from "three";

export const getBoundingBoxVolume = (bb: Box3) => {
    const x = bb.max.x - bb.min.x;
    const y = bb.max.y - bb.min.y;
    const z = bb.max.z - bb.min.z;
    return x * y * z;
};

export const getThreeBoundingBox = (obj: Object3D) => new Box3().setFromObject(obj, true).getSize(new Vector3());

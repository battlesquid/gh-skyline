import { Environment, SoftShadows } from "@react-three/drei";
import { Suspense } from "react";
import { useParametersContext } from "../stores/parameters";

function Lights() {
    const computed = useParametersContext((state) => state.computed);
    return (
        <group name="lights">
            <ambientLight intensity={0.4} />
            <pointLight
                castShadow
                position={[10, 50, computed.halfModelLength + 30]}
                decay={0.3}
                intensity={Math.PI * 1.2}
                color="#FFDDF9"
            />
            <pointLight
                castShadow
                position={[-computed.modelWidth, 35, -(computed.halfModelLength)]}
                decay={0.3}
                intensity={Math.PI * 0.6}
                color="#cce0ff"
            />
            <pointLight
                castShadow
                position={[50, 45, computed.halfModelLength + 25]}
                decay={0.2}
                intensity={Math.PI * 0.8}
                color="#FFD6FA"
            />
            <directionalLight
                color="#ffffff"
                intensity={1.8}
                position={[5, 15, 10]}
                castShadow
            />
            <Suspense>
                <Environment
                    files="/three/wildflower_field_4k.jpg"
                    environmentIntensity={0.8}
                />
            </Suspense>
            <SoftShadows size={80} samples={10} />
        </group>
    )
}

export default Lights;
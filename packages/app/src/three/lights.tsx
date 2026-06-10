import { Environment, SoftShadows } from "@react-three/drei";
import { Suspense } from "react";
import { useParametersContext } from "../stores/parameters";

function Lights() {
    const computed = useParametersContext((state) => state.computed);
    return (
        <group name="lights">
            <ambientLight intensity={Math.PI / 2} />
            <spotLight
                castShadow
                position={[0, 20, 200]}
                angle={0.5}
                penumbra={0.1}
                decay={0.4}
                intensity={Math.PI}
                color="#6f6f6f"
            />
            <pointLight
                castShadow
                position={[0, 40, computed.halfModelLength + 25]}
                decay={0}
                intensity={Math.PI}
                color="#c7c7c7"
            />
            <directionalLight
                color="#a8a8a8"
                intensity={Math.PI}
                position={[0, 10, 0]}
            />
            <Suspense>
                <Environment
                    files="/three/wildflower_field_4k.jpg"
                    environmentIntensity={0.6}
                />
            </Suspense>
            <SoftShadows size={80} samples={10} />
        </group>
    )
}

export default Lights;
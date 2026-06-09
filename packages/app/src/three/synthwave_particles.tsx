import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
	AdditiveBlending,
	Color,
	DoubleSide,
	InstancedBufferAttribute,
	InstancedBufferGeometry,
	PlaneGeometry,
	ShaderMaterial,
} from "three";

export interface SynthwaveParticlesProps {
	count?: number;
	fadeStart?: number;
	fadeEnd?: number;
	gridSize?: number;
	trailLength?: number;
	trailWidth?: number;
	speed?: number;
	bounds?: number;
	spread?: number;
	color?: string;
	colorB?: string;
	intensity?: number;
	position?: [number, number, number];
}

const vertexShader = /* glsl */ `
	attribute float iLineCoord;
	attribute float iAxis;
	attribute float iPhase;
	attribute float iSpeed;

	uniform float uTime;
	uniform float uBounds;
	uniform float uTrailLength;
	uniform float uTrailWidth;
	uniform float uGridSize;
	uniform float uSpeed;

	varying float vAlongT;
	varying float vAcrossT;
	varying float vCameraDist;
	varying float vAxis;

	void main() {
		float snapped = floor(iLineCoord / uGridSize + 0.5) * uGridSize;
		float travelRange = uBounds * 2.0;
		float head = mod(uTime * uSpeed * iSpeed + iPhase * travelRange, travelRange) - uBounds;

		// Plane is in XZ after rotateX(-PI/2): position.x in [-0.5, 0.5] is width,
		// position.z in [-0.5, 0.5] is length. Anchor the head at position.z == 0.5
		// so the rest of the quad extends behind it.
		float widthOffset = position.x * uTrailWidth;
		float lengthOffset = (position.z - 0.5) * uTrailLength;

		// axis=0 -> line at constant Z (snapped), particle travels along world X
		// axis=1 -> line at constant X (snapped), particle travels along world Z
		float ax = step(0.5, iAxis);
		float worldX = mix(head + lengthOffset, snapped + widthOffset, ax);
		float worldZ = mix(snapped + widthOffset, head + lengthOffset, ax);
		vec3 worldOffset = vec3(worldX, 0.0, worldZ);

		vec4 mvPos = modelViewMatrix * vec4(worldOffset, 1.0);
		gl_Position = projectionMatrix * mvPos;

		vAlongT = 0.5 - position.z; // 0 at head, 1 at tail
		vAcrossT = position.x * 2.0; // -1..1 across width
		vCameraDist = length(mvPos.xyz);
		vAxis = ax;
	}
`;

const fragmentShader = /* glsl */ `
	precision highp float;

	uniform vec3 uColor;
	uniform vec3 uColorB;
	uniform float uFadeStart;
	uniform float uFadeEnd;
	uniform float uIntensity;
	uniform float uTrailLength;
	uniform float uTrailWidth;

	varying float vAlongT;
	varying float vAcrossT;
	varying float vCameraDist;
	varying float vAxis;

	void main() {
		// Trail body: 1D exponential along the length, gaussian across the width
		float trail = exp(-vAlongT * 3.0);
		float across = exp(-vAcrossT * vAcrossT * 4.0);

		// Rounded head: 2D radial gaussian in world units so the bright cap is
		// circular regardless of the quad's aspect ratio.
		float alongWorld = vAlongT * uTrailLength;
		float acrossWorld = vAcrossT * uTrailWidth * 0.5;
		float headRadius = uTrailWidth * 0.2;
		float r = length(vec2(alongWorld, acrossWorld)) / headRadius;
		float head = exp(-r * r * 1.6) * 1.8;

		float fade = 1.0 - smoothstep(uFadeStart, uFadeEnd, vCameraDist);
		float a = (trail * across + head) * fade;
		vec3 col = mix(uColor, uColorB, vAxis);
		gl_FragColor = vec4(col * a * uIntensity, a);
	}
`;

export function SynthwaveParticles({
	count = 80,
	fadeStart = 600,
	fadeEnd = 3500,
	gridSize = 40,
	trailLength = 420,
	trailWidth = 4,
	speed = 80,
	bounds = 1200,
	spread = 840,
	color = "#FF0090",
	colorB = "#00F0FF",
	intensity = 2.5,
	position = [0, 0, 0],
}: SynthwaveParticlesProps) {
	const materialRef = useRef<ShaderMaterial | null>(null);

	const { geometry, material } = useMemo(() => {
		const base = new PlaneGeometry(1, 1);
		base.rotateX(-Math.PI / 2);

		const geo = new InstancedBufferGeometry();
		geo.index = base.index;
		geo.attributes.position = base.attributes.position;
		geo.attributes.uv = base.attributes.uv;
		geo.attributes.normal = base.attributes.normal;
		geo.instanceCount = count;

		const lineCoord = new Float32Array(count);
		const axis = new Float32Array(count);
		const phase = new Float32Array(count);
		const speedJitter = new Float32Array(count);

		for (let i = 0; i < count; i++) {
			lineCoord[i] = (Math.random() - 0.5) * spread * 2;
			axis[i] = i % 2 === 0 ? 0.0 : 1.0;
			phase[i] = Math.random();
			speedJitter[i] = 0.6 + Math.random() * 0.8;
		}

		geo.setAttribute(
			"iLineCoord",
			new InstancedBufferAttribute(lineCoord, 1),
		);
		geo.setAttribute("iAxis", new InstancedBufferAttribute(axis, 1));
		geo.setAttribute("iPhase", new InstancedBufferAttribute(phase, 1));
		geo.setAttribute("iSpeed", new InstancedBufferAttribute(speedJitter, 1));

		const mat = new ShaderMaterial({
			uniforms: {
				uTime: { value: 0 },
				uBounds: { value: bounds },
				uTrailLength: { value: trailLength },
				uTrailWidth: { value: trailWidth },
				uGridSize: { value: gridSize },
				uSpeed: { value: speed },
				uColor: { value: new Color(color) },
				uColorB: { value: new Color(colorB) },
				uFadeStart: { value: fadeStart },
				uFadeEnd: { value: fadeEnd },
				uIntensity: { value: intensity },
			},
			vertexShader,
			fragmentShader,
			transparent: true,
			depthWrite: false,
			blending: AdditiveBlending,
			side: DoubleSide,
		});

		materialRef.current = mat;
		return { geometry: geo, material: mat };
		// Regenerate instance buffers only when these change. Other props are pushed
		// into uniforms via the effect below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [count, bounds, spread]);

	useEffect(() => {
		const u = materialRef.current?.uniforms;
		if (!u) return;
		u.uFadeStart.value = fadeStart;
		u.uFadeEnd.value = fadeEnd;
		u.uTrailLength.value = trailLength;
		u.uTrailWidth.value = trailWidth;
		u.uGridSize.value = gridSize;
		u.uSpeed.value = speed;
		u.uBounds.value = bounds;
		u.uIntensity.value = intensity;
		(u.uColor.value as Color).set(color);
		(u.uColorB.value as Color).set(colorB);
	}, [
		fadeStart,
		fadeEnd,
		trailLength,
		trailWidth,
		gridSize,
		speed,
		bounds,
		intensity,
		color,
		colorB,
	]);

	useEffect(() => {
		return () => {
			geometry.dispose();
			material.dispose();
		};
	}, [geometry, material]);

	useFrame((state) => {
		const u = materialRef.current?.uniforms;
		if (u) u.uTime.value = state.clock.elapsedTime;
	});

	return (
		<mesh
			geometry={geometry}
			material={material}
			position={position}
			frustumCulled={false}
		/>
	);
}

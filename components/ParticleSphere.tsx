"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* -------------------------------------------------------------------------- */
/*  Point cloud shaped as a sphere. Slow drift, pointer parallax, soft dots.   */
/* -------------------------------------------------------------------------- */

const COUNT = 4200;
const RADIUS = 2;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uWobble;
  attribute float aScale;
  varying float vDepth;
  varying float vTwinkle;

  void main() {
    vec3 p = position;

    // Gentle organic breathing along the surface normal.
    vec3 dir = normalize(p);
    float n =
      sin(p.x * 1.7 + uTime * 0.6) +
      sin(p.y * 2.1 - uTime * 0.5) +
      sin(p.z * 1.9 + uTime * 0.4);
    p += dir * n * 0.035 * uWobble;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Closer points render larger and brighter.
    vDepth = clamp((mvPosition.z + 6.0) / 8.0, 0.0, 1.0);
    vTwinkle = 0.7 + 0.3 * sin(uTime * 1.6 + aScale * 40.0);

    gl_PointSize = uSize * aScale * uPixelRatio * (7.5 / -mvPosition.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vDepth;
  varying float vTwinkle;

  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.12, d);
    alpha *= mix(0.12, 0.95, vDepth) * vTwinkle;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function Sphere({ reducedMotion }: { reducedMotion: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const { positions, scales } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      positions[i * 3] = Math.cos(theta) * r * RADIUS;
      positions[i * 3 + 1] = y * RADIUS;
      positions[i * 3 + 2] = Math.sin(theta) * r * RADIUS;
      scales[i] = 0.5 + Math.random() * 1.6;
    }
    return { positions, scales };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 2.4 },
      uPixelRatio: {
        value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1,
      },
      uWobble: { value: reducedMotion ? 0 : 1 },
      uColor: { value: new THREE.Color("#f4f4f5") },
    }),
    [reducedMotion],
  );

  useFrame((state, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;

    // Continuous slow spin.
    if (!reducedMotion) {
      pts.rotation.y += delta * 0.08;
    }

    // Ease the whole cloud toward the pointer for a parallax tilt.
    const px = state.pointer.x;
    const py = state.pointer.y;
    pointer.current.x += (px - pointer.current.x) * 0.05;
    pointer.current.y += (py - pointer.current.y) * 0.05;
    pts.rotation.x = THREE.MathUtils.lerp(
      pts.rotation.x,
      -pointer.current.y * 0.35,
      0.1,
    );
    pts.rotation.z = THREE.MathUtils.lerp(
      pts.rotation.z,
      pointer.current.x * 0.15,
      0.1,
    );

    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticleSphere() {
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
      onCreated={({ gl }) => {
        // Allow the browser to auto-restore a lost context instead of dying.
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => e.preventDefault(),
          false,
        );
      }}
    >
      <Sphere reducedMotion={reducedMotion} />
    </Canvas>
  );
}

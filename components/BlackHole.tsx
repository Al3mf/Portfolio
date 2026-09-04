"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, wrapEffect } from "@react-three/postprocessing";
import { Effect } from "postprocessing";
import * as THREE from "three";

/* ========================================================================== */
/*  Interactive black hole: particle accretion disk + screen-space lensing.     */
/*  Move the cursor over it and the disk is stirred while space bends toward     */
/*  the event horizon.                                                          */
/* ========================================================================== */

const DISK_COUNT = 16000;
const STAR_COUNT = 1800;

// The hole sits in the upper half of the hero so the copy below stays readable.
const GROUP_Y = 1.3;
const DISK_TILT = -1.03;

// Shared, mutated every frame by <Scene> and read by <Lens>.
type Shared = {
  center: THREE.Vector2; // black hole position in screen UV (0..1)
  pointer: THREE.Vector2; // cursor in screen UV
  hover: number; // eased 0..1 proximity to the hole
  active: number; // 1 while the pointer is over the canvas
  aspect: number;
};

/* --------------------------- accretion disk -------------------------------- */

const diskVert = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uHover;
  uniform vec3 uPointer;      // cursor projected onto the disk plane
  uniform float uReduced;

  attribute float aRadius;
  attribute float aAngle;
  attribute float aSpeed;
  attribute float aScale;
  attribute float aHeight;

  varying float vBright;
  varying float vTemp;

  void main() {
    float t = uReduced > 0.5 ? 0.0 : uTime;

    float ang = aAngle + t * aSpeed;
    vec3 pos = vec3(cos(ang) * aRadius, aHeight, sin(ang) * aRadius);

    // Cursor stirs the disk: nearby atoms get a swirl + radial kick.
    vec3 worldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    float pd = distance(worldPos.xz, uPointer.xz);
    float infl = smoothstep(1.8, 0.0, pd) * uHover;
    float wob = sin(t * 6.0 + aAngle * 9.0);
    vec3 radial = normalize(vec3(pos.x, 0.0, pos.z));
    pos += radial * wob * 0.16 * infl;
    pos.y += sin(t * 5.0 + aRadius * 12.0) * 0.13 * infl;
    // tangential boost — the whole neighbourhood spins faster under the cursor
    pos.xz += vec2(-pos.z, pos.x) * 0.1 * infl;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * uSize * uPixelRatio * (26.0 / -mv.z);

    // Inner edge is hotter; the side rotating toward us (−x here) is Doppler-boosted.
    vTemp = smoothstep(3.7, 1.0, aRadius);
    float doppler = 0.55 + 0.45 * smoothstep(0.4, -1.0, sin(ang));
    vBright = mix(0.35, 1.0, vTemp) * doppler + infl * 0.6;
  }
`;

const diskFrag = /* glsl */ `
  varying float vBright;
  varying float vTemp;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.05, d) * vBright * 0.62;

    // hot white-blue core -> orange -> deep red rim
    vec3 hot = vec3(0.75, 0.85, 1.0);
    vec3 mid = vec3(1.0, 0.62, 0.25);
    vec3 cool = vec3(0.85, 0.18, 0.08);
    vec3 col = mix(cool, mid, smoothstep(0.0, 0.55, vTemp));
    col = mix(col, hot, smoothstep(0.55, 1.0, vTemp));

    gl_FragColor = vec4(col, a);
  }
`;

function AccretionDisk({
  reduced,
  pointerWorld,
  hover,
}: {
  reduced: boolean;
  pointerWorld: React.MutableRefObject<THREE.Vector3>;
  hover: React.MutableRefObject<number>;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const { positions, attrs } = useMemo(() => {
    const positions = new Float32Array(DISK_COUNT * 3);
    const aRadius = new Float32Array(DISK_COUNT);
    const aAngle = new Float32Array(DISK_COUNT);
    const aSpeed = new Float32Array(DISK_COUNT);
    const aScale = new Float32Array(DISK_COUNT);
    const aHeight = new Float32Array(DISK_COUNT);

    for (let i = 0; i < DISK_COUNT; i++) {
      // concentrate particles toward the inner edge
      const r = 1.0 + Math.pow(Math.random(), 1.8) * 2.7;
      const a = Math.random() * Math.PI * 2;
      aRadius[i] = r;
      aAngle[i] = a;
      // Keplerian-ish: inner orbits much faster
      aSpeed[i] = (0.55 / Math.pow(r, 1.5)) * (0.85 + Math.random() * 0.3);
      aScale[i] = 0.4 + Math.random() * 1.7;
      const flare = 0.03 + (r - 1.0) * 0.05;
      aHeight[i] = (Math.random() - 0.5) * 2 * flare * (0.4 + Math.random());
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = aHeight[i];
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    return {
      positions,
      attrs: { aRadius, aAngle, aSpeed, aScale, aHeight },
    };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 0.85 },
      uPixelRatio: {
        value:
          typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1,
      },
      uHover: { value: 0 },
      uPointer: { value: new THREE.Vector3() },
      uReduced: { value: reduced ? 1 : 0 },
    }),
    [reduced],
  );

  useFrame((_, delta) => {
    if (!mat.current) return;
    const u = mat.current.uniforms;
    u.uTime.value += delta;
    u.uHover.value = hover.current;
    u.uPointer.value.copy(pointerWorld.current);
  });

  return (
    <points rotation={[DISK_TILT, 0, 0.1]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aRadius" args={[attrs.aRadius, 1]} />
        <bufferAttribute attach="attributes-aAngle" args={[attrs.aAngle, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[attrs.aSpeed, 1]} />
        <bufferAttribute attach="attributes-aScale" args={[attrs.aScale, 1]} />
        <bufferAttribute attach="attributes-aHeight" args={[attrs.aHeight, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={diskVert}
        fragmentShader={diskFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------ starfield --------------------------------- */

function Starfield() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const p = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const v = new THREE.Vector3()
        .randomDirection()
        .multiplyScalar(18 + Math.random() * 26);
      p.set([v.x, v.y, v.z], i * 3);
    }
    return p;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.006;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        sizeAttenuation
        color="#94a3b8"
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </points>
  );
}

/* ---------------------------- lensing effect ------------------------------ */

const lensFrag = /* glsl */ `
  uniform vec2 uCenter;
  uniform vec2 uPointer;
  uniform float uAspect;
  uniform float uStrength;
  uniform float uRadius;
  uniform float uSwirl;
  uniform float uPointerAmt;

  void mainUv(inout vec2 uv) {
    vec2 d = uv - uCenter;
    d.x *= uAspect;
    float dist = length(d);

    // gravitational deflection: sample coordinates are pulled inward ~ 1/dist^2
    float pull = uStrength * (uRadius * uRadius) / (dist * dist + 0.0010);
    pull = min(pull, 0.92);

    // frame dragging — space swirls around the hole
    float ang = uSwirl * uStrength / (dist + 0.05);
    float s = sin(ang), c = cos(ang);
    d = mat2(c, -s, s, c) * d;

    vec2 dir = d / max(dist, 1e-4);
    d -= dir * pull * dist;
    d.x /= uAspect;
    uv = uCenter + d;

    // a soft moving bulge that follows the cursor
    vec2 pd = (uv - uPointer);
    pd.x *= uAspect;
    float pl = length(pd);
    float bulge = uPointerAmt * 0.05 / (pl * pl + 0.03);
    uv -= (pd / max(pl, 1e-4)) * min(bulge, 0.06) * vec2(1.0 / uAspect, 1.0);
  }
`;

class LensEffectImpl extends Effect {
  constructor() {
    super("BlackHoleLens", lensFrag, {
      uniforms: new Map<string, THREE.Uniform>([
        ["uCenter", new THREE.Uniform(new THREE.Vector2(0.5, 0.5))],
        ["uPointer", new THREE.Uniform(new THREE.Vector2(0.5, 0.5))],
        ["uAspect", new THREE.Uniform(1)],
        ["uStrength", new THREE.Uniform(0.08)],
        ["uRadius", new THREE.Uniform(0.15)],
        ["uSwirl", new THREE.Uniform(0.1)],
        ["uPointerAmt", new THREE.Uniform(0)],
      ]),
    });
  }
}

const LensEffect = wrapEffect(LensEffectImpl);

function Lens({ shared }: { shared: React.MutableRefObject<Shared> }) {
  const ref = useRef<LensEffectImpl>(null);
  useFrame(() => {
    const eff = ref.current;
    if (!eff) return;
    const u = eff.uniforms;
    const s = shared.current;
    (u.get("uCenter")!.value as THREE.Vector2).copy(s.center);
    (u.get("uPointer")!.value as THREE.Vector2).copy(s.pointer);
    u.get("uAspect")!.value = s.aspect;
    u.get("uStrength")!.value = 0.075 + s.hover * 0.3;
    u.get("uSwirl")!.value = 0.06 + s.hover * 0.24;
    u.get("uPointerAmt")!.value = s.hover;
  });
  return <LensEffect ref={ref} />;
}

/* ------------------------------- scene ----------------------------------- */

function Scene({
  reduced,
  shared,
}: {
  reduced: boolean;
  shared: React.MutableRefObject<Shared>;
}) {
  const { camera, size } = useThree();
  const pointerWorld = useRef(new THREE.Vector3());
  const hover = useRef(0);
  const tmp = useRef(new THREE.Vector3());

  useFrame((state) => {
    // project the cursor onto the disk plane (y = GROUP_Y)
    const p = state.pointer;
    tmp.current.set(p.x, p.y, 0.5).unproject(camera);
    tmp.current.sub(camera.position).normalize();
    const tHit = (GROUP_Y - camera.position.y) / tmp.current.y;
    pointerWorld.current
      .copy(camera.position)
      .addScaledVector(tmp.current, tHit);

    // where is the hole (group origin) on screen?
    const centerNdc = tmp.current.set(0, GROUP_Y, 0).project(camera);
    const cx = centerNdc.x * 0.5 + 0.5;
    const cy = centerNdc.y * 0.5 + 0.5;

    const pux = p.x * 0.5 + 0.5;
    const puy = p.y * 0.5 + 0.5;

    // hover ramps up as the cursor nears the hole (screen space, aspect aware)
    const s = shared.current;
    const aspect = size.width / size.height;
    const dx = (pux - cx) * aspect;
    const dy = puy - cy;
    const near = 1 - Math.min(1, Math.hypot(dx, dy) / 0.6);
    const target = reduced || s.active < 0.5 ? 0 : near * near;
    hover.current += (target - hover.current) * 0.07;

    s.center.set(cx, cy);
    s.pointer.set(pux, puy);
    s.aspect = aspect;
    s.hover = hover.current;
  });

  return (
    <>
      <Starfield />
      <group position={[0, GROUP_Y, 0]}>
        <AccretionDisk
          reduced={reduced}
          pointerWorld={pointerWorld}
          hover={hover}
        />

        {/* event horizon — opaque, occludes the disk behind it */}
        <mesh>
          <sphereGeometry args={[0.9, 64, 64]} />
          <meshBasicMaterial color="#000000" />
        </mesh>

        {/* photon ring */}
        <mesh rotation={[DISK_TILT, 0, 0.1]}>
          <torusGeometry args={[0.96, 0.01, 16, 180]} />
          <meshBasicMaterial color="#aebfe0" toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}

/* ------------------------------ wrapper --------------------------------- */

export default function BlackHole() {
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const shared = useRef<Shared>({
    center: new THREE.Vector2(0.5, 0.5),
    pointer: new THREE.Vector2(0.5, 0.5),
    hover: 0,
    active: 0,
    aspect: 1,
  });

  return (
    <Canvas
      camera={{ position: [0, 0, 7.5], fov: 40 }}
      dpr={[1, 2]}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{ background: "transparent" }}
      onCreated={({ gl }) => {
        const el = gl.domElement;
        el.addEventListener(
          "webglcontextlost",
          (e) => e.preventDefault(),
          false,
        );
        el.addEventListener("pointermove", () => {
          shared.current.active = 1;
        });
        el.addEventListener("pointerenter", () => {
          shared.current.active = 1;
        });
        el.addEventListener("pointerleave", () => {
          shared.current.active = 0;
        });
      }}
    >
      <Scene reduced={reduced} shared={shared} />
      <EffectComposer>
        <Lens shared={shared} />
        <Bloom
          intensity={0.7}
          luminanceThreshold={0.42}
          luminanceSmoothing={0.85}
          mipmapBlur
          radius={0.6}
        />
      </EffectComposer>
    </Canvas>
  );
}

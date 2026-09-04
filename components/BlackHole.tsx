"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, wrapEffect } from "@react-three/postprocessing";
import { Effect } from "postprocessing";
import * as THREE from "three";

/* ========================================================================== */
/*  Interactive black hole: a particle accretion disk orbiting an event         */
/*  horizon, a soft glow ring hugging the shadow, drifting stellar dust and a    */
/*  starfield. Screen-space lensing bends it all toward the hole and deepens     */
/*  as the cursor nears it — the cursor is tracked across the whole hero, so     */
/*  hovering the headline works too.                                             */
/* ========================================================================== */

const DISK_COUNT = 17000;
const DUST_COUNT = 5200;
const STAR_COUNT = 1800;

// The hole sits in the upper half of the hero so the copy below stays readable.
const GROUP_Y = 1.3;
const DISK_TILT = -0.98;

type Shared = {
  center: THREE.Vector2; // hole position in screen UV (0..1)
  pointer: THREE.Vector2; // cursor in screen UV
  ndc: THREE.Vector2; // cursor in NDC (-1..1, y up), tracked across the whole hero
  hover: number; // eased 0..1 proximity to the hole
  active: number; // 1 while the pointer is over the hero
  aspect: number;
};

/* --------------------------- accretion disk -------------------------------- */

const diskVert = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uHover;
  uniform float uSpeedMul;    // how fast this band circulates
  uniform float uClump;       // 0..1 amount of travelling density variation
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

    float ang = aAngle + t * aSpeed * uSpeedMul;
    vec3 pos = vec3(cos(ang) * aRadius, aHeight, sin(ang) * aRadius);

    // Cursor stirs the disk: nearby atoms get a swirl + radial kick.
    vec3 worldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    float pd = distance(worldPos.xz, uPointer.xz);
    float infl = smoothstep(2.4, 0.0, pd) * uHover;
    float wob = sin(t * 6.0 + aAngle * 9.0);
    vec3 radial = normalize(vec3(pos.x, 0.0, pos.z));
    pos += radial * wob * 0.16 * infl;
    pos.y += sin(t * 5.0 + aRadius * 12.0) * 0.13 * infl;
    // tangential boost — the whole neighbourhood spins faster under the cursor
    pos.xz += vec2(-pos.z, pos.x) * 0.1 * infl;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * uSize * uPixelRatio * (26.0 / -mv.z);

    // Inner edge is hotter; the side rotating toward us is Doppler-boosted.
    vTemp = smoothstep(3.7, 0.95, aRadius);
    float doppler = 0.55 + 0.45 * smoothstep(0.4, -1.0, sin(ang));
    // travelling clumps so the band visibly circulates
    float clump = 1.0 + uClump * 0.85 * sin(ang * 5.0 - aAngle * 3.0 + aRadius * 2.0);
    vBright = mix(0.4, 1.15, vTemp) * doppler * clump + infl * 0.6;
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

    // deep amber rim -> orange -> hot near-white core
    vec3 hot = vec3(1.0, 0.95, 0.86);
    vec3 mid = vec3(1.0, 0.62, 0.26);
    vec3 cool = vec3(0.82, 0.22, 0.08);
    vec3 col = mix(cool, mid, smoothstep(0.0, 0.45, vTemp));
    col = mix(col, hot, smoothstep(0.7, 1.0, vTemp));

    gl_FragColor = vec4(col, a);
  }
`;

/** Builds the orbiting particle field: a bright thin ring hugging the shadow
 *  plus the broader flared disk beyond it. */
function useDiskAttributes(count: number, rInner: number, rOuter: number, thin: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const aRadius = new Float32Array(count);
    const aAngle = new Float32Array(count);
    const aSpeed = new Float32Array(count);
    const aScale = new Float32Array(count);
    const aHeight = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = rInner + Math.pow(Math.random(), 1.7) * (rOuter - rInner);
      const a = Math.random() * Math.PI * 2;
      aRadius[i] = r;
      aAngle[i] = a;
      aSpeed[i] = (0.55 / Math.pow(r, 1.5)) * (0.85 + Math.random() * 0.3);
      aScale[i] = 0.4 + Math.random() * 1.7;
      const flare = thin + (r - rInner) * 0.05;
      aHeight[i] = (Math.random() - 0.5) * 2 * flare * (0.4 + Math.random());
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = aHeight[i];
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    return { positions, aRadius, aAngle, aSpeed, aScale, aHeight };
  }, [count, rInner, rOuter, thin]);
}

function DiskPoints({
  attrs,
  size,
  speedMul,
  clump,
  reduced,
  pointerWorld,
  hover,
}: {
  attrs: ReturnType<typeof useDiskAttributes>;
  size: number;
  speedMul: number;
  clump: number;
  reduced: boolean;
  pointerWorld: React.MutableRefObject<THREE.Vector3>;
  hover: React.MutableRefObject<number>;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: size },
      uSpeedMul: { value: speedMul },
      uClump: { value: clump },
      uPixelRatio: {
        value:
          typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1,
      },
      uHover: { value: 0 },
      uPointer: { value: new THREE.Vector3() },
      uReduced: { value: reduced ? 1 : 0 },
    }),
    [reduced, size, speedMul, clump],
  );

  useFrame((_, delta) => {
    if (!mat.current) return;
    const u = mat.current.uniforms;
    u.uTime.value += Math.min(delta, 0.05);
    u.uHover.value = hover.current;
    u.uPointer.value.copy(pointerWorld.current);
  });

  return (
    <points rotation={[DISK_TILT, 0, 0.1]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attrs.positions, 3]} />
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

function AccretionDisk({
  reduced,
  pointerWorld,
  hover,
}: {
  reduced: boolean;
  pointerWorld: React.MutableRefObject<THREE.Vector3>;
  hover: React.MutableRefObject<number>;
}) {
  const disk = useDiskAttributes(DISK_COUNT, 1.5, 4.1, 0.03);
  return (
    <DiskPoints
      attrs={disk}
      size={0.9}
      speedMul={1.3}
      clump={0.5}
      reduced={reduced}
      pointerWorld={pointerWorld}
      hover={hover}
    />
  );
}

/* --------------------------- photon ring -------------------------------- */
/*  A near-circular glow just outside the shadow (light bent around the hole).  */
/*  Bright segments sweep around it so it reads as matter circulating, not a    */
/*  static line — and it always sits outside the shadow, never inside it.       */

const photonFrag = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uHover;
  uniform float uReduced;

  void main() {
    float t = uReduced > 0.5 ? 0.0 : uTime;
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float ang = atan(p.y, p.x);

    float R = 0.63 + uHover * 0.05;
    float W = 0.036 + uHover * 0.012;
    float ring = smoothstep(W, 0.0, abs(r - R));

    // circulating brightness + fine sparkle travelling around the ring
    float flow = 0.5 + 0.5 * sin(ang * 6.0 - t * 2.2) * sin(ang * 2.0 + t * 1.1);
    float spark = pow(max(0.0, sin(ang * 34.0 - t * 7.0)), 10.0) * 0.6;
    float a = ring * (0.35 + flow + spark);

    vec3 warm = vec3(1.0, 0.66, 0.32);
    vec3 hot = vec3(1.0, 0.96, 0.9);
    vec3 col = mix(warm, hot, flow);

    gl_FragColor = vec4(col, a * 0.85);
  }
`;

const photonVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function PhotonRing({
  reduced,
  hover,
}: {
  reduced: boolean;
  hover: React.MutableRefObject<number>;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHover: { value: 0 },
      uReduced: { value: reduced ? 1 : 0 },
    }),
    [reduced],
  );

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.quaternion.copy(camera.quaternion);
    if (!mat.current) return;
    mat.current.uniforms.uTime.value += Math.min(delta, 0.05);
    mat.current.uniforms.uHover.value = hover.current;
  });

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[4, 4]} />
      <shaderMaterial
        ref={mat}
        vertexShader={photonVert}
        fragmentShader={photonFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ------------------------------- dust ----------------------------------- */

const dustVert = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uReduced;
  attribute float aScale;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    float t = uReduced > 0.5 ? 0.0 : uTime;
    vec3 pos = position;
    pos.x += sin(t * 0.13 + aSeed * 6.28) * 0.3;
    pos.y += cos(t * 0.11 + aSeed * 4.0) * 0.15;
    pos.z += sin(t * 0.09 + aSeed * 3.0) * 0.3;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * uPixelRatio * (13.0 / -mv.z);
    vAlpha = 0.45 + 0.55 * sin(t * 0.5 + aSeed * 10.0);
  }
`;

const dustFrag = /* glsl */ `
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (length(c) > 0.5) discard;
    float a = smoothstep(0.5, 0.0, length(c)) * vAlpha * 0.14;
    gl_FragColor = vec4(0.86, 0.74, 0.6, a);
  }
`;

function Dust({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);

  const { positions, aScale, aSeed } = useMemo(() => {
    const positions = new Float32Array(DUST_COUNT * 3);
    const aScale = new Float32Array(DUST_COUNT);
    const aSeed = new Float32Array(DUST_COUNT);
    for (let i = 0; i < DUST_COUNT; i++) {
      const r = 3.2 + Math.pow(Math.random(), 0.7) * 13;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r + (Math.random() - 0.5) * 3.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * r * 0.36;
      positions[i * 3 + 2] = Math.sin(a) * r + (Math.random() - 0.5) * 3.5;
      aScale[i] = 0.5 + Math.random() * 2.3;
      aSeed[i] = Math.random();
    }
    return { positions, aScale, aSeed };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: {
        value:
          typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1,
      },
      uReduced: { value: reduced ? 1 : 0 },
    }),
    [reduced],
  );

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    if (mat.current) mat.current.uniforms.uTime.value += d;
    if (ref.current && !reduced) ref.current.rotation.y += d * 0.01;
  });

  return (
    <points ref={ref} rotation={[DISK_TILT, 0, 0.1]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[aScale, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[aSeed, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={dustVert}
        fragmentShader={dustFrag}
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
    // slow drift
    if (ref.current) ref.current.rotation.y += Math.min(delta, 0.05) * 0.0018;
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
        ["uStrength", new THREE.Uniform(0.055)],
        ["uRadius", new THREE.Uniform(0.12)],
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
    u.get("uStrength")!.value = 0.055 + s.hover * 0.3;
    u.get("uSwirl")!.value = 0.05 + s.hover * 0.24;
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

  useFrame(() => {
    const s = shared.current;

    // project the cursor onto the disk plane (y = GROUP_Y)
    tmp.current.set(s.ndc.x, s.ndc.y, 0.5).unproject(camera);
    tmp.current.sub(camera.position).normalize();
    const tHit = (GROUP_Y - camera.position.y) / tmp.current.y;
    pointerWorld.current
      .copy(camera.position)
      .addScaledVector(tmp.current, tHit);

    // where is the hole (group origin) on screen?
    const centerNdc = tmp.current.set(0, GROUP_Y, 0).project(camera);
    const cx = centerNdc.x * 0.5 + 0.5;
    const cy = centerNdc.y * 0.5 + 0.5;

    const pux = s.ndc.x * 0.5 + 0.5;
    const puy = s.ndc.y * 0.5 + 0.5;

    // hover ramps up as the cursor nears the hole (screen space, aspect aware)
    const aspect = size.width / size.height;
    const dx = (pux - cx) * aspect;
    const dy = puy - cy;
    const near = 1 - Math.min(1, Math.hypot(dx, dy) / 0.9);
    const target = reduced || s.active < 0.5 ? 0 : near * near;
    hover.current += (target - hover.current) * 0.06;

    s.center.set(cx, cy);
    s.pointer.set(pux, puy);
    s.aspect = aspect;
    s.hover = hover.current;
  });

  return (
    <>
      <Starfield />
      <Dust reduced={reduced} />
      <group position={[0, GROUP_Y, 0]}>
        <AccretionDisk
          reduced={reduced}
          pointerWorld={pointerWorld}
          hover={hover}
        />

        {/* event horizon — opaque, occludes whatever is behind it */}
        <mesh>
          <sphereGeometry args={[1.15, 64, 64]} />
          <meshBasicMaterial color="#000000" />
        </mesh>

        <PhotonRing reduced={reduced} hover={hover} />
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
    ndc: new THREE.Vector2(0, -2),
    hover: 0,
    active: 0,
    aspect: 1,
  });
  const elRef = useRef<HTMLCanvasElement | null>(null);

  // Track the pointer across the whole hero (including over the headline),
  // not just when it is directly over the canvas.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = elRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      shared.current.ndc.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -(((e.clientY - r.top) / r.height) * 2 - 1),
      );
      shared.current.active =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom
          ? 1
          : 0;
    };
    const onLeave = () => {
      shared.current.active = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 7.5], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
      onCreated={({ gl }) => {
        elRef.current = gl.domElement;
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => e.preventDefault(),
          false,
        );
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

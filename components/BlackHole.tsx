"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, wrapEffect } from "@react-three/postprocessing";
import { Effect } from "postprocessing";
import * as THREE from "three";

/* ========================================================================== */
/*  Interactive black hole.                                                     */
/*  - A raymarched shader plane bends light around the hole: an accretion disk   */
/*    whose far side arcs up and over the shadow, a photon ring, and the         */
/*    event-horizon silhouette.                                                  */
/*  - Particle dust + a starfield sit behind it and get lensed by a post pass.   */
/*  - The cursor drives it from anywhere over the hero, deepening the warp.      */
/* ========================================================================== */

const DUST_COUNT = 5600;
const STAR_COUNT = 1600;
const GROUP_Y = 1.5;
const DISK_TILT = -1.05;

type Shared = {
  center: THREE.Vector2;
  pointer: THREE.Vector2;
  ndc: THREE.Vector2;
  hover: number;
  active: number;
  aspect: number;
};

/* ------------------------- raymarched black hole -------------------------- */

const bhVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const bhFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uHover;
  uniform vec2  uPointerDir; // hole -> cursor, screen space (-1..1)
  uniform float uReduced;

  const int STEPS = 80;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p){
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++){ s += a * noise(p); p *= 2.03; a *= 0.5; }
    return s;
  }

  vec3 diskColor(float r, float ang, float t){
    float inner = 1.15, outer = 6.1;
    if (r < inner || r > outer) return vec3(0.0);
    float tn = (r - inner) / (outer - inner);

    float turb = fbm(vec2(ang * 2.2 + r * 0.5 - t * 0.4, r * 1.7 + t * 0.05));
    float bands = 0.35 + 0.9 * turb;

    vec3 hot  = vec3(1.0, 0.96, 0.88);
    vec3 mid  = vec3(1.0, 0.55, 0.22);
    vec3 cool = vec3(0.5, 0.14, 0.05);
    vec3 c = mix(hot, mid, smoothstep(0.0, 0.32, tn));
    c = mix(c, cool, smoothstep(0.4, 1.0, tn));

    float bright = pow(1.0 - tn, 1.35) * bands;
    bright *= 0.6 + 0.7 * smoothstep(-1.0, 1.0, sin(ang));  // doppler
    bright *= smoothstep(inner, inner + 0.3, r);            // soft inner edge
    bright *= smoothstep(outer, outer - 2.4, r);            // soft outer edge
    return c * bright * 1.45;
  }

  void main(){
    float t = uReduced > 0.5 ? 0.0 : uTime;

    // camera looking at the hole from slightly above
    vec3 camPos = vec3(0.0, 2.35, 10.0);
    vec3 fwd = normalize(-camPos);
    vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, fwd);

    vec2 sc = (vUv - 0.5) * 2.15;
    // a touch of cursor-follow: skew the view under the pointer
    sc += uPointerDir * 0.05 * uHover;
    vec3 rd = normalize(fwd + right * sc.x + up * sc.y);
    vec3 p = camPos;

    float warp = 1.12 + 0.03 * sin(t * 0.4) + uHover * 1.45;

    vec3 col = vec3(0.0);
    float alpha = 0.0;

    for (int i = 0; i < STEPS; i++){
      float r = length(p);
      float dl = 0.12 + r * 0.045;

      // gravitational bending of the light ray
      vec3 g = -p / (r * r * r);
      rd = normalize(rd + g * warp * dl);
      vec3 pn = p + rd * dl;

      if (r < 0.62){ alpha = 1.0; col *= 0.0; break; } // captured -> shadow

      // crossed the disk plane
      if (p.y * pn.y < 0.0 && alpha < 1.0){
        float k = p.y / (p.y - pn.y);
        vec3 h = mix(p, pn, k);
        float dr = length(h.xz);
        float ang = atan(h.z, h.x) + t * 0.16;
        vec3 e = diskColor(dr, ang, t);
        col += e * (1.0 - alpha);
        alpha = clamp(alpha + dot(e, vec3(0.34)), 0.0, 1.0);
      }

      p = pn;
      if (r > 26.0) break;
    }

    float edge = smoothstep(0.5, 0.30, length(vUv - 0.5));
    float outA = max(alpha, clamp(dot(col, vec3(0.4)), 0.0, 1.0)) * edge;
    gl_FragColor = vec4(col * edge, outA);
  }
`;

function BlackHoleCore({
  reduced,
  shared,
}: {
  reduced: boolean;
  shared: React.MutableRefObject<Shared>;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHover: { value: 0 },
      uPointerDir: { value: new THREE.Vector2() },
      uReduced: { value: reduced ? 1 : 0 },
    }),
    [reduced],
  );

  useFrame((_, delta) => {
    if (mesh.current) mesh.current.quaternion.copy(camera.quaternion);
    if (!mat.current) return;
    const u = mat.current.uniforms;
    u.uTime.value += Math.min(delta, 0.05);
    u.uHover.value = shared.current.hover;
    const s = shared.current;
    u.uPointerDir.value.set(
      (s.pointer.x - s.center.x) * s.aspect,
      s.pointer.y - s.center.y,
    );
  });

  return (
    <mesh ref={mesh} position={[0, GROUP_Y, 0]}>
      <planeGeometry args={[8.2, 8.2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={bhVert}
        fragmentShader={bhFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
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
    float a = smoothstep(0.5, 0.0, length(c)) * vAlpha * 0.17;
    gl_FragColor = vec4(0.86, 0.74, 0.61, a);
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
      const r = 4.0 + Math.pow(Math.random(), 0.7) * 15;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r + (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * r * 0.34;
      positions[i * 3 + 2] = Math.sin(a) * r + (Math.random() - 0.5) * 4;
      aScale[i] = 0.5 + Math.random() * 2.4;
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
    if (ref.current && !reduced) ref.current.rotation.y += d * 0.008;
  });

  return (
    <points ref={ref} rotation={[DISK_TILT, 0, 0.08]}>
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
        .multiplyScalar(20 + Math.random() * 26);
      p.set([v.x, v.y, v.z], i * 3);
    }
    return p;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += Math.min(delta, 0.05) * 0.0015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.036}
        sizeAttenuation
        color="#a7b2c6"
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </points>
  );
}

/* ---------------------------- lensing effect ------------------------------ */

const lensFrag = /* glsl */ `
  uniform vec2 uCenter;
  uniform float uAspect;
  uniform float uStrength;
  uniform float uRadius;
  uniform float uSwirl;

  void mainUv(inout vec2 uv) {
    vec2 d = uv - uCenter;
    d.x *= uAspect;
    float dist = length(d);

    float pull = uStrength * (uRadius * uRadius) / (dist * dist + 0.0012);
    pull = min(pull, 0.9);

    float ang = uSwirl * uStrength / (dist + 0.06);
    float s = sin(ang), c = cos(ang);
    d = mat2(c, -s, s, c) * d;

    vec2 dir = d / max(dist, 1e-4);
    d -= dir * pull * dist;
    d.x /= uAspect;
    uv = uCenter + d;
  }
`;

class LensEffectImpl extends Effect {
  constructor() {
    super("BlackHoleLens", lensFrag, {
      uniforms: new Map<string, THREE.Uniform>([
        ["uCenter", new THREE.Uniform(new THREE.Vector2(0.5, 0.5))],
        ["uAspect", new THREE.Uniform(1)],
        ["uStrength", new THREE.Uniform(0.05)],
        ["uRadius", new THREE.Uniform(0.16)],
        ["uSwirl", new THREE.Uniform(0.04)],
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
    u.get("uAspect")!.value = s.aspect;
    u.get("uStrength")!.value = 0.05 + s.hover * 0.22;
    u.get("uSwirl")!.value = 0.04 + s.hover * 0.16;
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
  const hover = useRef(0);
  const tmp = useRef(new THREE.Vector3());

  useFrame(() => {
    const s = shared.current;

    const centerNdc = tmp.current.set(0, GROUP_Y, 0).project(camera);
    const cx = centerNdc.x * 0.5 + 0.5;
    const cy = centerNdc.y * 0.5 + 0.5;
    const pux = s.ndc.x * 0.5 + 0.5;
    const puy = s.ndc.y * 0.5 + 0.5;

    const aspect = size.width / size.height;
    const dx = (pux - cx) * aspect;
    const dy = puy - cy;
    const near = 1 - Math.min(1, Math.hypot(dx, dy) / 0.95);
    const target =
      reduced || s.active < 0.5 ? 0 : Math.max(0.12, near * near);
    hover.current += (target - hover.current) * 0.05;

    s.center.set(cx, cy);
    s.pointer.set(pux, puy);
    s.aspect = aspect;
    s.hover = hover.current;
  });

  return (
    <>
      <Starfield />
      <Dust reduced={reduced} />
      <BlackHoleCore reduced={reduced} shared={shared} />
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
      dpr={[1, 1.6]}
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
          luminanceThreshold={0.5}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.6}
        />
      </EffectComposer>
    </Canvas>
  );
}

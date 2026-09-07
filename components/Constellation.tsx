"use client";

import { useEffect, useState } from "react";
import { draco } from "@/lib/constellations";

const SECTION_IDS = [
  "about",
  "stack",
  "experience",
  "projects",
  "education",
  "contact",
];

const C = draco;

/**
 * The constellation sits behind the page as a fixed scene. Scrolling pans a
 * camera along the figure head -> tail, with the six sections evenly dividing
 * the traversal, so each section brings a new stretch of the dragon into view.
 */
export default function Constellation() {
  const [cam, setCam] = useState({ tx: 0, ty: 0, scale: 1.4 });
  const [opacity, setOpacity] = useState(0);
  const [twinkle, setTwinkle] = useState(true);

  useEffect(() => {
    setTwinkle(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    let raf = 0;

    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(Math.max(Math.max(vw, vh) / 1150, 1.05), 2.1);

      const els = SECTION_IDS.map((id) => document.getElementById(id));
      if (els.some((el) => !el)) return;
      const sections = els as HTMLElement[];

      const scrollY = window.scrollY;
      const focus = scrollY + vh * 0.5;
      const tops = sections.map((s) => s.offsetTop);
      const bottoms = sections.map((s) => s.offsetTop + s.offsetHeight);

      // how far through the six sections the viewport centre sits (0 .. 6)
      let progress: number;
      if (focus <= tops[0]) progress = 0;
      else if (focus >= bottoms[5]) progress = 6;
      else {
        progress = 6;
        for (let i = 0; i < 6; i++) {
          if (focus < bottoms[i]) {
            progress = i + (focus - tops[i]) / (bottoms[i] - tops[i]);
            break;
          }
        }
      }
      const t = Math.max(0, Math.min(1, progress / 6));

      // camera walks the star path, evenly divided across the sections
      const seg = t * (C.path.length - 1);
      const i0 = Math.min(Math.floor(seg), C.path.length - 2);
      const f = seg - i0;
      const a = C.stars[C.path[i0]];
      const b = C.stars[C.path[i0 + 1]];
      const camX = a.x + (b.x - a.x) * f;
      const camY = a.y + (b.y - a.y) * f;

      setCam({
        tx: vw / 2 - camX * scale,
        ty: vh / 2 - camY * scale,
        scale,
      });

      // fade in once the hero is behind us
      const heroH =
        document.querySelector("header")?.offsetHeight ?? vh;
      // capped below 1 so the figure stays a backdrop, never fights the copy
      setOpacity(
        Math.max(0, Math.min(1, (scrollY - heroH * 0.4) / (heroH * 0.45))) *
          0.52,
      );
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.fonts?.ready.then(update).catch(() => {});
    const t1 = window.setTimeout(update, 400);
    const t2 = window.setTimeout(update, 1400);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const at = (sx: number, sy: number) =>
    [cam.tx + sx * cam.scale, cam.ty + sy * cam.scale] as const;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden md:block"
      style={{ opacity, transition: "opacity 500ms ease" }}
    >
      <svg className="h-full w-full" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="cst-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(190,206,255,0.5)" />
            <stop offset="40%" stopColor="rgba(150,172,240,0.15)" />
            <stop offset="100%" stopColor="rgba(150,172,240,0)" />
          </radialGradient>
        </defs>

        {C.lines.map(([ai, bi], i) => {
          const [x1, y1] = at(C.stars[ai].x, C.stars[ai].y);
          const [x2, y2] = at(C.stars[bi].x, C.stars[bi].y);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--constellation-line)"
              strokeWidth={1.3}
              strokeLinecap="round"
            />
          );
        })}

        {C.stars.map((s, i) => {
          const [x, y] = at(s.x, s.y);
          return (
            <StarGlint key={i} x={x} y={y} mag={s.mag} idx={i} twinkle={twinkle} />
          );
        })}
      </svg>
    </div>
  );
}

function StarGlint({
  x,
  y,
  mag,
  idx,
  twinkle,
}: {
  x: number;
  y: number;
  mag: number;
  idx: number;
  twinkle: boolean;
}) {
  const L = 8 + mag * 13; // spike length
  const w = L * 0.15; // waist
  const d = `M0,${-L} L${w},${-w} L${L},0 L${w},${w} L0,${L} L${-w},${w} L${-L},0 L${-w},${-w} Z`;

  return (
    <g
      transform={`translate(${x} ${y})`}
      className={twinkle ? "cst-star" : undefined}
      style={twinkle ? { animationDelay: `${-((idx * 0.83) % 5)}s` } : undefined}
    >
      <circle r={L * 2.2} fill="url(#cst-halo)" />
      <path d={d} fill="var(--constellation-star)" />
      <path
        d={d}
        fill="rgba(255,255,255,0.85)"
        transform="rotate(45) scale(0.4)"
      />
      <circle r={1 + mag * 1.4} fill="#ffffff" />
    </g>
  );
}

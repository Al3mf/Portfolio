"use client";

import { useEffect, useRef, useState } from "react";
import { draco } from "@/lib/constellations";

type Pt = { id: string; x: number; y: number; bright?: boolean };

const constellation = draco;

export default function Constellation() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pts, setPts] = useState<Pt[]>([]);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [drawn, setDrawn] = useState(false);
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceRef.current) setDrawn(true);

    let raf = 0;

    const measure = () => {
      const main = svgRef.current?.parentElement as HTMLElement | null;
      if (!main) return;

      if (window.innerWidth < 1024) {
        setPts([]);
        return;
      }

      // layout position relative to <main>, ignoring the sections' reveal transform
      const posOf = (el: HTMLElement) => {
        let x = 0;
        let y = 0;
        let node: HTMLElement | null = el;
        while (node && node !== main) {
          x += node.offsetLeft;
          y += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        return { x, y, h: el.offsetHeight };
      };

      const anchors: Record<string, { x: number; y: number }> = {};
      for (const s of constellation.stars) {
        if (!s.anchor) continue;
        const el = document.querySelector<HTMLElement>(
          `[data-constellation="${s.anchor}"]`,
        );
        if (!el) continue;
        const p = posOf(el);
        anchors[s.anchor] = { x: p.x, y: p.y + p.h / 2 };
      }

      const first = constellation.stars.find((s) => s.anchor && anchors[s.anchor]);
      if (!first) {
        setPts([]);
        return;
      }
      const base = anchors[first.anchor as string];

      const next: Pt[] = [];
      for (const s of constellation.stars) {
        if (s.anchor) {
          const a = anchors[s.anchor];
          if (a) next.push({ id: s.id, x: a.x - s.offset, y: a.y, bright: s.bright });
        } else {
          next.push({
            id: s.id,
            x: base.x - s.offset,
            y: base.y + (s.dy ?? 0),
            bright: s.bright,
          });
        }
      }

      setPts(next);
      setDims({ w: main.offsetWidth, h: main.scrollHeight });
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    const main = svgRef.current?.parentElement;
    if (main) ro.observe(main);
    window.addEventListener("resize", schedule);
    document.fonts?.ready.then(schedule).catch(() => {});
    const t1 = window.setTimeout(schedule, 400);
    const t2 = window.setTimeout(schedule, 1200);
    const t3 = window.setTimeout(() => {
      if (!reduceRef.current) setDrawn(true);
    }, 250);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  const byId: Record<string, Pt> = {};
  for (const p of pts) byId[p.id] = p;

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 -z-10 hidden lg:block"
      width={dims.w || 1}
      height={dims.h || 1}
      style={{ overflow: "visible" }}
    >
      <defs>
        <filter id="cst-glow" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {pts.length >= 2 ? (
        <g style={{ opacity: drawn ? 1 : 0, transition: "opacity 500ms ease-out" }}>
          {constellation.lines.map(([a, b], i) => {
            const pa = byId[a];
            const pb = byId[b];
            if (!pa || !pb) return null;
            const len = Math.hypot(pb.x - pa.x, pb.y - pa.y);
            return (
              <line
                key={`${a}-${b}`}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke="var(--constellation-line)"
                strokeWidth={1}
                strokeLinecap="round"
                style={{
                  strokeDasharray: len,
                  strokeDashoffset: drawn ? 0 : len,
                  transition: reduceRef.current
                    ? "none"
                    : `stroke-dashoffset 850ms ${150 + i * 85}ms ease-out`,
                }}
              />
            );
          })}
          {pts.map((p) => (
            <circle
              key={p.id}
              className="cst-star"
              cx={p.x}
              cy={p.y}
              r={p.bright ? 3 : 2}
              fill="var(--constellation-star)"
              filter="url(#cst-glow)"
            />
          ))}
        </g>
      ) : null}
    </svg>
  );
}

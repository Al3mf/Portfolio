"use client";

import { useEffect, useRef, useState } from "react";
import { draco, isAnchor } from "@/lib/constellations";

type Star = { x: number; y: number; mag: number; anchor: boolean; at: number };

/** px between a star and the heading it belongs to */
const GAP = 46;
/** how far a mid star may bulge into the gutter */
const MAX_BULGE = 130;

type Geom = {
  stars: Star[];
  head: Star[];
  path: string;
  headPath: string;
  total: number;
  cum: number[];
  pts: { x: number; y: number }[];
  y0: number;
  y1: number;
  mainTop: number;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a || 1e-6));
  return t * t * (3 - 2 * t);
};

export default function Constellation() {
  const [geom, setGeom] = useState<Geom | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const geomRef = useRef<Geom | null>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const cometRef = useRef<SVGGElement>(null);
  const starRefs = useRef<(SVGGElement | null)[]>([]);
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let rafMeasure = 0;
    let rafScroll = 0;

    const measure = () => {
      const main = document.querySelector("main");
      if (!main) return;
      const mainRect = main.getBoundingClientRect();
      const mainTop = mainRect.top + window.scrollY;

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

      // every anchor's star: exactly GAP to the left of its heading
      const anchorPt: Record<string, { x: number; y: number }> = {};
      for (const n of draco.spine) {
        if (!isAnchor(n)) continue;
        const el = document
          .getElementById(n.section)
          ?.querySelector("h2") as HTMLElement | null;
        if (!el) continue;
        const p = posOf(el);
        const left = el.getBoundingClientRect().left - mainRect.left;
        anchorPt[n.section] = { x: left - GAP, y: p.y + p.h / 2 };
      }

      const anchors = draco.spine.filter(isAnchor).filter((n) => anchorPt[n.section]);
      if (anchors.length < 2) {
        setGeom(null);
        geomRef.current = null;
        return;
      }

      // if the gutter is too tight (small screens) don't draw at all
      const leftMost = Math.min(...anchors.map((n) => anchorPt[n.section].x));
      if (leftMost < 40) {
        setGeom(null);
        geomRef.current = null;
        return;
      }
      const bulgeMax = Math.min(MAX_BULGE, Math.max(0, leftMost - 24));

      // walk the spine: anchors are fixed, mids interpolate then bulge left
      const stars: Star[] = [];
      const idxOfAnchors: number[] = [];
      draco.spine.forEach((n, i) => {
        if (isAnchor(n)) idxOfAnchors.push(i);
      });

      for (let a = 0; a < idxOfAnchors.length; a++) {
        const nA = draco.spine[idxOfAnchors[a]] as { section: string; mag?: number };
        const pA = anchorPt[nA.section];
        stars.push({ x: pA.x, y: pA.y, mag: nA.mag ?? 0.9, anchor: true, at: 0 });

        if (a === idxOfAnchors.length - 1) break;
        const nB = draco.spine[idxOfAnchors[a + 1]] as { section: string; mag?: number };
        const pB = anchorPt[nB.section];
        const mids = draco.spine.slice(idxOfAnchors[a] + 1, idxOfAnchors[a + 1]);
        mids.forEach((m, k) => {
          const f = (k + 1) / (mids.length + 1);
          const baseX = pA.x + (pB.x - pA.x) * f;
          const baseY = pA.y + (pB.y - pA.y) * f;
          const bulge = "bulge" in m ? m.bulge : 0.4;
          stars.push({
            x: baseX - bulge * bulgeMax,
            y: baseY,
            mag: m.mag ?? 0.3,
            anchor: false,
            at: 0,
          });
        });
      }

      // cumulative length along the spine -> when each star lights up
      const pts = stars.map((s) => ({ x: s.x, y: s.y }));
      const cum: number[] = [0];
      for (let i = 1; i < pts.length; i++) {
        cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      }
      const total = cum[cum.length - 1] || 1;
      stars.forEach((s, i) => (s.at = cum[i] / total));

      const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

      // head quad, out in the gutter beside the first anchor
      const first = stars[0];
      const head: Star[] = draco.head.map((h) => ({
        x: first.x - h.dx,
        y: first.y + h.dy,
        mag: h.mag ?? 0.6,
        anchor: false,
        at: 0,
      }));
      const headPath =
        head.length === 3
          ? `M${first.x},${first.y} L${head[0].x},${head[0].y} L${head[1].x},${head[1].y} L${head[2].x},${head[2].y} Z`
          : "";

      const g: Geom = {
        stars,
        head,
        path,
        headPath,
        total,
        cum,
        pts,
        y0: stars[0].y,
        y1: stars[stars.length - 1].y,
        mainTop,
      };
      setGeom(g);
      geomRef.current = g;
      setSize({ w: main.offsetWidth, h: main.scrollHeight });
      applyProgress();
    };

    const pointAt = (g: Geom, len: number) => {
      for (let i = 1; i < g.cum.length; i++) {
        if (g.cum[i] >= len) {
          const seg = g.cum[i] - g.cum[i - 1] || 1;
          const f = (len - g.cum[i - 1]) / seg;
          return {
            x: g.pts[i - 1].x + (g.pts[i].x - g.pts[i - 1].x) * f,
            y: g.pts[i - 1].y + (g.pts[i].y - g.pts[i - 1].y) * f,
          };
        }
      }
      return g.pts[g.pts.length - 1];
    };

    const applyProgress = () => {
      const g = geomRef.current;
      if (!g) return;
      const focus = window.scrollY + window.innerHeight * 0.52 - g.mainTop;
      const p = clamp01((focus - g.y0) / (g.y1 - g.y0 || 1));

      if (trailRef.current) {
        trailRef.current.style.strokeDashoffset = String(g.total * (1 - p));
      }
      if (cometRef.current) {
        const at = pointAt(g, p * g.total);
        cometRef.current.setAttribute("transform", `translate(${at.x} ${at.y})`);
        cometRef.current.style.opacity = p > 0.002 && p < 0.998 ? "1" : "0";
      }
      g.stars.forEach((s, i) => {
        const el = starRefs.current[i];
        if (!el) return;
        const lit = smoothstep(s.at - 0.05, s.at + 0.015, p);
        const scale = 0.72 + 0.38 * lit;
        el.setAttribute("transform", `translate(${s.x} ${s.y}) scale(${scale.toFixed(3)})`);
        el.style.opacity = String(0.2 + 0.8 * lit);
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafScroll);
      rafScroll = requestAnimationFrame(applyProgress);
    };
    const schedule = () => {
      cancelAnimationFrame(rafMeasure);
      rafMeasure = requestAnimationFrame(measure);
    };

    schedule();
    const main = document.querySelector("main");
    const ro = new ResizeObserver(schedule);
    if (main) ro.observe(main);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.fonts?.ready.then(schedule).catch(() => {});
    const t1 = window.setTimeout(schedule, 400);
    const t2 = window.setTimeout(schedule, 1400);

    return () => {
      cancelAnimationFrame(rafMeasure);
      cancelAnimationFrame(rafScroll);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 -z-10 hidden lg:block"
      width={size.w || 1}
      height={size.h || 1}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="cst-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(206,222,255,0.55)" />
          <stop offset="45%" stopColor="rgba(150,178,240,0.14)" />
          <stop offset="100%" stopColor="rgba(150,178,240,0)" />
        </radialGradient>
        <radialGradient id="cst-comet" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="30%" stopColor="rgba(178,205,255,0.5)" />
          <stop offset="100%" stopColor="rgba(178,205,255,0)" />
        </radialGradient>
      </defs>

      {geom ? (
        <g>
          {/* the figure, dim ahead of you */}
          <path
            d={geom.headPath}
            fill="none"
            stroke="var(--constellation-line)"
            strokeWidth={1}
            strokeLinejoin="round"
            opacity={0.55}
          />
          <path
            d={geom.path}
            fill="none"
            stroke="var(--constellation-line)"
            strokeWidth={1}
            strokeLinecap="round"
            opacity={0.4}
          />
          {/* the stretch you've already travelled */}
          <path
            ref={trailRef}
            d={geom.path}
            fill="none"
            stroke="var(--constellation-trail)"
            strokeWidth={1.5}
            strokeLinecap="round"
            style={{
              strokeDasharray: geom.total,
              strokeDashoffset: geom.total,
              filter: "drop-shadow(0 0 3px rgba(150,185,255,0.55))",
            }}
          />

          {geom.head.map((s, i) => (
            <Star key={`h${i}`} mag={s.mag} transform={`translate(${s.x} ${s.y})`} opacity={0.55} />
          ))}

          {geom.stars.map((s, i) => (
            <g
              key={i}
              ref={(el) => {
                starRefs.current[i] = el;
              }}
              transform={`translate(${s.x} ${s.y})`}
              style={{ opacity: 0.2, transition: "none" }}
            >
              <StarShape mag={s.mag} anchor={s.anchor} />
            </g>
          ))}

          {/* the light you're riding along the figure */}
          <g ref={cometRef} style={{ opacity: 0 }}>
            <circle r={16} fill="url(#cst-comet)" />
            <circle r={2.2} fill="#ffffff" />
          </g>
        </g>
      ) : null}
    </svg>
  );
}

function Star({
  mag,
  transform,
  opacity,
}: {
  mag: number;
  transform: string;
  opacity: number;
}) {
  return (
    <g transform={transform} style={{ opacity }}>
      <StarShape mag={mag} anchor />
    </g>
  );
}

function StarShape({ mag, anchor }: { mag: number; anchor: boolean }) {
  const core = 0.9 + mag * 1.1;
  const halo = 5 + mag * 7;
  const spike = 4 + mag * 6;
  const w = spike * 0.1;

  return (
    <>
      <circle r={halo} fill="url(#cst-halo)" />
      {anchor ? (
        <path
          d={`M0,${-spike} L${w},${-w} L${spike},0 L${w},${w} L0,${spike} L${-w},${w} L${-spike},0 L${-w},${-w} Z`}
          fill="var(--constellation-star)"
        />
      ) : null}
      <circle r={core} fill="#ffffff" />
    </>
  );
}

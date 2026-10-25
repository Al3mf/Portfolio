"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { sectionLateral } from "@/lib/constellations";

export default function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const lat = sectionLateral[id];

  // Sit beside this section's own star, then take off the camera: the result
  // is (lat - cameraLat), so the section is centred exactly when the scroll
  // reaches its star and drifts away as the camera moves on.
  const slide: CSSProperties =
    lat === undefined
      ? {}
      : {
          transform: `translateX(calc((${lat} - 0.5) * 2 * var(--cst-amp) - var(--cst-cam)))`,
        };

  return (
    <section
      id={id}
      className="scroll-mt-24 py-16 sm:py-20"
      style={slide}
    >
      <motion.div
        className="mx-auto w-full max-w-content pl-14 pr-6 lg:px-6"
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="mb-8 font-mono text-base font-semibold uppercase tracking-[0.14em] text-ink">
          {title}
        </h2>
        {children}
      </motion.div>
    </section>
  );
}

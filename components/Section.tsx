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

  // slide the section sideways so it lands beside its star on the figure
  const slide: CSSProperties =
    lat === undefined
      ? {}
      : { transform: `translateX(calc((${lat} - 0.5) * 2 * var(--cst-amp)))` };

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

"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

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

  return (
    <section
      id={id}
      className="scroll-mt-24 border-t border-base-border py-16 sm:py-20"
    >
      <motion.div
        className="mx-auto w-full max-w-content px-6"
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2
          data-constellation={id}
          className="mb-8 font-mono text-sm font-semibold uppercase tracking-[0.16em] text-ink"
        >
          {title}
        </h2>
        {children}
      </motion.div>
    </section>
  );
}

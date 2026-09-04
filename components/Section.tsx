import type { ReactNode } from "react";

export default function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-base-border py-16 sm:py-20">
      <div className="mx-auto w-full max-w-content px-6">
        <h2 className="mb-8 font-mono text-[12px] uppercase tracking-[0.18em] text-ink-faint">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

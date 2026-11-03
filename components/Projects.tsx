"use client";

import { useState, type ReactNode } from "react";
import { LuArrowUpRight, LuMaximize2 } from "react-icons/lu";
import { SiGithub } from "react-icons/si";
import Modal, { ModalLink, ModalSection } from "./Modal";
import ProjectPreview from "./ProjectPreview";
import type { Project } from "@/lib/content";

const BULLET =
  "relative pl-4 text-[14px] leading-relaxed text-ink-dim before:absolute before:left-0 before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-ink-faint";

export default function Projects({
  projects,
  pills,
}: {
  projects: Project[];
  /** each project's stack pills, rendered on the server (see StackPills) */
  pills: Record<string, ReactNode>;
}) {
  const [open, setOpen] = useState<Project | null>(null);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => setOpen(p)}
            aria-haspopup="dialog"
            className="group flex flex-col rounded-xl border border-base-border bg-base-raised p-4 text-left transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-ink-faint hover:shadow-[0_12px_40px_-12px_rgba(150,185,255,0.25)] focus-visible:-translate-y-1 focus-visible:border-ink-faint focus-visible:outline-none"
          >
            {p.preview ? <ProjectPreview preview={p.preview} variant="thumb" /> : null}

            <div className="mt-4 flex items-start justify-between gap-3">
              <h3 className="text-[15px] font-medium text-ink">{p.name}</h3>
              <LuMaximize2
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint transition-colors group-hover:text-ink"
                aria-hidden
              />
            </div>
            <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-dim">
              {p.blurb}
            </p>
            <div className="mt-4">{pills[p.name]}</div>
            <span className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint transition-colors group-hover:text-ink">
              View details
              <LuArrowUpRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </button>
        ))}
      </div>

      <Modal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.name}
        subtitle={open?.tagline}
        footer={
          open?.href ? (
            <ModalLink href={open.href} icon={<SiGithub className="h-4 w-4" aria-hidden />}>
              View source on GitHub
              <LuArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </ModalLink>
          ) : null
        }
      >
        {open ? (
          <>
            {open.preview ? <ProjectPreview preview={open.preview} variant="full" /> : null}

            <ModalSection label="What I built">
              <ul className="space-y-2.5">
                {open.highlights.map((h) => (
                  <li key={h} className={BULLET}>
                    {h}
                  </li>
                ))}
              </ul>
            </ModalSection>

            {open.notes?.length ? (
              <ModalSection label="How it works">
                <ul className="space-y-2.5">
                  {open.notes.map((n) => (
                    <li key={n} className={BULLET}>
                      {n}
                    </li>
                  ))}
                </ul>
              </ModalSection>
            ) : null}

            <ModalSection label="Stack">{pills[open.name]}</ModalSection>

            {open.team?.length ? (
              <ModalSection label="Team">
                <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
                  {open.team.map((m) => (
                    <li key={m.href}>
                      <a
                        href={m.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink-dim underline decoration-base-border underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
                      >
                        {m.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </ModalSection>
            ) : null}
          </>
        ) : null}
      </Modal>
    </>
  );
}

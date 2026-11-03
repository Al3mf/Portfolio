"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuArrowUpRight, LuMaximize2, LuX } from "react-icons/lu";
import { SiGithub } from "react-icons/si";
import Pill from "./Pill";
import ProjectPreview from "./ProjectPreview";
import { techIcon } from "@/lib/tech-icons";
import type { Project } from "@/lib/content";

/** keep in sync with the `cst-modal-out` keyframes in globals.css */
const CLOSE_MS = 180;

export default function Projects({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState<Project | null>(null);
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  // show the dialog once React has rendered the chosen project into it
  useEffect(() => {
    const d = dialogRef.current;
    if (!open || !d || d.open) return;
    d.showModal();
    // one <dialog> serves every project, so it would otherwise reopen at
    // wherever the previous project was scrolled to. Has to come after
    // showModal: while closed the dialog is display:none and ignores scrollTop.
    d.scrollTop = 0;
  }, [open]);

  const close = useCallback(() => {
    if (!dialogRef.current?.open || closing) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      dialogRef.current?.close();
      setClosing(false);
      setOpen(null);
      // hand focus back to the card that opened it
      openerRef.current?.focus({ preventScroll: true });
    };
    if (reduce) return finish();
    setClosing(true);
    window.setTimeout(finish, CLOSE_MS);
  }, [closing]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={(e) => {
              openerRef.current = e.currentTarget;
              setOpen(p);
            }}
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
            <div className="mt-4 flex flex-wrap gap-2">
              {p.stack.map((s) => (
                <Pill key={s} icon={techIcon(s)}>
                  {s}
                </Pill>
              ))}
            </div>
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

      <dialog
        ref={dialogRef}
        // Lenis drives the page's wheel scrolling; without this it would keep
        // scrolling the page behind the modal instead of the modal itself.
        data-lenis-prevent
        aria-labelledby="project-modal-title"
        onCancel={(e) => {
          // Esc: run the closing animation instead of vanishing
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          // a click that lands on the dialog element itself is on the backdrop
          if (e.target === e.currentTarget) close();
        }}
        data-closing={closing || undefined}
        className="cst-modal m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto overscroll-contain bg-transparent p-0 text-ink backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:m-auto sm:h-auto sm:max-h-[88vh] sm:w-[min(48rem,calc(100vw-3rem))] sm:rounded-2xl"
      >
        {open ? (
          <article className="cst-modal-panel min-h-full border-base-border bg-base-raised sm:min-h-0 sm:rounded-2xl sm:border">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-base-border bg-base-raised/90 px-5 py-4 backdrop-blur sm:px-6">
              <div>
                <h2 id="project-modal-title" className="text-lg font-semibold text-ink">
                  {open.name}
                </h2>
                <p className="mt-1 text-[13px] text-ink-dim">{open.tagline}</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close project details"
                className="-mr-1.5 rounded-full p-1.5 text-ink-faint transition-colors hover:bg-base hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink-faint"
              >
                <LuX className="h-5 w-5" aria-hidden />
              </button>
            </header>

            <div className="space-y-7 px-5 py-6 sm:px-6">
              {open.preview ? (
                <ProjectPreview preview={open.preview} variant="full" />
              ) : null}

              <section>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                  What I built
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {open.highlights.map((h) => (
                    <li
                      key={h}
                      className="relative pl-4 text-[14px] leading-relaxed text-ink-dim before:absolute before:left-0 before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-ink-faint"
                    >
                      {h}
                    </li>
                  ))}
                </ul>
              </section>

              {open.notes?.length ? (
                <section>
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                    How it works
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {open.notes.map((n) => (
                      <li
                        key={n}
                        className="relative pl-4 text-[14px] leading-relaxed text-ink-dim before:absolute before:left-0 before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-ink-faint"
                      >
                        {n}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                  Stack
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {open.stack.map((s) => (
                    <Pill key={s} icon={techIcon(s)}>
                      {s}
                    </Pill>
                  ))}
                </div>
              </section>

              {open.team?.length ? (
                <section>
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                    Team
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
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
                </section>
              ) : null}
            </div>

            {open.href ? (
              <footer className="border-t border-base-border px-5 py-4 sm:px-6">
                <a
                  href={open.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-base-border bg-base px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/40"
                >
                  <SiGithub className="h-4 w-4" aria-hidden />
                  View source on GitHub
                  <LuArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              </footer>
            ) : null}
          </article>
        ) : null}
      </dialog>
    </>
  );
}

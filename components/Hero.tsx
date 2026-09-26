"use client";

import dynamic from "next/dynamic";
import { profile } from "@/lib/content";
import CanvasErrorBoundary from "./CanvasErrorBoundary";

const BlackHole = dynamic(() => import("./BlackHole"), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden />,
});

export default function Hero() {
  return (
    <header className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-6 pb-16 pt-24">
      {/* Interactive black hole — fills the hero, sits behind the text */}
      <div className="absolute inset-0">
        <CanvasErrorBoundary>
          <BlackHole />
        </CanvasErrorBoundary>
      </div>

      {/* readability scrim */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-base via-base/85 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-content">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {profile.name}
        </h1>
        <p className="mt-2 font-mono text-[13px] uppercase tracking-[0.14em] text-ink-dim">
          {profile.tagline}
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm text-ink-faint">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/80"
            aria-hidden
          />
          Based in {profile.location}
        </p>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-dim">
          {profile.bio}
        </p>

        <a
          href={profile.cv}
          download
          className="mt-7 inline-flex items-center gap-2 rounded-full border border-base-border bg-base-raised/70 px-4 py-2 text-sm font-medium text-ink backdrop-blur transition-colors hover:border-ink/40 hover:bg-base-raised"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          Download CV
        </a>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <a
            href={`mailto:${profile.email}`}
            className="text-ink underline decoration-base-border underline-offset-4 transition-colors hover:decoration-ink"
          >
            {profile.email}
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            className="text-ink-dim transition-colors hover:text-ink"
          >
            GitHub
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer"
            className="text-ink-dim transition-colors hover:text-ink"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </header>
  );
}

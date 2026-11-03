"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  LuArrowUpRight,
  LuCalendar,
  LuChevronRight,
  LuGlobe,
  LuGraduationCap,
  LuMapPin,
  LuNavigation,
} from "react-icons/lu";
import Modal, { ModalLink, ModalSection } from "./Modal";
import type { School } from "@/lib/content";

// Leaflet and its stylesheet only load once someone opens a card
const CampusMap = dynamic(() => import("./CampusMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full animate-pulse rounded-lg border border-base-border bg-base sm:h-72" />
  ),
});

const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

export default function Education({ schools }: { schools: School[] }) {
  const [open, setOpen] = useState<School | null>(null);

  return (
    <>
      <div className="-mx-3 space-y-2">
        {schools.map((e) => (
          <button
            key={e.school}
            type="button"
            onClick={() => setOpen(e)}
            aria-haspopup="dialog"
            className="group flex w-full flex-wrap items-start justify-between gap-x-4 gap-y-2 rounded-xl border border-transparent px-3 py-3 text-left transition-[border-color,background-color] duration-300 hover:border-base-border hover:bg-base-raised focus-visible:border-ink-faint focus-visible:outline-none"
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-base-border bg-base-raised font-mono text-[9px] font-medium tracking-tight text-ink-dim transition-colors duration-300 group-hover:border-ink-faint group-hover:text-ink"
                aria-hidden
              >
                {e.short}
              </span>
              <div>
                <h3 className="text-[15px] font-medium text-ink">{e.school}</h3>
                <p className="text-[14px] text-ink-dim">{e.program}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-ink-faint">
                  <LuMapPin className="h-3 w-3" aria-hidden />
                  {e.location}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] text-ink-faint">{e.period}</span>
              <LuChevronRight
                className="h-4 w-4 text-ink-faint transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-ink"
                aria-hidden
              />
            </div>
          </button>
        ))}
      </div>

      <Modal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.school}
        subtitle={open?.program}
        footer={
          open ? (
            <>
              <ModalLink href={open.website} icon={<LuGlobe className="h-4 w-4" aria-hidden />}>
                {hostOf(open.website)}
                <LuArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </ModalLink>
              <ModalLink
                href={`https://www.google.com/maps/search/?api=1&query=${open.coords[0]},${open.coords[1]}`}
                icon={<LuNavigation className="h-4 w-4" aria-hidden />}
              >
                Open in Maps
                <LuArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </ModalLink>
            </>
          ) : null
        }
      >
        {open ? (
          <>
            <CampusMap coords={open.coords} label={open.school} />

            <dl className="grid gap-4 sm:grid-cols-3">
              <Fact icon={<LuGraduationCap className="h-4 w-4" aria-hidden />} label="Program">
                {open.program}
              </Fact>
              <Fact icon={<LuCalendar className="h-4 w-4" aria-hidden />} label="Completion">
                {open.period}
              </Fact>
              <Fact icon={<LuMapPin className="h-4 w-4" aria-hidden />} label="Location">
                {open.location}
              </Fact>
            </dl>

            <ModalSection label="Campus">
              <p className="text-[14px] leading-relaxed text-ink-dim">{open.campus}</p>
            </ModalSection>
          </>
        ) : null}
      </Modal>
    </>
  );
}

function Fact({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-base-border bg-base p-3.5">
      <dt className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
        <span className="text-ink">{icon}</span>
        {label}
      </dt>
      <dd className="mt-2 text-[14px] leading-snug text-ink">{children}</dd>
    </div>
  );
}

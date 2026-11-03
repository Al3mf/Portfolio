import Image from "next/image";
import { LuCamera, LuCpu, LuShieldCheck, LuChevronRight } from "react-icons/lu";
import type { ProjectPreview as Preview } from "@/lib/content";

const STEP_ICONS = [LuCamera, LuCpu, LuShieldCheck];

/**
 * A project's visual: a real screenshot when the project has one, otherwise a
 * diagram of how it works. Never a mock-up standing in for a screenshot.
 *
 * `thumb` is the small header on a card; `full` is the version in the modal.
 */
export default function ProjectPreview({
  preview,
  variant,
}: {
  preview: Preview;
  variant: "thumb" | "full";
}) {
  if (preview.kind === "image") {
    return (
      <div
        className={
          variant === "thumb"
            ? "relative aspect-[16/7] overflow-hidden rounded-lg border border-base-border"
            : "overflow-hidden rounded-lg border border-base-border"
        }
      >
        <Image
          src={preview.src}
          alt={preview.alt}
          width={preview.width}
          height={preview.height}
          sizes={variant === "thumb" ? "(min-width: 640px) 360px, 100vw" : "(min-width: 768px) 720px, 100vw"}
          className={
            variant === "thumb"
              ? "h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
              : "h-auto w-full"
          }
        />
      </div>
    );
  }

  // pipeline
  if (variant === "thumb") {
    return (
      <div className="flex aspect-[16/7] items-center justify-center gap-2 rounded-lg border border-base-border bg-base px-4">
        {preview.steps.map((step, i) => {
          const Icon = STEP_ICONS[i] ?? LuCpu;
          return (
            <div key={step.title} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-base-border bg-base-raised text-ink transition-colors duration-300 group-hover:border-ink-faint">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  {step.title}
                </span>
              </div>
              {i < preview.steps.length - 1 ? (
                <LuChevronRight className="mb-5 h-3.5 w-3.5 text-ink-faint" aria-hidden />
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {preview.steps.map((step, i) => {
        const Icon = STEP_ICONS[i] ?? LuCpu;
        return (
          <li
            key={step.title}
            className="relative rounded-lg border border-base-border bg-base p-4"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-base-border bg-base-raised text-ink">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-medium text-ink">{step.title}</span>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-ink-dim">
              {step.detail}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

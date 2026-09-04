import type { IconType } from "react-icons";

export default function Pill({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: IconType;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-base-border bg-base-raised px-2.5 py-1 text-[12px] text-ink-dim">
      {Icon ? (
        <Icon className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
      ) : null}
      {children}
    </span>
  );
}

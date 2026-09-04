export default function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-base-border bg-base-raised px-2.5 py-1 text-[12px] text-ink-dim">
      {children}
    </span>
  );
}

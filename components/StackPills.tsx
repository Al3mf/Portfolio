import Pill from "./Pill";
import { techIcon } from "@/lib/tech-icons";

/**
 * A row of stack pills. A server component on purpose: rendered here, the
 * whole techIcon map (dozens of icons) stays on the server instead of being
 * shipped to every visitor by the client components that display it.
 */
export default function StackPills({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => (
        <Pill key={s} icon={techIcon(s)}>
          {s}
        </Pill>
      ))}
    </div>
  );
}

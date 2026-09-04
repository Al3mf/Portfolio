"use client";

import { useEffect, useState } from "react";

const links = [
  { id: "about", label: "About" },
  { id: "stack", label: "Stack" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

export default function Nav() {
  const [active, setActive] = useState<string>("about");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    links.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
      <ul className="flex items-center gap-1 rounded-full border border-base-border bg-base-raised/80 px-2 py-1.5 text-[13px] backdrop-blur-md">
        {links.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`rounded-full px-3 py-1 transition-colors ${
                active === id
                  ? "bg-base-border text-ink"
                  : "text-ink-dim hover:text-ink"
              }`}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

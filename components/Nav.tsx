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
    <nav className="fixed left-1/2 top-3 z-50 max-w-[calc(100vw-1rem)] -translate-x-1/2 sm:top-4">
      <ul className="no-scrollbar flex items-center gap-0.5 overflow-x-auto rounded-full border border-base-border bg-base-raised/80 px-1.5 py-1.5 text-[12px] backdrop-blur-md sm:gap-1 sm:px-2 sm:text-[13px]">
        {links.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`block whitespace-nowrap rounded-full px-2.5 py-1 transition-colors sm:px-3 ${
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

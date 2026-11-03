"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { LuX } from "react-icons/lu";

/** keep in sync with the `cst-modal-out` keyframes in globals.css */
const CLOSE_MS = 180;

/**
 * Shared detail modal on a native <dialog>, which brings focus trapping, Esc,
 * an inert page and a backdrop with it.
 *
 * The parent owns `open` and keeps rendering its content until `onClose`
 * fires — that is what lets the exit animation play over real content.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [closing, setClosing] = useState(false);
  const titleId = useId();

  // No dependency list on purpose: check after every render rather than only
  // when `open` flips. Closing calls onClose() (→ null) and a quick next click
  // sets a new item; React batches the two, `open` reads true → true, and an
  // effect keyed on it would never fire — the dialog would just not appear.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    // keep the element in step with the parent in both directions
    if (!open) {
      if (d.open) d.close();
      return;
    }
    if (d.open) return;
    // whatever opened it gets focus back on close
    returnFocus.current = document.activeElement as HTMLElement | null;
    d.showModal();
    // One dialog serves every item, so it would otherwise reopen wherever the
    // last one was scrolled to. Has to follow showModal: while closed the
    // dialog is display:none and ignores scrollTop.
    d.scrollTop = 0;
  });

  // Every way the dialog can shut — our own close, or the browser closing it
  // itself — ends in the native `close` event, so that is the single place the
  // parent hears about it. (Chrome honours a preventDefault on Esc only once:
  // a second Esc closes the dialog outright, past any handler of ours. Without
  // this the parent would still think it was open and no card would reopen.)
  const handleClosed = useCallback(() => {
    // `close` is queued as a task, so it can land after the dialog has already
    // been reopened for the next item. A stale one must not shut the new item.
    if (ref.current?.open) return;
    setClosing(false);
    onClose();
    returnFocus.current?.focus({ preventScroll: true });
  }, [onClose]);

  const requestClose = useCallback(() => {
    const d = ref.current;
    if (!d?.open || closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return d.close();
    setClosing(true);
    window.setTimeout(() => d.close(), CLOSE_MS);
  }, [closing]);

  return (
    <dialog
      ref={ref}
      // Lenis drives the page's wheel scrolling; without this it would keep
      // scrolling the page behind the modal instead of the modal itself.
      data-lenis-prevent
      aria-labelledby={titleId}
      onCancel={(e) => {
        // Esc: play the exit animation instead of vanishing
        e.preventDefault();
        requestClose();
      }}
      onClose={handleClosed}
      onClick={(e) => {
        // a click that lands on the dialog element itself is on the backdrop
        if (e.target === e.currentTarget) requestClose();
      }}
      data-closing={closing || undefined}
      className="cst-modal m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto overscroll-contain bg-transparent p-0 text-ink backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:m-auto sm:h-auto sm:max-h-[88vh] sm:w-[min(48rem,calc(100vw-3rem))] sm:rounded-2xl"
    >
      {open ? (
        <article className="cst-modal-panel min-h-full border-base-border bg-base-raised sm:min-h-0 sm:rounded-2xl sm:border">
          <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-base-border bg-base-raised/90 px-5 py-4 backdrop-blur sm:px-6">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-ink">
                {title}
              </h2>
              {subtitle ? <p className="mt-1 text-[13px] text-ink-dim">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close details"
              className="-mr-1.5 rounded-full p-1.5 text-ink-faint transition-colors hover:bg-base hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink-faint"
            >
              <LuX className="h-5 w-5" aria-hidden />
            </button>
          </header>

          <div className="space-y-7 px-5 py-6 sm:px-6">{children}</div>

          {footer ? (
            <footer className="flex flex-wrap gap-3 border-t border-base-border px-5 py-4 sm:px-6">
              {footer}
            </footer>
          ) : null}
        </article>
      ) : null}
    </dialog>
  );
}

/** A labelled block inside a modal. */
export function ModalSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** The pill-shaped outbound link used in modal footers. */
export function ModalLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-base-border bg-base px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/40"
    >
      {icon}
      {children}
    </a>
  );
}

"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal dialog behavior, in one place: initial focus, a Tab trap, Escape
 * to close, and focus returned to whatever opened it.
 *
 * Written because three overlays each needed this and only one had it —
 * the exit mat was correct while the primary lead modal and the mobile
 * nav drawer were not. Pair it with role="dialog" + aria-modal on the
 * panel; the hook handles behavior, the markup handles semantics.
 *
 * Returns the ref to attach to the panel element.
 */
export function useDialog(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const els = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      /* Returning focus is what makes a keyboard user not lose their
         place — without it they land back on <body>, at the top. */
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  return panelRef;
}

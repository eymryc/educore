"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin top progress bar for App Router navigations (click on internal links).
 */
export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const activeRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (hideRef.current) clearTimeout(hideRef.current);
    tickRef.current = null;
    hideRef.current = null;
  }, []);

  const start = useCallback(() => {
    clearTimers();
    activeRef.current = true;
    setVisible(true);
    setWidth(8);
    tickRef.current = setInterval(() => {
      setWidth((w) => {
        if (w >= 92) return w;
        if (w >= 75) return w + 0.4;
        if (w >= 45) return w + 1.5;
        return w + 6;
      });
    }, 180);
  }, [clearTimers]);

  const finish = useCallback(() => {
    if (!activeRef.current) {
      setVisible(false);
      setWidth(0);
      return;
    }
    activeRef.current = false;
    clearTimers();
    setWidth(100);
    hideRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 260);
  }, [clearTimers]);

  useEffect(() => {
    finish();
  }, [pathname, searchParams, finish]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        const next = `${url.pathname}${url.search}`;
        const current = `${window.location.pathname}${window.location.search}`;
        if (next === current) return;
        start();
      } catch {
        /* ignore invalid href */
      }
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [start]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1"
      data-testid="navigation-progress"
    >
      <div
        className={`h-full bg-on-tertiary-container shadow-[0_0_12px_2px_rgba(0,153,217,0.75)] transition-[width,opacity] duration-200 ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

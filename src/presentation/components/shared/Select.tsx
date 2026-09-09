"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Liste déroulante avec recherche. Même API que l'ancien Select
 * (value/onChange en string, placeholder = valeur vide).
 */
export function Select({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  className = "",
  iconClassName = "text-on-surface-variant",
  disabled,
  id,
  testId,
  searchable,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  iconClassName?: string;
  disabled?: boolean;
  id?: string;
  testId?: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const showSearch = searchable ?? true;
  const selected = options.find((opt) => opt.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  function placePanel() {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.max(rect.width, 180);
    const estimatedHeight = Math.min(320, 48 + filtered.length * 40);
    let top = rect.bottom + 4;
    let left = rect.left;
    if (typeof window !== "undefined") {
      if (top + estimatedHeight > window.innerHeight) {
        top = Math.max(8, rect.top - estimatedHeight);
      }
      if (left + width > window.innerWidth) {
        left = Math.max(8, window.innerWidth - width - 8);
      }
    }
    setCoords({ top, left, width });
  }

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", placePanel, true);
    if (showSearch) {
      window.setTimeout(() => searchRef.current?.focus(), 0);
    }
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", placePanel, true);
    };
  }, [open, showSearch]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  function toggle() {
    if (disabled) return;
    if (open) {
      setOpen(false);
      setQuery("");
      return;
    }
    placePanel();
    setOpen(true);
  }

  const panel =
    open && coords && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed z-[200] bg-white shadow-lg border border-outline-variant/20"
            ref={panelRef}
            style={{ top: coords.top, left: coords.left, width: coords.width }}
          >
            {showSearch && (
              <div className="p-xs border-b border-outline-variant/15">
                <div className="flex items-center gap-xs px-sm h-9 bg-surface-container-low">
                  <span aria-hidden className="material-symbols-outlined text-[18px] text-on-surface-variant">
                    search
                  </span>
                  <input
                    aria-label="Rechercher une option"
                    className="flex-1 bg-transparent outline-none text-body-sm text-on-surface min-w-0"
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const first = filtered[0];
                        if (first) choose(first.value);
                      }
                    }}
                    placeholder="Rechercher…"
                    ref={searchRef}
                    type="text"
                    value={query}
                  />
                </div>
              </div>
            )}
            <ul className="max-h-60 overflow-y-auto p-xs" role="listbox">
              {placeholder && !query && (
                <li
                  aria-selected={value === ""}
                  className={`relative flex items-center px-md py-sm text-body-sm cursor-pointer outline-none text-on-surface-variant hover:bg-surface-container-low ${
                    value === "" ? "bg-secondary-container text-on-secondary-container font-semibold" : ""
                  }`}
                  onClick={() => choose("")}
                  role="option"
                >
                  {placeholder}
                </li>
              )}
              {filtered.map((opt) => {
                const active = opt.value === value;
                return (
                  <li
                    aria-selected={active}
                    className={`relative flex items-center justify-between gap-sm px-md py-sm text-body-sm cursor-pointer outline-none hover:bg-surface-container-low ${
                      active
                        ? "bg-secondary-container text-on-secondary-container font-semibold"
                        : ""
                    }`}
                    key={opt.value}
                    onClick={() => choose(opt.value)}
                    role="option"
                  >
                    <span className="min-w-0 truncate">{opt.label}</span>
                    {active && (
                      <span aria-hidden className="material-symbols-outlined text-[16px]">
                        check
                      </span>
                    )}
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-md py-sm text-[13px] text-on-surface-variant">Aucun résultat</li>
              )}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative min-w-0" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`inline-flex w-full items-center justify-between gap-sm text-left outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`.trim()}
        data-testid={testId}
        disabled={disabled}
        id={id}
        onClick={toggle}
        type="button"
      >
        <span className={`min-w-0 truncate ${value ? "" : "text-on-surface-variant/60"}`}>
          {selected?.label ?? placeholder ?? "— Sélectionner —"}
        </span>
        <span aria-hidden className={`${iconClassName} material-symbols-outlined text-[18px] shrink-0`}>
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>
      {panel}
    </div>
  );
}

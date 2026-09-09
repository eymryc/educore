"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseIsoDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year!, month! - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month! - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatFrShort(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) return "";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function parseFlexibleDate(raw: string): string | null {
  const text = raw.trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return parseIsoDate(text) ? text : null;
  const fr = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (fr) {
    const iso = `${fr[3]}-${pad(Number(fr[2]))}-${pad(Number(fr[1]))}`;
    return parseIsoDate(iso) ? iso : null;
  }
  return null;
}

function monthGrid(view: Date): Date[] {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const cell = new Date(start);
    cell.setDate(start.getDate() + i);
    return cell;
  });
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function yearOptions(around: Date): number[] {
  const max = around.getFullYear() + 15;
  const min = max - 119;
  return Array.from({ length: max - min + 1 }, (_, i) => max - i);
}

export function DatePicker({
  value,
  onChange,
  id,
  ariaLabel,
  className = "",
  inputClassName = "",
  required,
  error,
  placeholder = "JJ/MM/AAAA",
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  error?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = parseIsoDate(value);
  const [view, setView] = useState(() => selected ?? new Date());
  const [text, setText] = useState(() => (value ? formatFrShort(value) : ""));

  useEffect(() => {
    setText(value ? formatFrShort(value) : "");
    const next = parseIsoDate(value);
    if (next) {
      setView((current) =>
        current.getFullYear() === next.getFullYear() && current.getMonth() === next.getMonth()
          ? current
          : next
      );
    }
  }, [value]);

  function placePanel() {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 328;
    const estimatedHeight = 360;
    let top = rect.bottom + 6;
    let left = rect.left;
    if (typeof window !== "undefined") {
      if (top + estimatedHeight > window.innerHeight) {
        top = Math.max(8, rect.top - estimatedHeight);
      }
      if (left + width > window.innerWidth) {
        left = Math.max(8, window.innerWidth - width - 8);
      }
    }
    setCoords({ top, left });
  }

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", placePanel, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", placePanel, true);
    };
  }, [open]);

  const cells = useMemo(() => monthGrid(view), [view]);
  const today = new Date();
  const years = useMemo(() => yearOptions(new Date()), []);

  function commitText(raw: string) {
    const parsed = parseFlexibleDate(raw);
    if (parsed == null) return;
    onChange(parsed);
    setText(parsed ? formatFrShort(parsed) : "");
  }

  function pick(date: Date) {
    onChange(toIsoDate(date));
    setOpen(false);
  }

  function toggleCalendar() {
    if (disabled) return;
    if (open) {
      setOpen(false);
      return;
    }
    placePanel();
    setOpen(true);
  }

  const calendar =
    open && coords && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed z-[200] w-[20.5rem] bg-white border border-outline-variant/20 shadow-[0_8px_32px_rgb(15_23_42/0.16)] p-sm"
            ref={panelRef}
            style={{ top: coords.top, left: coords.left }}
          >
            <div className="flex items-center gap-xs mb-sm">
              <button
                aria-label="Mois précédent"
                className="w-8 h-8 inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low"
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
                type="button"
              >
                <span aria-hidden className="material-symbols-outlined text-[18px]">
                  chevron_left
                </span>
              </button>
              <select
                aria-label="Mois"
                className="flex-1 h-8 min-w-0 bg-surface-container-low px-xs text-[13px] font-semibold capitalize outline-none"
                onChange={(e) =>
                  setView(new Date(view.getFullYear(), Number(e.target.value), 1))
                }
                value={view.getMonth()}
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                aria-label="Année"
                className="h-8 w-[5.5rem] bg-surface-container-low px-xs text-[13px] font-semibold tabular-nums outline-none"
                onChange={(e) =>
                  setView(new Date(Number(e.target.value), view.getMonth(), 1))
                }
                value={view.getFullYear()}
              >
                {!years.includes(view.getFullYear()) && (
                  <option value={view.getFullYear()}>{view.getFullYear()}</option>
                )}
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                aria-label="Mois suivant"
                className="w-8 h-8 inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low"
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
                type="button"
              >
                <span aria-hidden className="material-symbols-outlined text-[18px]">
                  chevron_right
                </span>
              </button>
            </div>
            <div className="grid grid-cols-7 mb-xs">
              {WEEKDAYS.map((day) => (
                <span
                  className="text-center text-[11px] font-semibold text-on-surface-variant py-xs"
                  key={day}
                >
                  {day}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {cells.map((cell) => {
                const inMonth = cell.getMonth() === view.getMonth();
                const isSelected = selected ? sameDay(cell, selected) : false;
                const isToday = sameDay(cell, today);
                return (
                  <button
                    className={`h-8 text-[13px] tabular-nums ${
                      isSelected
                        ? "bg-primary text-on-primary font-semibold"
                        : isToday
                          ? "ring-1 ring-primary/40 font-semibold"
                          : inMonth
                            ? "hover:bg-surface-container-low text-on-surface"
                            : "text-on-surface-variant/40"
                    }`}
                    key={toIsoDate(cell)}
                    onClick={() => pick(cell)}
                    type="button"
                  >
                    {cell.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-sm pt-sm border-t border-outline-variant/15">
              <button
                className="h-8 px-sm text-[12px] font-semibold text-primary hover:underline"
                onClick={() => pick(new Date())}
                type="button"
              >
                Aujourd&apos;hui
              </button>
              <button
                className="h-8 px-sm text-[12px] text-on-surface-variant hover:text-on-surface"
                onClick={() => {
                  onChange("");
                  setText("");
                  setOpen(false);
                }}
                type="button"
              >
                Effacer
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className={`relative ${className}`.trim()} ref={rootRef}>
      <div className="relative flex items-center">
        <input
          aria-invalid={error}
          aria-label={ariaLabel}
          className={`ui-input w-full bg-white border border-outline-variant/25 pr-10 ${inputClassName}`.trim()}
          disabled={disabled}
          id={id}
          inputMode="numeric"
          onBlur={(e) => commitText(e.target.value)}
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            if (next.trim() === "") onChange("");
          }}
          placeholder={placeholder}
          required={required}
          type="text"
          value={text}
        />
        <button
          aria-expanded={open}
          aria-label="Ouvrir le calendrier"
          className="absolute right-1 w-8 h-8 inline-flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-40"
          disabled={disabled}
          onClick={toggleCalendar}
          type="button"
        >
          <span aria-hidden className="material-symbols-outlined text-[20px]">
            calendar_month
          </span>
        </button>
      </div>
      {calendar}
    </div>
  );
}

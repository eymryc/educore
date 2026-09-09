"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type DataTableMenuItem =
  | {
      kind: "link";
      label: string;
      icon: string;
      href: string;
      destructive?: boolean;
    }
  | {
      kind: "button";
      label: string;
      icon: string;
      onClick: () => void;
      destructive?: boolean;
      disabled?: boolean;
    }
  | { kind: "divider" };

function normalizeItems(items: DataTableMenuItem[]): DataTableMenuItem[] {
  const filtered = items.filter((item) => item.kind !== "divider");
  const result: DataTableMenuItem[] = [];
  for (const item of filtered) {
    if (
      item.kind === "button" &&
      item.destructive &&
      result.length > 0 &&
      result[result.length - 1]?.kind !== "divider"
    ) {
      result.push({ kind: "divider" });
    }
    result.push(item);
  }
  return result;
}

export function crudRowActions({
  view,
  edit,
  delete: deleteAction,
  canUpdate = true,
  canDelete = true,
  extra = [],
}: {
  view?: { href: string; label?: string; icon?: string };
  edit?: { resource: string; recordId: string | number };
  delete?: { onClick: () => void; disabled?: boolean };
  canUpdate?: boolean;
  canDelete?: boolean;
  extra?: DataTableMenuItem[];
}): DataTableMenuItem[] {
  const items: DataTableMenuItem[] = [...extra];
  if (view) {
    items.push({
      kind: "link",
      label: view.label ?? "Voir",
      href: view.href,
      icon: view.icon ?? "visibility",
    });
  }
  if (canUpdate && edit) {
    items.push({
      kind: "link",
      label: "Modifier",
      href: `/crud/${edit.resource}/${edit.recordId}/modifier`,
      icon: "edit",
    });
  }
  if (canDelete && deleteAction) {
    items.push({
      kind: "button",
      label: "Supprimer",
      icon: "delete",
      onClick: deleteAction.onClick,
      destructive: true,
      disabled: deleteAction.disabled,
    });
  }
  return items;
}

export function DataTableActionsMenu({
  ariaLabel,
  items,
  testId = "row-actions",
  dense = true,
}: {
  ariaLabel: string;
  items: DataTableMenuItem[];
  testId?: string;
  dense?: boolean;
}) {
  const menuItems = normalizeItems(items);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (menuItems.length === 0) return null;

  return (
    <div className="relative inline-flex justify-end" data-testid={testId} ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className={`inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors ${
          dense ? "w-7 h-7" : "w-8 h-8"
        }`}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className={`material-symbols-outlined ${dense ? "text-[18px]" : "text-[20px]"}`}>more_vert</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-30 min-w-[11rem] rounded-lg bg-surface-container-lowest shadow-lg border border-outline-variant/20 py-xs overflow-hidden"
          role="menu"
        >
          {menuItems.map((item, index) => {
            if (item.kind === "divider") {
              return (
                <div
                  className="my-xs border-t border-outline-variant/15"
                  key={`divider-${index}`}
                />
              );
            }
            const className = `w-full flex items-center gap-sm px-md py-sm text-[13px] transition-colors ${
              item.destructive
                ? "text-error hover:bg-error-container/40 disabled:opacity-40"
                : "text-on-surface hover:bg-surface-container-low"
            }`;
            if (item.kind === "link") {
              return (
                <Link
                  className={className}
                  href={item.href}
                  key={`${item.href}-${index}`}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  <span
                    aria-hidden
                    className="material-symbols-outlined text-[18px] text-on-surface-variant"
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                className={className}
                disabled={item.disabled}
                key={`${item.label}-${index}`}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                role="menuitem"
                type="button"
              >
                <span aria-hidden className="material-symbols-outlined text-[18px]">
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

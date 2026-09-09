"use client";

import { Select } from "@/presentation/components/shared/Select";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const PAGE_SIZE_SELECT_OPTIONS = PAGE_SIZE_OPTIONS.map((size) => ({
  value: String(size),
  label: String(size),
}));

function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("ellipsis");
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export function DataTablePagination({
  from,
  to,
  total,
  pageIndex,
  pageCount,
  pageSize,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  onFirstPage,
  onLastPage,
  onPageChange,
  onPageSizeChange,
  filteredHint,
  testId,
  entityLabel = "éléments",
}: {
  from: number;
  to: number;
  total: number;
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onFirstPage?: () => void;
  onLastPage?: () => void;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (size: number) => void;
  filteredHint?: string;
  testId?: string;
  entityLabel?: string;
}) {
  const current = pageIndex + 1;
  const pages = pageWindow(current, Math.max(1, pageCount));

  return (
    <div className="ui-table-chrome border-t-2 border-outline-variant/30 justify-between flex-nowrap overflow-x-auto">
      <div
        className="flex items-center gap-sm font-body-sm text-[13px] text-on-surface-variant shrink-0 whitespace-nowrap"
        data-testid={testId}
      >
        <p>
          Affichage{" "}
          <span className="font-semibold text-on-surface tabular-nums">
            {from}–{to}
          </span>{" "}
          sur{" "}
          <span className="font-semibold text-on-surface tabular-nums">{total}</span>{" "}
          {entityLabel}
          {filteredHint ? (
            <span className="text-on-surface-variant/80"> · {filteredHint}</span>
          ) : null}
        </p>
        {onPageSizeChange && (
          <label className="inline-flex items-center gap-xs">
            <span className="text-[12px] uppercase tracking-wide text-on-surface-variant/70">
              Par page
            </span>
            <Select
              ariaLabel="Nombre d'éléments par page"
              className="ui-input h-9 py-0 cursor-pointer min-w-[4.5rem] bg-white border border-outline-variant/25"
              onChange={(v) => onPageSizeChange(Number(v))}
              options={PAGE_SIZE_SELECT_OPTIONS}
              searchable={false}
              value={String(pageSize)}
            />
          </label>
        )}
      </div>

      <div className="flex items-center gap-xs shrink-0">
        <button
          aria-label="Première page"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-35 disabled:pointer-events-none transition-colors"
          disabled={!canPreviousPage}
          onClick={onFirstPage}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">first_page</span>
        </button>
        <button
          aria-label="Page précédente"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-35 disabled:pointer-events-none transition-colors"
          disabled={!canPreviousPage}
          onClick={onPreviousPage}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        <div className="flex items-center gap-0.5 mx-xs">
          {pages.map((page, i) =>
            page === "ellipsis" ? (
              <span
                aria-hidden
                className="w-8 h-9 inline-flex items-center justify-center text-on-surface-variant/50 text-[13px]"
                key={`e-${i}`}
              >
                …
              </span>
            ) : (
              <button
                aria-current={page === current ? "page" : undefined}
                aria-label={`Page ${page}`}
                className={`min-w-9 h-9 px-sm rounded-lg text-[13px] font-semibold tabular-nums transition-colors ${
                  page === current
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
                key={page}
                onClick={() => onPageChange?.(page - 1)}
                type="button"
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          aria-label="Page suivante"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-35 disabled:pointer-events-none transition-colors"
          disabled={!canNextPage}
          onClick={onNextPage}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
        <button
          aria-label="Dernière page"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-35 disabled:pointer-events-none transition-colors"
          disabled={!canNextPage}
          onClick={onLastPage}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">last_page</span>
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

export const DEFAULT_TABLE_PAGE_SIZE = 10;

export function tableRowClass(index: number, selected = false): string {
  return [
    "group ui-table-row min-h-[44px] border-b border-outline-variant/10 last:border-b-0",
    index % 2 === 1 ? "ui-table-row-zebra" : "",
    selected ? "!bg-secondary-container/35 hover:!bg-secondary-container/50" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function useClientDataTable<T extends { id: number }>(
  items: T[],
  resetDeps: readonly unknown[],
  defaultPageSize = DEFAULT_TABLE_PAGE_SIZE
) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setPageIndex(0);
    setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  const pageRows = useMemo(
    () => items.slice(safePageIndex * pageSize, (safePageIndex + 1) * pageSize),
    [items, safePageIndex, pageSize]
  );

  const from = items.length === 0 ? 0 : safePageIndex * pageSize + 1;
  const to = Math.min((safePageIndex + 1) * pageSize, items.length);

  const allPageSelected =
    pageRows.length > 0 && pageRows.every((row) => selectedIds.has(row.id));
  const somePageSelected = pageRows.some((row) => selectedIds.has(row.id));

  function toggleAllPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageRows.forEach((row) => next.delete(row.id));
      } else {
        pageRows.forEach((row) => next.add(row.id));
      }
      return next;
    });
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setPageSizeAndReset(size: number) {
    setPageSize(size);
    setPageIndex(0);
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  return {
    pageIndex: safePageIndex,
    pageSize,
    pageCount,
    pageRows,
    from,
    to,
    selectedIds,
    allPageSelected,
    somePageSelected,
    setPageIndex,
    setPageSize: setPageSizeAndReset,
    toggleAllPage,
    toggleOne,
    clearSelection,
    canPreviousPage: safePageIndex > 0,
    canNextPage: safePageIndex < pageCount - 1,
  };
}

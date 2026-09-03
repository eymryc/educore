"use client";

import { tableCheckboxClass } from "@/presentation/components/shared/data-table-utils";

export function DataTableRefreshButton({
  loading,
  onRefresh,
}: {
  loading?: boolean;
  onRefresh: () => void;
}) {
  return (
    <button
      aria-label="Actualiser la liste"
      className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors disabled:opacity-40 shadow-sm"
      disabled={loading}
      onClick={onRefresh}
      title="Actualiser"
      type="button"
    >
      <span
        className={`material-symbols-outlined text-[20px] ${loading ? "animate-spin" : ""}`}
      >
        refresh
      </span>
    </button>
  );
}

export function DataTableSelectHeader({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  return (
    <th className="py-sm px-md w-10">
      <input
        aria-label="Tout sélectionner"
        checked={checked}
        className={tableCheckboxClass()}
        onChange={onChange}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate;
        }}
        type="checkbox"
      />
    </th>
  );
}

export function DataTableSelectCell({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <td className="py-sm px-md">
      <input
        aria-label={`Sélectionner ${label}`}
        checked={checked}
        className={tableCheckboxClass()}
        onChange={onChange}
        type="checkbox"
      />
    </td>
  );
}

"use client";

import { Checkbox } from "@/presentation/components/shared/Checkbox";

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
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors disabled:opacity-40 shadow-sm"
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
    <th className="py-[6px] px-md w-10">
      <Checkbox
        ariaLabel="Tout sélectionner"
        checked={checked}
        indeterminate={indeterminate}
        onChange={onChange}
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
    <td className="py-[6px] px-md">
      <Checkbox ariaLabel={`Sélectionner ${label}`} checked={checked} onChange={onChange} />
    </td>
  );
}

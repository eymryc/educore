"use client";

import type { ReactNode } from "react";
import { DatePicker } from "@/presentation/components/shared/DatePicker";
import { Select, type SelectOption } from "@/presentation/components/shared/Select";

export const DATA_TABLE_FILTER_CLASS =
  "ui-input cursor-pointer h-9 py-0 w-full sm:w-auto min-w-0 sm:min-w-[9rem] bg-white border border-outline-variant/25";

export const DATA_TABLE_CREATE_CLASS =
  "inline-flex items-center gap-sm h-9 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm whitespace-nowrap";

export const DATA_TABLE_TH_CLASS = "px-md py-[6px] whitespace-nowrap";
export const DATA_TABLE_TD_CLASS = "px-md py-[6px] align-middle";
export const DATA_TABLE_TH_ACTIONS_CLASS = `${DATA_TABLE_TH_CLASS} text-right w-12`;
export const DATA_TABLE_TD_ACTIONS_CLASS = `${DATA_TABLE_TD_CLASS} text-right overflow-visible`;

export function DataTableShell({
  children,
  className = "",
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div className={`ui-table-shell flex-1 flex flex-col ${className}`.trim()} data-testid={testId}>
      {children}
    </div>
  );
}

export function DataTableToolbar({
  children,
  className = "",
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div
      className={`ui-table-chrome border-b-2 border-outline-variant/30 ${className}`.trim()}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

export function DataTableSearch({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <div className="ui-search-field w-full sm:w-auto sm:flex-1 min-w-0 sm:min-w-[180px] h-9 py-0 bg-white border border-outline-variant/25">
      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
      <input
        aria-label={ariaLabel}
        className="ui-search-input ml-sm h-full"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </div>
  );
}

export function DataTableFilterSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  className = "",
  disabled,
  id,
  testId,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  testId?: string;
}) {
  return (
    <Select
      ariaLabel={ariaLabel}
      className={`${DATA_TABLE_FILTER_CLASS} ${className}`.trim()}
      disabled={disabled}
      id={id}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      searchable
      testId={testId}
      value={value}
    />
  );
}

export function DataTableFilterDate({
  value,
  onChange,
  ariaLabel,
  className = "",
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  id?: string;
}) {
  return (
    <div className={`w-full sm:w-[11.5rem] min-w-[10.5rem] shrink-0 ${className}`.trim()}>
      <DatePicker
        ariaLabel={ariaLabel}
        id={id}
        inputClassName="h-9 py-0"
        onChange={onChange}
        value={value}
      />
    </div>
  );
}

export function DataTableClearFilters({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="inline-flex items-center gap-xs h-9 px-sm text-[12px] text-on-surface-variant hover:text-primary transition-colors"
      onClick={onClick}
      type="button"
    >
      <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
      Réinitialiser
    </button>
  );
}

export function DataTableToolbarActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
      {children}
    </div>
  );
}

export function DataTableSelectionBar({
  count,
  entityLabel,
  onClear,
}: {
  count: number;
  entityLabel: string;
  onClear: () => void;
}) {
  if (count <= 0) return null;
  const plural = count > 1;
  return (
    <div className="flex flex-wrap items-center gap-sm px-md py-xs bg-secondary-container/40 border-b border-outline-variant/15">
      <span className="material-symbols-outlined text-[16px] text-on-secondary-container">
        check_circle
      </span>
      <p className="font-body-sm text-[12px] text-on-surface">
        <span className="font-semibold tabular-nums">{count}</span> {entityLabel}
        {plural ? "s" : ""} sélectionné{plural ? "s" : ""}
      </p>
      <button
        className="ml-auto text-[12px] font-semibold text-primary hover:underline"
        onClick={onClear}
        type="button"
      >
        Tout désélectionner
      </button>
    </div>
  );
}

export function DataTableEmpty({
  icon = "group_off",
  title,
  description,
  testId,
  children,
}: {
  icon?: string;
  title: string;
  description: string;
  testId?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center px-lg py-2xl text-center"
      data-testid={testId}
    >
      <span className="w-14 h-14 rounded-xl bg-surface-container-low inline-flex items-center justify-center mb-md">
        <span className="material-symbols-outlined text-[28px] text-on-surface-variant/60">
          {icon}
        </span>
      </span>
      <h3 className="font-headline-md text-headline-md mb-xs">{title}</h3>
      <p className="font-body-sm text-on-surface-variant max-w-sm mb-lg">{description}</p>
      {children ? <div className="flex flex-wrap gap-sm justify-center">{children}</div> : null}
    </div>
  );
}

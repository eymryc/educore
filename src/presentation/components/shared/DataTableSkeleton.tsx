import type { ReactNode } from "react";

type ColumnSpec = {
  width: string;
  kind?: "checkbox" | "text" | "badge" | "actions";
};

const DEFAULT_COLUMNS: ColumnSpec[] = [
  { kind: "checkbox", width: "w-4" },
  { kind: "text", width: "w-28" },
  { kind: "text", width: "w-24" },
  { kind: "text", width: "w-40" },
  { kind: "text", width: "w-20" },
  { kind: "text", width: "w-24" },
  { kind: "badge", width: "w-16" },
  { kind: "actions", width: "w-8" },
];

/** Generic N-column text table (no checkbox). */
export function tableColumns(count: number, withActions = true): ColumnSpec[] {
  const cols: ColumnSpec[] = Array.from({ length: Math.max(1, count - (withActions ? 1 : 0)) }, (_, i) => ({
    kind: "text" as const,
    width: i % 3 === 0 ? "w-32" : i % 3 === 1 ? "w-24" : "w-20",
  }));
  if (withActions) cols.push({ kind: "actions", width: "w-8" });
  return cols;
}

export function SkeletonBar({
  className,
  round = "rounded-md",
}: {
  className: string;
  round?: string;
}) {
  return <span aria-hidden className={`ui-skeleton-bar block h-3 ${round} ${className}`} />;
}

function SkeletonShell({
  testId,
  label,
  className,
  children,
}: {
  testId?: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={className}
      data-testid={testId}
      role="status"
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function DataTableSkeleton({
  columns = DEFAULT_COLUMNS,
  rows = 8,
  labels,
  testId,
  label = "Chargement des données…",
  className,
}: {
  columns?: ColumnSpec[];
  rows?: number;
  labels?: string[];
  testId?: string;
  label?: string;
  className?: string;
}) {
  return (
    <SkeletonShell className={`w-full ${className ?? ""}`} label={label} testId={testId}>
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-container-low/80">
          <tr>
            {columns.map((col, i) => (
              <th
                className={`px-md py-sm ui-stat-label whitespace-nowrap ${
                  col.kind === "checkbox" ? "w-10" : col.kind === "actions" ? "text-right w-16" : ""
                }`}
                key={`h-${i}`}
              >
                {col.kind === "checkbox" ? (
                  <SkeletonBar className="w-4 h-4" round="rounded" />
                ) : col.kind === "actions" ? (
                  <span className="sr-only">Actions</span>
                ) : labels?.[i] ? (
                  labels[i]
                ) : (
                  <SkeletonBar className={`${col.width} max-w-full`} />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => {
            const zebra = rowIndex % 2 === 1;
            return (
              <tr
                className={
                  zebra ? "bg-surface-container-low/45" : "bg-surface-container-lowest"
                }
                key={`r-${rowIndex}`}
              >
                {columns.map((col, colIndex) => (
                  <td className="px-md py-sm align-middle" key={`c-${rowIndex}-${colIndex}`}>
                    {col.kind === "checkbox" ? (
                      <SkeletonBar className="w-4 h-4" round="rounded" />
                    ) : col.kind === "badge" ? (
                      <SkeletonBar className={`${col.width} h-5`} round="rounded-full" />
                    ) : col.kind === "actions" ? (
                      <div className="flex justify-end">
                        <SkeletonBar className="w-8 h-8" round="rounded-lg" />
                      </div>
                    ) : (
                      <SkeletonBar
                        className={`${col.width} ${
                          rowIndex % 3 === 0
                            ? "opacity-90"
                            : rowIndex % 3 === 1
                              ? "opacity-75"
                              : "opacity-60"
                        }`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </SkeletonShell>
  );
}

export function CardsSkeleton({
  count = 6,
  testId,
  label = "Chargement…",
}: {
  count?: number;
  testId?: string;
  label?: string;
}) {
  return (
    <SkeletonShell
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-lg"
      label={label}
      testId={testId}
    >
      {Array.from({ length: count }, (_, i) => (
        <div className="ui-card ui-card-pad flex flex-col gap-md" key={i}>
          <SkeletonBar className="w-1/2 h-3" />
          <SkeletonBar className="w-3/4 h-5" />
          <SkeletonBar className="w-full h-3 opacity-70" />
          <div className="flex gap-sm mt-sm">
            <SkeletonBar className="w-16 h-6" round="rounded-full" />
            <SkeletonBar className="w-10 h-6" round="rounded-lg" />
          </div>
        </div>
      ))}
    </SkeletonShell>
  );
}

export function ListSkeleton({
  rows = 6,
  testId,
  label = "Chargement…",
}: {
  rows?: number;
  testId?: string;
  label?: string;
}) {
  return (
    <SkeletonShell className="flex flex-col gap-sm" label={label} testId={testId}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          className={`ui-card ui-card-pad flex items-start gap-md ${
            i % 2 === 1 ? "bg-surface-container-low/40" : ""
          }`}
          key={i}
        >
          <SkeletonBar className="w-10 h-10 shrink-0" round="rounded-full" />
          <div className="flex-1 flex flex-col gap-sm min-w-0">
            <SkeletonBar className="w-2/5 h-3" />
            <SkeletonBar className="w-4/5 h-3 opacity-70" />
            <SkeletonBar className="w-1/3 h-3 opacity-50" />
          </div>
        </div>
      ))}
    </SkeletonShell>
  );
}

export function DetailSkeleton({
  testId,
  label = "Chargement…",
}: {
  testId?: string;
  label?: string;
}) {
  return (
    <SkeletonShell className="flex flex-col gap-lg w-full max-w-3xl" label={label} testId={testId}>
      <div className="flex items-center gap-md">
        <SkeletonBar className="w-16 h-16" round="rounded-full" />
        <div className="flex flex-col gap-sm flex-1">
          <SkeletonBar className="w-48 h-5" />
          <SkeletonBar className="w-32 h-3 opacity-70" />
        </div>
      </div>
      <div className="ui-card ui-card-pad grid grid-cols-1 sm:grid-cols-2 gap-md">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="flex flex-col gap-xs" key={i}>
            <SkeletonBar className="w-20 h-2 opacity-60" />
            <SkeletonBar className="w-full h-4" />
          </div>
        ))}
      </div>
      <div className="ui-card ui-card-pad flex flex-col gap-md">
        <SkeletonBar className="w-40 h-4" />
        <SkeletonBar className="w-full h-3 opacity-70" />
        <SkeletonBar className="w-5/6 h-3 opacity-60" />
        <SkeletonBar className="w-2/3 h-3 opacity-50" />
      </div>
    </SkeletonShell>
  );
}

export function FormSkeleton({
  testId,
  label = "Chargement du formulaire…",
  fields = 6,
}: {
  testId?: string;
  label?: string;
  fields?: number;
}) {
  return (
    <SkeletonShell
      className="ui-card ui-card-pad flex flex-col gap-lg max-w-xl"
      label={label}
      testId={testId}
    >
      {Array.from({ length: fields }, (_, i) => (
        <div className="flex flex-col gap-xs" key={i}>
          <SkeletonBar className="w-24 h-2 opacity-60" />
          <SkeletonBar className="w-full h-10" round="rounded-lg" />
        </div>
      ))}
      <SkeletonBar className="w-32 h-10 self-end" round="rounded-full" />
    </SkeletonShell>
  );
}

export function DashboardSkeleton({
  testId,
  label = "Chargement…",
  kpis = 4,
}: {
  testId?: string;
  label?: string;
  kpis?: number;
}) {
  return (
    <SkeletonShell className="flex flex-col gap-xl w-full" label={label} testId={testId}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-lg">
        {Array.from({ length: kpis }, (_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <div className="ui-card ui-card-pad flex flex-col gap-md min-h-[200px]">
          <SkeletonBar className="w-40 h-4" />
          <SkeletonBar className="w-full h-3 opacity-70" />
          <SkeletonBar className="w-5/6 h-3 opacity-60" />
          <SkeletonBar className="w-2/3 h-3 opacity-50" />
        </div>
        <div className="ui-table-shell">
          <DataTableSkeleton columns={tableColumns(4)} rows={5} />
        </div>
      </div>
    </SkeletonShell>
  );
}

export function KpiSkeleton() {
  return (
    <div className="ui-card ui-card-pad flex flex-col gap-md h-28 justify-center">
      <SkeletonBar className="w-24 h-2 opacity-60" />
      <SkeletonBar className="w-16 h-7" />
    </div>
  );
}

export function PanelSkeleton({
  testId,
  label = "Chargement…",
  lines = 4,
}: {
  testId?: string;
  label?: string;
  lines?: number;
}) {
  return (
    <SkeletonShell className="flex flex-col gap-sm p-md" label={label} testId={testId}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBar
          className={`${i === 0 ? "w-1/2 h-4" : i % 2 === 0 ? "w-full h-3" : "w-4/5 h-3"} ${
            i === 0 ? "opacity-90" : i === 1 ? "opacity-75" : i === 2 ? "opacity-60" : "opacity-50"
          }`}
          key={i}
        />
      ))}
    </SkeletonShell>
  );
}

export function ScheduleSkeleton({
  testId,
  label = "Chargement…",
  rows = 6,
}: {
  testId?: string;
  label?: string;
  rows?: number;
}) {
  return (
    <SkeletonShell className="ui-table-shell w-full" label={label} testId={testId}>
      <div className="grid grid-cols-[4rem_1fr] gap-0">
        {Array.from({ length: rows }, (_, i) => (
          <div className="contents" key={i}>
            <div className="px-sm py-md border-b border-outline-variant/10">
              <SkeletonBar className="w-10 h-3" />
            </div>
            <div
              className={`px-md py-md border-b border-outline-variant/10 ${
                i % 2 === 1 ? "bg-surface-container-low/45" : ""
              }`}
            >
              <SkeletonBar className="w-2/3 h-8" round="rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonShell>
  );
}

/** Full admin list page: toolbar + table, aligned with management screens. */
export function PageTableSkeleton({
  testId,
  label = "Chargement…",
  rows = 10,
  columns,
}: {
  testId?: string;
  label?: string;
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-[1400px] mx-auto">
      <div className="ui-table-shell mt-0">
        <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
          <SkeletonBar className="flex-1 min-w-[200px] h-10" round="rounded-lg" />
          <SkeletonBar className="w-36 h-10 shrink-0" round="rounded-lg" />
          <SkeletonBar className="w-36 h-10 shrink-0" round="rounded-lg" />
          <div className="ml-auto flex items-center gap-sm shrink-0">
            <SkeletonBar className="w-10 h-10" round="rounded-lg" />
            <SkeletonBar className="w-36 h-10" round="rounded-lg" />
          </div>
        </div>
        <DataTableSkeleton
          columns={columns ? tableColumns(columns) : DEFAULT_COLUMNS}
          label={label}
          rows={rows}
          testId={testId}
        />
      </div>
    </div>
  );
}

/** One-liner switch for most screens. */
export function ContentSkeleton({
  variant = "table",
  testId,
  label = "Chargement…",
  rows,
  columns,
}: {
  variant?:
    | "table"
    | "page-table"
    | "cards"
    | "list"
    | "detail"
    | "dashboard"
    | "form"
    | "panel"
    | "schedule";
  testId?: string;
  label?: string;
  rows?: number;
  columns?: number;
}) {
  switch (variant) {
    case "page-table":
      return (
        <PageTableSkeleton
          columns={columns}
          label={label}
          rows={rows ?? 10}
          testId={testId}
        />
      );
    case "cards":
      return <CardsSkeleton count={rows ?? 6} label={label} testId={testId} />;
    case "list":
      return <ListSkeleton label={label} rows={rows ?? 6} testId={testId} />;
    case "detail":
      return <DetailSkeleton label={label} testId={testId} />;
    case "dashboard":
      return <DashboardSkeleton kpis={columns ?? 4} label={label} testId={testId} />;
    case "form":
      return <FormSkeleton fields={rows ?? 6} label={label} testId={testId} />;
    case "panel":
      return <PanelSkeleton label={label} lines={rows ?? 4} testId={testId} />;
    case "schedule":
      return <ScheduleSkeleton label={label} rows={rows ?? 6} testId={testId} />;
    default:
      return (
        <div className="ui-table-shell">
          <DataTableSkeleton
            columns={columns ? tableColumns(columns) : DEFAULT_COLUMNS}
            label={label}
            rows={rows ?? 8}
            testId={testId}
          />
        </div>
      );
  }
}

export const STUDENTS_TABLE_SKELETON_COLUMNS: ColumnSpec[] = [
  { kind: "checkbox", width: "w-4" },
  { kind: "text", width: "w-28" },
  { kind: "text", width: "w-24" },
  { kind: "text", width: "w-40" },
  { kind: "text", width: "w-24" },
  { kind: "text", width: "w-28" },
  { kind: "badge", width: "w-16" },
  { kind: "actions", width: "w-8" },
];

export const TEACHERS_TABLE_SKELETON_COLUMNS: ColumnSpec[] = [
  { kind: "checkbox", width: "w-4" },
  { kind: "text", width: "w-28" },
  { kind: "text", width: "w-24" },
  { kind: "text", width: "w-40" },
  { kind: "text", width: "w-20" },
  { kind: "badge", width: "w-24" },
  { kind: "text", width: "w-10" },
  { kind: "badge", width: "w-16" },
  { kind: "actions", width: "w-8" },
];

export const PARENTS_TABLE_SKELETON_COLUMNS: ColumnSpec[] = [
  { kind: "checkbox", width: "w-4" },
  { kind: "text", width: "w-28" },
  { kind: "text", width: "w-24" },
  { kind: "text", width: "w-40" },
  { kind: "text", width: "w-24" },
  { kind: "text", width: "w-12" },
  { kind: "badge", width: "w-20" },
  { kind: "actions", width: "w-8" },
];

export const CLASSES_TABLE_SKELETON_COLUMNS: ColumnSpec[] = [
  { kind: "checkbox", width: "w-4" },
  { kind: "text", width: "w-24" },
  { kind: "text", width: "w-20" },
  { kind: "text", width: "w-20" },
  { kind: "text", width: "w-10" },
  { kind: "text", width: "w-24" },
  { kind: "actions", width: "w-8" },
];

export const SUBJECTS_TABLE_SKELETON_COLUMNS: ColumnSpec[] = [
  { kind: "checkbox", width: "w-4" },
  { kind: "text", width: "w-16" },
  { kind: "text", width: "w-32" },
  { kind: "text", width: "w-24" },
  { kind: "text", width: "w-10" },
  { kind: "actions", width: "w-8" },
];

export const LIBRARY_BOOKS_TABLE_SKELETON_COLUMNS: ColumnSpec[] = [
  { kind: "checkbox", width: "w-4" },
  { kind: "text", width: "w-40" },
  { kind: "text", width: "w-28" },
  { kind: "text", width: "w-24" },
  { kind: "text", width: "w-24" },
  { kind: "actions", width: "w-8" },
];

export const LIBRARY_COPIES_TABLE_SKELETON_COLUMNS: ColumnSpec[] = [
  { kind: "checkbox", width: "w-4" },
  { kind: "text", width: "w-20" },
  { kind: "text", width: "w-40" },
  { kind: "badge", width: "w-20" },
  { kind: "actions", width: "w-8" },
];

export const LIBRARY_LOANS_TABLE_SKELETON_COLUMNS: ColumnSpec[] = [
  { kind: "checkbox", width: "w-4" },
  { kind: "text", width: "w-32" },
  { kind: "text", width: "w-20" },
  { kind: "text", width: "w-24" },
  { kind: "badge", width: "w-20" },
  { kind: "actions", width: "w-8" },
];

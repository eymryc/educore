"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
} from "@/presentation/components/shared/DataTableActionsMenu";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import { DataTableSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";
import {
  listAcademicPeriods,
  listAcademicYears,
  listClassGroups,
  listSubjects,
} from "@/infrastructure/api/resources/academic";
import { deleteAssessment, listAssessments } from "@/infrastructure/api/resources/assessments";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  classGroupsForActiveYear,
  type AcademicPeriod,
  type ClassGroup,
  type Subject,
} from "@/shared/types/academic.types";
import {
  ASSESSMENT_TYPE_LABELS,
  filterAssessments,
  type Assessment,
  type AssessmentType,
} from "@/shared/types/grades.types";

const DEFAULT_PAGE_SIZE = 10;

const ASSESSMENTS_TABLE_SKELETON_COLUMNS = [
  { kind: "checkbox" as const, width: "w-4" },
  { kind: "text" as const, width: "w-40" },
  { kind: "text" as const, width: "w-24" },
  { kind: "text" as const, width: "w-28" },
  { kind: "badge" as const, width: "w-20" },
  { kind: "text" as const, width: "w-24" },
  { kind: "text" as const, width: "w-20" },
  { kind: "actions" as const, width: "w-8" },
];

function typeTone(type: AssessmentType): "success" | "warning" | "error" | "info" | "neutral" {
  if (type === "composition") return "error";
  if (type === "devoir") return "info";
  if (type === "interrogation") return "warning";
  if (type === "tp") return "success";
  return "neutral";
}

function named(ref: { name?: string } | null | undefined): string {
  return ref && "name" in ref && ref.name ? ref.name : "—";
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  return (
    <span
      aria-hidden
      className={`material-symbols-outlined text-[14px] transition-opacity ${
        direction ? "opacity-100 text-primary" : "opacity-25"
      }`}
    >
      {direction === "desc" ? "arrow_downward" : "arrow_upward"}
    </span>
  );
}

export function AssessmentsManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [type, setType] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canCreate = can(user, "grades.create");
  const canUpdate = can(user, "grades.update");
  const canDelete = can(user, "grades.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [list, classList, subjectList, periodList, yearList] = await Promise.all([
        listAssessments(),
        listClassGroups(),
        listSubjects(),
        listAcademicPeriods(),
        listAcademicYears(),
      ]);
      setAssessments(list);
      setClasses(classGroupsForActiveYear(classList, yearList));
      setSubjects(subjectList);
      setPeriods(periodList);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(
    () =>
      filterAssessments(assessments, {
        search,
        classGroupId: classId,
        subjectId,
        periodId,
        type,
      }),
    [assessments, search, classId, subjectId, periodId, type]
  );

  const hasFilters = Boolean(search || classId || subjectId || periodId || type);

  function clearFilters() {
    setSearch("");
    setClassId("");
    setSubjectId("");
    setPeriodId("");
    setType("");
  }

  async function handleDelete(row: Assessment) {
    if (!canDelete) return;
    if (
      !(await confirmDialog(`Supprimer l'évaluation « ${row.title} » ?`, { destructive: true }))
    ) {
      return;
    }
    setDeletingId(row.id);
    try {
      await deleteAssessment(row.id);
      setAssessments((prev) => prev.filter((a) => a.id !== row.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  const columnHelper = useMemo(() => createColumnHelper<Assessment>(), []);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        enableSorting: false,
        header: ({ table }) => (
          <input
            aria-label="Tout sélectionner"
            checked={table.getIsAllPageRowsSelected()}
            className="size-4 rounded border-outline-variant accent-primary cursor-pointer"
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            ref={(el) => {
              if (el) el.indeterminate = table.getIsSomePageRowsSelected();
            }}
            type="checkbox"
          />
        ),
        cell: ({ row }) => (
          <input
            aria-label={`Sélectionner ${row.original.title}`}
            checked={row.getIsSelected()}
            className="size-4 rounded border-outline-variant accent-primary cursor-pointer"
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            type="checkbox"
          />
        ),
      }),
      columnHelper.accessor("title", {
        header: "Titre",
        cell: ({ row }) => (
          <Link
            className="font-semibold text-on-surface truncate hover:text-primary transition-colors"
            href={`/grades?assessment_id=${row.original.id}`}
          >
            {row.original.title}
          </Link>
        ),
      }),
      columnHelper.accessor((row) => named(row.class_group), {
        id: "class",
        header: "Classe",
        cell: ({ getValue }) => (
          <span className="font-medium text-on-surface">{getValue()}</span>
        ),
      }),
      columnHelper.accessor((row) => named(row.subject), {
        id: "subject",
        header: "Matière",
        cell: ({ getValue }) => (
          <span className="text-on-surface-variant">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: (info) => (
          <StatusBadge
            label={ASSESSMENT_TYPE_LABELS[info.getValue()] ?? info.getValue()}
            tone={typeTone(info.getValue())}
            withDot
          />
        ),
      }),
      columnHelper.accessor("date", {
        header: "Date",
        cell: (info) => (
          <span className="font-mono-data text-[12px] text-on-surface-variant tracking-wide">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor((row) => Number(row.coefficient), {
        id: "coefficient",
        header: "Coeff. / Barème",
        cell: ({ row }) => (
          <span className="font-mono-data text-[12px] text-on-surface-variant">
            {row.original.coefficient} / {row.original.max_score}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        enableSorting: false,
        header: "Actions",
        cell: ({ row }) => {
          const a = row.original;
          return (
            <DataTableActionsMenu
              ariaLabel={`Actions pour ${a.title}`}
              items={crudRowActions({
                extra: [
                  {
                    kind: "link",
                    label: "Notes",
                    icon: "grade",
                    href: `/grades?assessment_id=${a.id}`,
                  },
                ],
                edit: { resource: "assessments", recordId: a.id },
                delete: {
                  onClick: () => void handleDelete(a),
                  disabled: deletingId === a.id,
                },
                canUpdate,
                canDelete,
              })}
            />
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnHelper, canUpdate, canDelete, deletingId]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    enableRowSelection: true,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setRowSelection({});
  }, [search, classId, subjectId, periodId, type]);

  const { pageIndex, pageSize } = pagination;
  const rowCount = filtered.length;
  const from = rowCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, rowCount);

  return (
    <div className="flex flex-col w-full h-full max-w-[1400px] mx-auto gap-lg pb-xl">
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm"
        >
          {error}
        </div>
      )}

      <div className="ui-table-shell">
        <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
          <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              aria-label="Rechercher une évaluation"
              className="ui-search-input ml-sm h-full"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre…"
              type="text"
              value={search}
            />
          </div>
          <select
            aria-label="Filtrer par classe"
            className="ui-input cursor-pointer h-10 py-0"
            onChange={(e) => setClassId(e.target.value)}
            value={classId}
          >
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrer par matière"
            className="ui-input cursor-pointer h-10 py-0"
            onChange={(e) => setSubjectId(e.target.value)}
            value={subjectId}
          >
            <option value="">Toutes les matières</option>
            {subjects.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrer par période"
            className="ui-input cursor-pointer h-10 py-0"
            onChange={(e) => setPeriodId(e.target.value)}
            value={periodId}
          >
            <option value="">Toutes les périodes</option>
            {periods.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrer par type"
            className="ui-input cursor-pointer h-10 py-0"
            onChange={(e) => setType(e.target.value)}
            value={type}
          >
            <option value="">Tous les types</option>
            {(Object.keys(ASSESSMENT_TYPE_LABELS) as AssessmentType[]).map((t) => (
              <option key={t} value={t}>
                {ASSESSMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              className="inline-flex items-center gap-xs h-10 px-md text-[13px] text-on-surface-variant hover:text-primary transition-colors"
              onClick={clearFilters}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
              Réinitialiser
            </button>
          )}
          <div className="ml-auto shrink-0 flex items-center gap-sm">
            <button
              aria-label="Actualiser la liste"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-colors disabled:opacity-40 shadow-sm"
              disabled={loading}
              onClick={() => void reload()}
              title="Actualiser"
              type="button"
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  loading ? "animate-spin" : ""
                }`}
              >
                refresh
              </span>
            </button>
            {canCreate && (
              <CrudCreateLink
                className="inline-flex items-center gap-sm h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
                label="Nouvelle évaluation"
                resource="assessments"
              />
            )}
          </div>
        </div>

        <div className="overflow-auto">
          {loading ? (
            <DataTableSkeleton
              columns={ASSESSMENTS_TABLE_SKELETON_COLUMNS}
              label="Chargement des évaluations…"
              labels={["", "Titre", "Classe", "Matière", "Type", "Date", "Coeff.", ""]}
              rows={10}
              testId="assessments-loading"
            />
          ) : rowCount === 0 ? (
            <div
              className="flex flex-col items-center justify-center px-lg py-2xl text-center"
              data-testid="assessments-empty"
            >
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50 mb-md">
                assignment_late
              </span>
              <h3 className="font-title-md text-on-surface mb-xs">Aucune évaluation trouvée</h3>
              <p className="font-body-sm text-on-surface-variant max-w-sm mb-lg">
                Aucun résultat pour ces filtres, ou aucune évaluation n&apos;a encore été créée.
              </p>
              <div className="flex flex-wrap gap-sm justify-center">
                {hasFilters && (
                  <button className="ui-btn-secondary" onClick={clearFilters} type="button">
                    Effacer les filtres
                  </button>
                )}
                {canCreate && (
                  <CrudCreateLink label="Nouvelle évaluation" resource="assessments" />
                )}
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" data-testid="assessments-table">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const sortable = header.column.getCanSort();
                      const direction = header.column.getIsSorted();
                      const isActions = header.id === "actions";
                      const isSelect = header.id === "select";
                      return (
                        <th
                          aria-sort={
                            direction === "asc"
                              ? "ascending"
                              : direction === "desc"
                                ? "descending"
                                : "none"
                          }
                          className={`px-lg py-sm ui-stat-label whitespace-nowrap ${
                            isActions
                              ? "text-right sticky right-0 bg-surface-container-low/95 w-16"
                              : isSelect
                                ? "w-10"
                                : ""
                          }`}
                          key={header.id}
                        >
                          {header.isPlaceholder ? null : sortable ? (
                            <button
                              className="flex items-center gap-xs hover:text-on-surface transition-colors"
                              onClick={header.column.getToggleSortingHandler()}
                              type="button"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <SortIcon direction={direction} />
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="text-body-sm font-body-sm divide-y divide-outline-variant/10">
                {table.getRowModel().rows.map((row) => {
                  const zebra = row.index % 2 === 1;
                  return (
                    <tr
                      className={`group transition-colors hover:bg-surface-container-low/70 ${
                        zebra ? "bg-surface-container-low/45" : "bg-surface-container-lowest"
                      }`}
                      key={row.id}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isActions = cell.column.id === "actions";
                        return (
                          <td
                            className={`px-lg py-sm align-middle ${
                              isActions
                                ? `sticky right-0 text-right overflow-visible group-hover:bg-surface-container-low/70 ${
                                    zebra
                                      ? "bg-surface-container-low/45"
                                      : "bg-surface-container-lowest"
                                  }`
                                : ""
                            }`}
                            key={cell.id}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && rowCount > 0 && (
          <DataTablePagination
            canNextPage={table.getCanNextPage()}
            canPreviousPage={table.getCanPreviousPage()}
            entityLabel="évaluations"
            filteredHint={
              filtered.length !== assessments.length
                ? `filtre sur ${assessments.length}`
                : undefined
            }
            from={from}
            onFirstPage={() => table.setPageIndex(0)}
            onLastPage={() => table.setPageIndex(table.getPageCount() - 1)}
            onNextPage={() => table.nextPage()}
            onPageChange={(index) => table.setPageIndex(index)}
            onPageSizeChange={(size) => setPagination({ pageIndex: 0, pageSize: size })}
            onPreviousPage={() => table.previousPage()}
            pageCount={table.getPageCount()}
            pageIndex={pageIndex}
            pageSize={pageSize}
            testId="assessments-pagination"
            to={to}
            total={rowCount}
          />
        )}
      </div>
    </div>
  );
}

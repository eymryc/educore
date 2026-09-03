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
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
} from "@/presentation/components/shared/DataTableActionsMenu";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import {
  ContentSkeleton,
  DataTableSkeleton,
} from "@/presentation/components/shared/DataTableSkeleton";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";
import {
  listAcademicYears,
  listClassGroups,
} from "@/infrastructure/api/resources/academic";
import {
  cancelDisciplineRecord,
  deleteDisciplineRecord,
  listDisciplineRecords,
  validateDisciplineRecord,
} from "@/infrastructure/api/resources/discipline";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import type { AcademicYear, ClassGroup } from "@/shared/types/academic.types";
import {
  DISCIPLINE_STATUS_LABELS,
  DISCIPLINE_TYPE_LABELS,
  canCancelDiscipline,
  canDeleteDiscipline,
  canEditDiscipline,
  canValidateDiscipline,
  filterDisciplineRecords,
  type DisciplinaryRecord,
  type DisciplinaryRecordStatus,
  type DisciplinaryRecordType,
} from "@/shared/types/discipline.types";
import { studentFullName } from "@/shared/types/student.types";

const DEFAULT_PAGE_SIZE = 10;

const DISCIPLINE_TABLE_SKELETON_COLUMNS = [
  { kind: "checkbox" as const, width: "w-4" },
  { kind: "text" as const, width: "w-24" },
  { kind: "text" as const, width: "w-32" },
  { kind: "text" as const, width: "w-40" },
  { kind: "badge" as const, width: "w-20" },
  { kind: "badge" as const, width: "w-16" },
  { kind: "actions" as const, width: "w-8" },
];

function statusTone(
  status: DisciplinaryRecordStatus
): "warning" | "success" | "neutral" | "error" {
  if (status === "VALIDATED") return "success";
  if (status === "CANCELLED") return "neutral";
  return "warning";
}

function typeTone(
  type: DisciplinaryRecordType
): "info" | "warning" | "error" | "neutral" {
  if (type === "EXCLUSION" || type === "DISCIPLINARY_COUNCIL") return "error";
  if (type === "SANCTION") return "warning";
  if (type === "WARNING") return "info";
  return "neutral";
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

function DisciplineManagementInner() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get("student_id") ?? "";

  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [classId, setClassId] = useState("");
  const [yearId, setYearId] = useState("");
  const [studentId, setStudentId] = useState(initialStudentId);
  const [sorting, setSorting] = useState<SortingState>([{ id: "occurred_at", desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const canCreate = can(user, "discipline.create");
  const canUpdate = can(user, "discipline.update");
  const canDelete = can(user, "discipline.delete");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, yearList, classList] = await Promise.all([
        listDisciplineRecords({
          ...(studentId ? { student_id: studentId } : {}),
          ...(yearId ? { academic_year_id: yearId } : {}),
          ...(type ? { type } : {}),
          ...(classId ? { class_group_id: classId } : {}),
        }),
        listAcademicYears(),
        listClassGroups(),
      ]);
      const activeYear = yearList.find((y) => y.is_active) ?? yearList[0];
      const scopedYearId = yearId ? Number(yearId) : activeYear?.id;
      setRecords(list);
      setYears(yearList);
      setClasses(
        scopedYearId ? classList.filter((c) => c.academic_year_id === scopedYearId) : classList
      );
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [studentId, yearId, type, classId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(
    () =>
      filterDisciplineRecords(records, {
        search,
        status,
        type,
        classGroupId: classId,
        yearId,
        studentId,
      }),
    [records, search, status, type, classId, yearId, studentId]
  );

  const hasFilters = Boolean(search || type || status || classId || yearId || studentId);

  function clearFilters() {
    setSearch("");
    setType("");
    setStatus("");
    setClassId("");
    setYearId("");
    setStudentId("");
  }

  function patch(updated: DisciplinaryRecord) {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  async function handleValidate(row: DisciplinaryRecord) {
    if (!canUpdate || !canValidateDiscipline(row.status)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      patch(await validateDisciplineRecord(row.id));
      setNotice("Incident validé.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(row: DisciplinaryRecord) {
    if (!canUpdate || !canCancelDiscipline(row.status)) return;
    if (!(await confirmDialog("Annuler cet enregistrement disciplinaire ?"))) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      patch(await cancelDisciplineRecord(row.id));
      setNotice("Incident annulé.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(row: DisciplinaryRecord) {
    if (!canDelete || !canDeleteDiscipline(row.status)) return;
    if (!(await confirmDialog("Supprimer cet incident ?", { destructive: true }))) return;
    setBusy(true);
    setError(null);
    try {
      await deleteDisciplineRecord(row.id);
      setRecords((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const columnHelper = useMemo(() => createColumnHelper<DisciplinaryRecord>(), []);

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
      columnHelper.accessor("occurred_at", {
        header: "Date",
        cell: (info) => (
          <span className="font-mono-data text-[12px] text-on-surface-variant tracking-wide">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor((row) => (row.student ? studentFullName(row.student) : ""), {
        id: "student",
        header: "Élève",
        cell: ({ row }) =>
          row.original.student ? (
            <Link
              className="font-semibold text-on-surface truncate hover:text-primary transition-colors"
              href={`/students/${row.original.student_id}`}
            >
              {studentFullName(row.original.student)}
            </Link>
          ) : (
            <Link
              className="text-on-surface-variant hover:text-primary transition-colors"
              href={`/students/${row.original.student_id}`}
            >
              Élève #{row.original.student_id}
            </Link>
          ),
      }),
      columnHelper.accessor("title", {
        header: "Titre",
        cell: (info) => <span className="font-medium text-on-surface">{info.getValue()}</span>,
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: (info) => (
          <StatusBadge
            label={DISCIPLINE_TYPE_LABELS[info.getValue()] ?? info.getValue()}
            tone={typeTone(info.getValue())}
            withDot
          />
        ),
      }),
      columnHelper.accessor("status", {
        header: "Statut",
        cell: (info) => (
          <StatusBadge
            label={DISCIPLINE_STATUS_LABELS[info.getValue()]}
            tone={statusTone(info.getValue())}
            withDot
          />
        ),
      }),
      columnHelper.display({
        id: "actions",
        enableSorting: false,
        header: "Actions",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <DataTableActionsMenu
              ariaLabel={`Actions pour ${r.title}`}
              items={[
                ...(canValidateDiscipline(r.status) && canUpdate
                  ? [
                      {
                        kind: "button" as const,
                        label: "Valider",
                        icon: "check_circle",
                        onClick: () => void handleValidate(r),
                        disabled: busy,
                      },
                    ]
                  : []),
                ...(canCancelDiscipline(r.status) && canUpdate
                  ? [
                      {
                        kind: "button" as const,
                        label: "Annuler",
                        icon: "cancel",
                        onClick: () => void handleCancel(r),
                        disabled: busy,
                      },
                    ]
                  : []),
                ...crudRowActions({
                  edit: canEditDiscipline(r.status)
                    ? { resource: "discipline", recordId: r.id }
                    : undefined,
                  delete: canDeleteDiscipline(r.status)
                    ? {
                        onClick: () => void handleDelete(r),
                        disabled: busy,
                      }
                    : undefined,
                  canUpdate: canEditDiscipline(r.status) && canUpdate,
                  canDelete: canDeleteDiscipline(r.status) && canDelete,
                }),
              ]}
            />
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnHelper, canUpdate, canDelete, busy]
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
  }, [search, status, type, classId, yearId, studentId]);

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
      {notice && (
        <div
          className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm font-body-sm"
          role="status"
        >
          {notice}
        </div>
      )}

      <div className="ui-table-shell" data-testid="discipline-table">
        <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
          <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              aria-label="Rechercher"
              className="ui-search-input ml-sm h-full"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre ou élève…"
              type="text"
              value={search}
            />
          </div>
          <select
            aria-label="Filtrer par type"
            className="ui-input cursor-pointer h-10 py-0"
            onChange={(e) => setType(e.target.value)}
            value={type}
          >
            <option value="">Tous les types</option>
            {(Object.keys(DISCIPLINE_TYPE_LABELS) as DisciplinaryRecordType[]).map((t) => (
              <option key={t} value={t}>
                {DISCIPLINE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrer par statut"
            className="ui-input cursor-pointer h-10 py-0"
            onChange={(e) => setStatus(e.target.value)}
            value={status}
          >
            <option value="">Tous les statuts</option>
            {(Object.keys(DISCIPLINE_STATUS_LABELS) as DisciplinaryRecordStatus[]).map((s) => (
              <option key={s} value={s}>
                {DISCIPLINE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
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
            aria-label="Filtrer par année"
            className="ui-input cursor-pointer h-10 py-0"
            onChange={(e) => setYearId(e.target.value)}
            value={yearId}
          >
            <option value="">Toutes les années</option>
            {years.map((y) => (
              <option key={y.id} value={String(y.id)}>
                {y.name}
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
                label="Nouvel incident"
                resource="discipline"
              />
            )}
          </div>
        </div>

        <div className="overflow-auto">
          {loading ? (
            <DataTableSkeleton
              columns={DISCIPLINE_TABLE_SKELETON_COLUMNS}
              label="Chargement des incidents…"
              labels={["", "Date", "Élève", "Titre", "Type", "Statut", ""]}
              rows={10}
              testId="discipline-loading"
            />
          ) : rowCount === 0 ? (
            <div
              className="flex flex-col items-center justify-center px-lg py-2xl text-center"
              data-testid="discipline-empty"
            >
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50 mb-md">
                gavel
              </span>
              <h3 className="font-title-md text-on-surface mb-xs">
                Aucun enregistrement disciplinaire
              </h3>
              <p className="font-body-sm text-on-surface-variant max-w-sm mb-lg">
                Aucun résultat pour ces filtres, ou aucun incident n&apos;a encore été saisi.
              </p>
              <div className="flex flex-wrap gap-sm justify-center">
                {hasFilters && (
                  <button className="ui-btn-secondary" onClick={clearFilters} type="button">
                    Effacer les filtres
                  </button>
                )}
                {canCreate && (
                  <CrudCreateLink label="Nouvel incident" resource="discipline" />
                )}
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
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
            entityLabel="incidents"
            filteredHint={
              filtered.length !== records.length ? `filtre sur ${records.length}` : undefined
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
            testId="discipline-pagination"
            to={to}
            total={rowCount}
          />
        )}
      </div>
    </div>
  );
}

export function DisciplineManagementContent() {
  return (
    <Suspense fallback={<ContentSkeleton testId="discipline-loading" variant="table" />}>
      <DisciplineManagementInner />
    </Suspense>
  );
}

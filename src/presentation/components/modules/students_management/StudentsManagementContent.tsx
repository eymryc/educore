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
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import { listClassGroups, listLevels, listAcademicYears } from "@/infrastructure/api/resources/academic";
import { deleteStudent, listStudents } from "@/infrastructure/api/resources/students";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import type { ClassGroup } from "@/shared/types/academic.types";
import type { AcademicRef, Student } from "@/shared/types/student.types";
import {
  STUDENT_STATUS_LABELS,
  filterStudents,
  studentFullName,
  type StudentStatus,
} from "@/shared/types/student.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";
import {
  DataTableSkeleton,
  STUDENTS_TABLE_SKELETON_COLUMNS,
} from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import {
  crudRowActions,
  DataTableActionsMenu,
} from "@/presentation/components/shared/DataTableActionsMenu";

const DEFAULT_PAGE_SIZE = 10;

function statusTone(status: StudentStatus): "success" | "error" | "warning" | "neutral" {
  if (status === "active") return "success";
  if (status === "suspended") return "warning";
  return "error";
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

export function StudentsManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [levels, setLevels] = useState<AcademicRef[]>([]);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [levelId, setLevelId] = useState("");
  const [classGroupId, setClassGroupId] = useState("");
  const [status, setStatus] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "last_name", desc: false }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canCreate = can(user, "students.create");
  const canUpdate = can(user, "students.update");
  const canDelete = can(user, "students.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [list, levelList, classList, yearList] = await Promise.all([
        listStudents(),
        listLevels(),
        listClassGroups(),
        listAcademicYears(),
      ]);
      const activeYear = yearList.find((y) => y.is_active) ?? yearList[0];
      const yearClasses = activeYear
        ? classList.filter((c) => c.academic_year_id === activeYear.id)
        : classList;
      setStudents(list);
      setLevels(levelList);
      setClassGroups(yearClasses);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filteredClassGroups = useMemo(() => {
    if (!levelId) return classGroups;
    return classGroups.filter((c) => String(c.level_id ?? "") === levelId);
  }, [classGroups, levelId]);

  const filtered = useMemo(
    () => filterStudents(students, { search, levelId, classGroupId, status }),
    [students, search, levelId, classGroupId, status]
  );

  const hasFilters = Boolean(search || levelId || classGroupId || status);

  function clearFilters() {
    setSearch("");
    setLevelId("");
    setClassGroupId("");
    setStatus("");
  }

  async function handleDelete(student: Student) {
    if (!canDelete) return;
    if (!(await confirmDialog(`Supprimer ${studentFullName(student)} ?`, { destructive: true })))
      return;
    setDeletingId(student.id);
    try {
      await deleteStudent(student.id);
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  const columnHelper = useMemo(() => createColumnHelper<Student>(), []);

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
            aria-label={`Sélectionner ${studentFullName(row.original)}`}
            checked={row.getIsSelected()}
            className="size-4 rounded border-outline-variant accent-primary cursor-pointer"
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            type="checkbox"
          />
        ),
      }),
      columnHelper.accessor("last_name", {
        header: "Nom",
        cell: ({ row }) => {
          const s = row.original;
          return (
            <Link
              className="font-semibold text-on-surface truncate hover:text-primary transition-colors"
              href={`/students/${s.id}`}
            >
              {s.last_name}
            </Link>
          );
        },
      }),
      columnHelper.accessor("first_name", {
        header: "Prénom",
        cell: ({ row }) => (
          <Link
            className="text-on-surface truncate hover:text-primary transition-colors"
            href={`/students/${row.original.id}`}
          >
            {row.original.first_name}
          </Link>
        ),
      }),
      columnHelper.accessor("email", {
        header: "E-mail",
        cell: (info) => (
          <span className="text-[13px] text-on-surface-variant truncate font-mono-data">
            {info.getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.accessor("matricule", {
        header: "Matricule",
        cell: (info) => (
          <span className="font-mono-data text-[12px] text-on-surface-variant tracking-wide">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.class_group?.name ?? "", {
        id: "class",
        header: "Classe",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-on-surface">
              {row.original.class_group?.name || "—"}
            </div>
            <div className="text-[12px] text-on-surface-variant">
              {row.original.level?.name || "Niveau —"}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Statut",
        cell: (info) => (
          <StatusBadge
            label={STUDENT_STATUS_LABELS[info.getValue()]}
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
          const s = row.original;
          const name = studentFullName(s);
          return (
            <DataTableActionsMenu
              ariaLabel={`Actions pour ${name}`}
              items={crudRowActions({
                view: {
                  href: `/students/${s.id}`,
                  label: "Voir le dossier",
                  icon: "folder_open",
                },
                edit: { resource: "students", recordId: s.id },
                delete: {
                  onClick: () => void handleDelete(s),
                  disabled: deletingId === s.id,
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
  }, [search, levelId, classGroupId, status]);

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
                aria-label="Rechercher un élève"
                className="ui-search-input ml-sm h-full"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou matricule..."
                type="text"
                value={search}
              />
            </div>
            <select
              aria-label="Filtrer par niveau"
              className="ui-input cursor-pointer h-10 py-0"
              onChange={(e) => {
                setLevelId(e.target.value);
                setClassGroupId("");
              }}
              value={levelId}
            >
              <option value="">Tous les niveaux</option>
              {levels.map((l) => (
                <option key={l.id} value={String(l.id)}>
                  {l.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrer par classe"
              className="ui-input cursor-pointer h-10 py-0"
              onChange={(e) => setClassGroupId(e.target.value)}
              value={classGroupId}
            >
              <option value="">Toutes les classes</option>
              {filteredClassGroups.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
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
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="suspended">Suspendu</option>
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
                  label="Nouvel élève"
                  resource="students"
                />
              )}
            </div>
        </div>

        <div className="overflow-auto">
          {loading ? (
            <DataTableSkeleton
              columns={STUDENTS_TABLE_SKELETON_COLUMNS}
              label="Chargement des élèves…"
              labels={["", "Nom", "Prénom", "E-mail", "Matricule", "Classe", "Statut", ""]}
              rows={10}
              testId="students-loading"
            />
          ) : rowCount === 0 ? (
            <div
              className="flex flex-col items-center justify-center px-lg py-2xl text-center"
              data-testid="students-empty"
            >
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50 mb-md">
                group_off
              </span>
              <h3 className="font-title-md text-on-surface mb-xs">Aucun élève trouvé</h3>
              <p className="font-body-sm text-on-surface-variant max-w-sm mb-lg">
                Aucun résultat pour ces filtres, ou l&apos;annuaire est encore vide.
              </p>
              <div className="flex flex-wrap gap-sm justify-center">
                {hasFilters && (
                  <button className="ui-btn-secondary" onClick={clearFilters} type="button">
                    Effacer les filtres
                  </button>
                )}
                {canCreate && <CrudCreateLink label="Nouvel élève" resource="students" />}
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" data-testid="students-table">
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
            entityLabel="élèves"
            filteredHint={
              filtered.length !== students.length
                ? `filtre sur ${students.length}`
                : undefined
            }
            from={from}
            onFirstPage={() => table.setPageIndex(0)}
            onLastPage={() => table.setPageIndex(table.getPageCount() - 1)}
            onNextPage={() => table.nextPage()}
            onPageChange={(index) => table.setPageIndex(index)}
            onPageSizeChange={(size) =>
              setPagination({ pageIndex: 0, pageSize: size })
            }
            onPreviousPage={() => table.previousPage()}
            pageCount={table.getPageCount()}
            pageIndex={pageIndex}
            pageSize={pageSize}
            testId="students-pagination"
            to={to}
            total={rowCount}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import { Checkbox } from "@/presentation/components/shared/Checkbox";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import { listClassGroups, listLevels, listAcademicYears } from "@/infrastructure/api/resources/academic";
import { deleteStudent, listStudentsPage } from "@/infrastructure/api/resources/students";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import type { ClassGroup } from "@/shared/types/academic.types";
import type { AcademicRef, Student } from "@/shared/types/student.types";
import {
  STUDENT_STATUS_LABELS,
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
import { DataTableRefreshButton } from "@/presentation/components/shared/DataTableControls";
import { tableRowClass, DEFAULT_TABLE_PAGE_SIZE } from "@/presentation/components/shared/data-table-utils";
import {
  DATA_TABLE_CREATE_CLASS,
  DataTableClearFilters,
  DataTableEmpty,
  DataTableFilterSelect,
  DataTableSearch,
  DataTableSelectionBar,
  DataTableShell,
  DataTableToolbar,
  DataTableToolbarActions,
} from "@/presentation/components/shared/DataTable";
import { emptyPaginationMeta, type PaginationMeta } from "@/shared/types/api.types";

const AVATAR_PALETTES = [
  "bg-primary-fixed text-on-primary-fixed",
  "bg-secondary-fixed text-on-secondary-fixed",
  "bg-tertiary-fixed text-on-tertiary-fixed",
] as const;

function statusTone(status: StudentStatus): "success" | "error" | "warning" | "neutral" {
  if (status === "active") return "success";
  if (status === "suspended") return "warning";
  return "error";
}

function studentInitials(student: Pick<Student, "first_name" | "last_name">): string {
  const last = student.last_name?.trim().charAt(0) ?? "";
  const first = student.first_name?.trim().charAt(0) ?? "";
  return `${last}${first}`.toUpperCase() || "?";
}

function avatarTone(student: Pick<Student, "id" | "last_name">): string {
  const seed = student.id + (student.last_name?.charCodeAt(0) ?? 0);
  return AVATAR_PALETTES[Math.abs(seed) % AVATAR_PALETTES.length];
}

function StudentAvatar({ student }: { student: Student }) {
  if (student.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        className="w-7 h-7 shrink-0 object-cover bg-surface-container-high rounded-md"
        height={28}
        src={student.avatar_url}
        width={28}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`w-7 h-7 shrink-0 inline-flex items-center justify-center text-[10px] font-semibold tracking-wide rounded-md ${avatarTone(student)}`}
    >
      {studentInitials(student)}
    </span>
  );
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
  const [meta, setMeta] = useState<PaginationMeta>(emptyPaginationMeta());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_TABLE_PAGE_SIZE);
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
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canCreate = can(user, "students.create");
  const canUpdate = can(user, "students.update");
  const canDelete = can(user, "students.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const result = await listStudentsPage({
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(levelId ? { level_id: levelId } : {}),
        ...(classGroupId ? { class_group_id: classGroupId } : {}),
        page,
        per_page: perPage,
      });
      setStudents(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- search/filters/page/perPage drive API filters
  }, [search, status, levelId, classGroupId, page, perPage]);

  useEffect(() => {
    void (async () => {
      try {
        const [levelList, classList, yearList] = await Promise.all([
          listLevels(),
          listClassGroups(),
          listAcademicYears(),
        ]);
        const activeYear = yearList.find((y) => y.is_active) ?? yearList[0];
        const yearClasses = activeYear
          ? classList.filter((c) => c.academic_year_id === activeYear.id)
          : classList;
        setLevels(levelList);
        setClassGroups(yearClasses);
      } catch (err) {
        setError(getAuthErrorMessage(err));
      }
    })();
  }, []);

  const filteredClassGroups = useMemo(() => {
    if (!levelId) return classGroups;
    return classGroups.filter((c) => String(c.level_id ?? "") === levelId);
  }, [classGroups, levelId]);

  const hasFilters = Boolean(search || levelId || classGroupId || status);

  function clearFilters() {
    setSearch("");
    setLevelId("");
    setClassGroupId("");
    setStatus("");
    setPage(1);
  }

  async function handleDelete(student: Student) {
    if (!canDelete) return;
    if (!(await confirmDialog(`Supprimer ${studentFullName(student)} ?`, { destructive: true })))
      return;
    setDeletingId(student.id);
    try {
      await deleteStudent(student.id);
      if (students.length <= 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await reload();
      }
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
          <Checkbox
            ariaLabel="Tout sélectionner"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
            onChange={(checked) => table.toggleAllPageRowsSelected(checked)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            ariaLabel={`Sélectionner ${studentFullName(row.original)}`}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={(checked) => row.toggleSelected(checked)}
          />
        ),
      }),
      columnHelper.accessor("last_name", {
        header: "Nom",
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex items-center gap-sm min-w-0">
              <StudentAvatar student={s} />
              <Link
                className="font-semibold text-[13px] leading-5 text-on-surface truncate hover:text-primary transition-colors min-w-0"
                href={`/students/${s.id}`}
              >
                {s.last_name}
              </Link>
            </div>
          );
        },
      }),
      columnHelper.accessor("first_name", {
        header: "Prénom",
        cell: ({ row }) => (
          <Link
            className="text-[13px] leading-5 text-on-surface truncate hover:text-primary transition-colors"
            href={`/students/${row.original.id}`}
          >
            {row.original.first_name}
          </Link>
        ),
      }),
      columnHelper.accessor("email", {
        header: "E-mail",
        cell: (info) => {
          const email = info.getValue();
          if (!email) {
            return <span className="text-on-surface-variant/50">—</span>;
          }
          return (
            <span className="text-[12px] leading-5 text-on-surface-variant truncate font-mono-data max-w-[220px] block">
              {email}
            </span>
          );
        },
      }),
      columnHelper.accessor("matricule", {
        header: "Matricule",
        cell: (info) => (
          <span className="font-mono-data text-[11px] leading-5 tracking-wide text-on-surface-variant">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.class_group?.name ?? "", {
        id: "class",
        header: "Classe",
        cell: ({ row }) => {
          const className = row.original.class_group?.name;
          const levelName = row.original.level?.name;
          if (!className) {
            return <span className="text-on-surface-variant/50">—</span>;
          }
          return (
            <div className="flex items-center gap-xs min-w-0">
              <span className="inline-flex items-center h-5 px-sm rounded-md bg-secondary-fixed/50 text-on-secondary-fixed-variant text-[11px] font-semibold whitespace-nowrap">
                {className}
              </span>
              {levelName ? (
                <span className="text-[11px] leading-5 text-on-surface-variant truncate">
                  {levelName}
                </span>
              ) : null}
            </div>
          );
        },
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
    data: students,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: meta.last_page,
  });

  useEffect(() => {
    setRowSelection({});
  }, [search, levelId, classGroupId, status, page, perPage]);

  const from = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);
  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

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

      <DataTableShell>
        <DataTableToolbar>
          <DataTableSearch
            ariaLabel="Rechercher un élève"
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Rechercher par nom ou matricule..."
            value={search}
          />
          <DataTableFilterSelect
            ariaLabel="Filtrer par statut"
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: "active", label: "Actif" },
              { value: "inactive", label: "Inactif" },
              { value: "suspended", label: "Suspendu" },
            ]}
            placeholder="Tous les statuts"
            value={status}
          />
          <DataTableFilterSelect
            ariaLabel="Filtrer par niveau"
            onChange={(v) => {
              setLevelId(v);
              setClassGroupId("");
              setPage(1);
            }}
            options={levels.map((l) => ({ value: String(l.id), label: l.name }))}
            placeholder="Tous les niveaux"
            value={levelId}
          />
          <DataTableFilterSelect
            ariaLabel="Filtrer par classe"
            onChange={(v) => {
              setClassGroupId(v);
              setPage(1);
            }}
            options={filteredClassGroups.map((c) => ({ value: String(c.id), label: c.name }))}
            placeholder="Toutes les classes"
            value={classGroupId}
          />
          {hasFilters && <DataTableClearFilters onClick={clearFilters} />}
          <DataTableToolbarActions>
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <CrudCreateLink
                className={DATA_TABLE_CREATE_CLASS}
                label="Nouvel élève"
                resource="students"
              />
            )}
          </DataTableToolbarActions>
        </DataTableToolbar>

        <DataTableSelectionBar
          count={selectedCount}
          entityLabel="élève"
          onClear={() => setRowSelection({})}
        />

        <div className="overflow-x-auto">
          {loading ? (
            <DataTableSkeleton
              columns={STUDENTS_TABLE_SKELETON_COLUMNS}
              label="Chargement des élèves…"
              labels={["", "Nom", "Prénom", "E-mail", "Matricule", "Classe", "Statut", ""]}
              rows={10}
              testId="students-loading"
            />
          ) : meta.total === 0 ? (
            <DataTableEmpty
              description={
                hasFilters
                  ? "Aucun résultat pour ces filtres. Essayez un autre nom, niveau ou statut."
                  : "L'annuaire est encore vide. Ajoutez le premier élève pour commencer."
              }
              icon="group_off"
              testId="students-empty"
              title="Aucun élève trouvé"
            >
              {hasFilters && (
                <button className="ui-btn-secondary" onClick={clearFilters} type="button">
                  Effacer les filtres
                </button>
              )}
              {canCreate && <CrudCreateLink label="Nouvel élève" resource="students" />}
            </DataTableEmpty>
          ) : (
            <table className="w-full text-left border-collapse" data-testid="students-table">
              <thead className="sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr className="ui-table-head-row" key={headerGroup.id}>
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
                          className={`px-md py-[6px] whitespace-nowrap ${
                            isActions ? "text-right w-12" : isSelect ? "w-10 px-md" : ""
                          }`}
                          key={header.id}
                          scope="col"
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
              <tbody className="text-body-sm font-body-sm">
                {table.getRowModel().rows.map((row) => {
                  const selected = row.getIsSelected();
                  return (
                    <tr
                      className={tableRowClass(row.index, selected)}
                      key={row.id}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isActions = cell.column.id === "actions";
                        const isSelect = cell.column.id === "select";
                        return (
                          <td
                            className={`px-md py-[6px] align-middle ${
                              isActions ? "text-right overflow-visible" : ""
                            } ${isSelect ? "px-md" : ""}`}
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

        {!loading && meta.total > 0 && (
          <DataTablePagination
            canNextPage={meta.current_page < meta.last_page}
            canPreviousPage={meta.current_page > 1}
            entityLabel="élèves"
            from={from}
            onFirstPage={() => setPage(1)}
            onLastPage={() => setPage(meta.last_page)}
            onNextPage={() => setPage((p) => p + 1)}
            onPageChange={(index) => setPage(index + 1)}
            onPageSizeChange={(size) => {
              setPerPage(size);
              setPage(1);
            }}
            onPreviousPage={() => setPage((p) => Math.max(1, p - 1))}
            pageCount={meta.last_page}
            pageIndex={meta.current_page - 1}
            pageSize={perPage}
            testId="students-pagination"
            to={to}
            total={meta.total}
          />
        )}
      </DataTableShell>
    </div>
  );
}
